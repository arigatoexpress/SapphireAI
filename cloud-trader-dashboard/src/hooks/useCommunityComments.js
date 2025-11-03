import { useEffect, useState } from 'react';
const STORAGE_KEY = 'sapphire-community-comments';
const useCommunityComments = (user) => {
    const [comments, setComments] = useState([]);
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                setComments(parsed);
            }
        }
        catch (err) {
            console.error('Failed to load community comments', err);
        }
    }, []);
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
        }
        catch (err) {
            console.error('Failed to persist community comments', err);
        }
    }, [comments]);
    const addComment = (message) => {
        if (!user)
            return;
        const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;
        const newComment = {
            id,
            author: user.displayName || user.email || 'Anonymous',
            message,
            timestamp: new Date().toISOString(),
            avatar: user.photoURL || undefined,
        };
        setComments((prev) => [newComment, ...prev].slice(0, 100));
    };
    return [comments, addComment];
};
export default useCommunityComments;
