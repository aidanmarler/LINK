import type { Profile } from './types';

//#region User

// Store User informmation globally
export const userProfile: { user: Profile | null } = $state({ user: null });
