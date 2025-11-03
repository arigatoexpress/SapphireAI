import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';

interface CommunityComment {
  id: string;
  author: string;
  message: string;
  timestamp: string;
  avatar?: string;
}

const STORAGE_KEY = 'sapphire-community-comments';

const useCommunityComments = (user: User | null): [CommunityComment[], (message: string) => void] => {
  const [comments, setComments] = useState<CommunityComment[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CommunityComment[];
        setComments(parsed);
      }
    } catch (err) {
      console.error('Failed to load community comments', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    } catch (err) {
      console.error('Failed to persist community comments', err);
    }
  }, [comments]);

  const addComment = (message: string) => {
    if (!user) return;
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    const newComment: CommunityComment = {
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

export type { CommunityComment };
export default useCommunityComments;

