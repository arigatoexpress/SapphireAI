import { useEffect, useState } from 'react';
const STORAGE_KEY = 'sapphire-crowd-sentiment';
export const useCrowdSentiment = () => {
    const [state, setState] = useState({ totalVotes: 0, bullishVotes: 0, bearishVotes: 0 });
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                setState(parsed);
            }
        }
        catch (err) {
            console.error('Failed to read crowd sentiment state', err);
        }
    }, []);
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
        catch (err) {
            console.error('Failed to persist crowd sentiment state', err);
        }
    }, [state]);
    const castVote = (vote) => {
        setState((prev) => ({
            totalVotes: prev.totalVotes + 1,
            bullishVotes: vote === 'bullish' ? prev.bullishVotes + 1 : prev.bullishVotes,
            bearishVotes: vote === 'bearish' ? prev.bearishVotes + 1 : prev.bearishVotes,
        }));
    };
    const reset = () => {
        setState({ totalVotes: 0, bullishVotes: 0, bearishVotes: 0 });
    };
    return [state, castVote, reset];
};
export default useCrowdSentiment;
