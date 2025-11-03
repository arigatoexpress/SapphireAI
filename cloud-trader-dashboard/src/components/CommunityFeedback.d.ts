import React from 'react';
import { User } from 'firebase/auth';
interface Comment {
    id: string;
    author: string;
    message: string;
    timestamp: string;
    avatar?: string;
}
interface CommunityFeedbackProps {
    comments: Comment[];
    onSubmit: (message: string) => void;
    user: User | null;
    loading: boolean;
    onSignIn: () => Promise<void>;
    onSignOut: () => Promise<void>;
    authEnabled: boolean;
    authError?: string | null;
}
declare const CommunityFeedback: React.FC<CommunityFeedbackProps>;
export default CommunityFeedback;
