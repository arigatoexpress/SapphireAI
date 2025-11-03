import { User } from 'firebase/auth';
interface CommunityComment {
    id: string;
    author: string;
    message: string;
    timestamp: string;
    avatar?: string;
}
declare const useCommunityComments: (user: User | null) => [CommunityComment[], (message: string) => void];
export type { CommunityComment };
export default useCommunityComments;
