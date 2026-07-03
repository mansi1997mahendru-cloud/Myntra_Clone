import { useAuthContext } from '../context/AuthContext';

/**
 * Custom hook to access the current authentication state
 * Returns: { user: User | null, loading: boolean }
 */
export const useAuth = () => {
  return useAuthContext();
};
