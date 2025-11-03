import React from 'react';
interface CrowdSentimentWidgetProps {
    totalVotes: number;
    bullishVotes: number;
    bearishVotes: number;
    onVote: (vote: 'bullish' | 'bearish') => void;
    onReset?: () => void;
}
declare const CrowdSentimentWidget: React.FC<CrowdSentimentWidgetProps>;
export default CrowdSentimentWidget;
