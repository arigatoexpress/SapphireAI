import { type User } from 'firebase/auth';
export interface LeaderboardEntry {
    publicId: string;
    displayName: string;
    avatarUrl?: string;
    points: number;
    lastActive?: string;
    checkIns?: number;
    comments?: number;
    votes?: number;
}
export interface SentimentSnapshot {
    dateKey: string;
    bullish: number;
    bearish: number;
    total: number;
    hasVoted: boolean;
}
export interface CommunityComment {
    id: string;
    publicId: string;
    displayName: string;
    message: string;
    createdAt: string;
    avatarUrl?: string;
    mentionedTickers: string[];
}
export declare const ensureMemberProfile: (user: User) => Promise<string>;
export declare const recordCheckIn: (user: User) => Promise<void>;
export declare const subscribeSentiment: (user: User | null, callback: (snapshot: SentimentSnapshot) => void) => import("@firebase/firestore").Unsubscribe;
export declare const castVote: (user: User, vote: "bullish" | "bearish") => Promise<void>;
export declare const subscribeLeaderboard: (callback: (entries: LeaderboardEntry[]) => void, limitSize?: number) => import("@firebase/firestore").Unsubscribe;
export declare const subscribeCommunityComments: (callback: (comments: CommunityComment[]) => void, limitSize?: number) => import("@firebase/firestore").Unsubscribe;
export declare const addCommunityComment: (user: User, message: string) => Promise<void>;
export declare const isRealtimeCommunityEnabled: () => boolean;
