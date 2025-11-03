interface CrowdSentimentState {
    totalVotes: number;
    bullishVotes: number;
    bearishVotes: number;
}
export declare const useCrowdSentiment: () => [CrowdSentimentState, (vote: "bullish" | "bearish") => void, () => void];
export default useCrowdSentiment;
