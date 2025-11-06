declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
        __sapphireAnalyticsLoaded?: boolean;
    }
}
declare const AnalyticsManager: () => import("react/jsx-runtime").JSX.Element | null;
export default AnalyticsManager;
