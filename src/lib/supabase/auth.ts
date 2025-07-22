/* Profile */

import type { AuthSession } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient";
import type { Profile } from "$lib/types";

// Get Profile from UserID
export async function getProfile(session: AuthSession | null): Promise<Profile | null> {
    if (!session || !session.user) {
        console.error('No user session found');
        return null;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id) // assuming 'id' is the user ID column in your profiles table
        .single(); // since you're expecting only one result

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }

    return data as Profile;
}

// Check if a user is an admin
export async function checkAdminStatus(userId: string): Promise<boolean> {
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        return false;
    }

    return profile?.is_admin ?? false;
}
