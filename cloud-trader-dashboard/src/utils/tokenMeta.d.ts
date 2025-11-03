export interface TokenMeta {
    symbol: string;
    short: string;
    name: string;
    gradient: string;
    accent: string;
}
export declare const resolveTokenMeta: (symbol: string | undefined | null) => TokenMeta;
