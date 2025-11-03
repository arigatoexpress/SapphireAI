const TOKEN_META = {
    BTCUSDT: {
        symbol: 'BTCUSDT',
        short: 'BTC',
        name: 'Bitcoin',
        gradient: 'from-amber-400 via-amber-500 to-amber-600',
        accent: 'text-amber-200',
    },
    ETHUSDT: {
        symbol: 'ETHUSDT',
        short: 'ETH',
        name: 'Ethereum',
        gradient: 'from-slate-300 via-slate-500 to-slate-700',
        accent: 'text-slate-200',
    },
    SOLUSDT: {
        symbol: 'SOLUSDT',
        short: 'SOL',
        name: 'Solana',
        gradient: 'from-purple-500 via-emerald-400 to-sky-500',
        accent: 'text-purple-100',
    },
    SUIUSDT: {
        symbol: 'SUIUSDT',
        short: 'SUI',
        name: 'Sui',
        gradient: 'from-sky-400 via-sky-500 to-blue-600',
        accent: 'text-blue-100',
    },
};
const FALLBACK_META = {
    symbol: 'USDT',
    short: 'CC',
    name: 'Crypto Asset',
    gradient: 'from-sapphire-500 via-sapphire-600 to-sapphire-800',
    accent: 'text-slate-200',
};
export const resolveTokenMeta = (symbol) => {
    if (!symbol)
        return FALLBACK_META;
    const key = symbol.toUpperCase();
    return TOKEN_META[key] ?? {
        ...FALLBACK_META,
        symbol: key,
        short: key.replace('USDT', '').slice(0, 4) || FALLBACK_META.short,
    };
};
