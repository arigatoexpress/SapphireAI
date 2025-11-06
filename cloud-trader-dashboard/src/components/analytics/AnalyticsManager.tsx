import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'sapphire-analytics-consent-v1';

const readStoredConsent = (): 'granted' | 'denied' | 'undecided' => {
  if (typeof window === 'undefined') return 'undecided';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'granted' || stored === 'denied') {
    return stored;
  }
  return 'undecided';
};

const writeStoredConsent = (value: 'granted' | 'denied') => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, value);
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __sapphireAnalyticsLoaded?: boolean;
  }
}

const loadGa4 = (analyticsId: string) => {
  if (typeof document === 'undefined') return;
  if (window.__sapphireAnalyticsLoaded) return;

  const scriptId = 'ga4-sapphire-loader';
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
    script.id = scriptId;
    document.head.appendChild(script);
  }

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', analyticsId, {
    anonymize_ip: true,
    allow_google_signals: false,
    transport_type: 'beacon',
  });

  window.__sapphireAnalyticsLoaded = true;
};

const loadPlausible = (domain: string) => {
  if (typeof document === 'undefined') return;
  const scriptId = 'plausible-sapphire-loader';
  if (document.getElementById(scriptId)) return;

  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = domain;
  script.src = 'https://plausible.io/js/script.manual.js';
  script.id = scriptId;
  document.head.appendChild(script);
};

const AnalyticsManager = () => {
  const analyticsId = import.meta.env.VITE_ANALYTICS_ID as string | undefined;
  const provider = (import.meta.env.VITE_ANALYTICS_PROVIDER as string | undefined)?.toLowerCase() ?? 'ga4';
  const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;

  const [consent, setConsent] = useState<'granted' | 'denied' | 'undecided'>(() => readStoredConsent());
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const shouldRenderBanner = useMemo(() => {
    if (!analyticsId) return false;
    if (consent !== 'undecided') return false;
    return !bannerDismissed;
  }, [analyticsId, consent, bannerDismissed]);

  useEffect(() => {
    if (!analyticsId || consent !== 'granted') return;

    if (provider === 'ga4') {
      loadGa4(analyticsId);
    } else if (provider === 'plausible' && plausibleDomain) {
      loadPlausible(plausibleDomain);
    }
  }, [analyticsId, consent, provider, plausibleDomain]);

  if (!analyticsId) {
    return null;
  }

  if (shouldRenderBanner) {
    return (
      <div className="fixed bottom-4 left-1/2 z-40 w-[min(90%,480px)] -translate-x-1/2 rounded-3xl border border-brand-border/60 bg-brand-abyss/90 p-5 text-xs text-brand-ice shadow-sapphire backdrop-blur-xl">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-brand-accent-blue/20 p-2 text-brand-accent-blue">🔒</div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-brand-ice">Privacy-first analytics</p>
              <p className="text-brand-ice/70">
                Sapphire only collects anonymous session telemetry after you opt in. IP addresses are anonymized, signals stay within our GCP perimeter, and you can change your preference anytime.
              </p>
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-brand-ice/60">Provider: {provider === 'plausible' ? 'Plausible (self-hosted)' : 'Google Analytics 4 (IP anonymized)'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                writeStoredConsent('denied');
                setConsent('denied');
                setBannerDismissed(true);
              }}
              className="rounded-full border border-brand-border/70 px-4 py-2 text-xs font-medium text-brand-ice/80 transition-colors duration-200 hover:bg-brand-border/40"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={() => {
                writeStoredConsent('granted');
                setConsent('granted');
                setBannerDismissed(true);
              }}
              className="rounded-full bg-brand-accent-blue/80 px-4 py-2 text-xs font-semibold text-brand-midnight shadow-sapphire transition-transform duration-200 hover:scale-[1.02]"
            >
              Enable analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setBannerDismissed(false);
        setConsent('undecided');
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }}
      className="fixed bottom-4 right-4 z-30 rounded-full border border-brand-border/60 bg-brand-abyss/80 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-brand-ice/70 shadow-sapphire transition hover:bg-brand-abyss/90"
    >
      Manage analytics
    </button>
  );
};

export default AnalyticsManager;
