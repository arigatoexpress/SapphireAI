import { type User } from 'firebase/auth';
interface UseAuthResult {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    enabled: boolean;
    error: string | null;
}
declare const useAuth: () => UseAuthResult;
export default useAuth;
