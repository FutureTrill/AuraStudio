
import { supabase } from '../lib/supabase';
import { Message } from '../types';

export const storageService = {
  /**
   * Fetches the user's profile to check usage limits.
   */
  async getUserProfile(userId: string) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  /**
   * Fetches all projects created by the user (Prompt History).
   */
  async getAllProjects(userId: string) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project history:', error);
      return [];
    }
    return data;
  },

  /**
   * Fetches the most recent project created by the user.
   */
  async getLatestProject(userId: string) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching latest project:', error);
    }
    return data;
  },

  /**
   * Saves a new generation or update to the database.
   */
  async saveProject(userId: string, name: string, code: string, chatHistory: Message[]) {
    if (!supabase) return null;

    // 1. Insert the project
    const { error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name,
        code,
        chat_history: chatHistory
      });

    if (projectError) throw projectError;

    // 2. Increment usage count in profile
    const { data: profile } = await this.getUserProfile(userId);
    const newCount = (profile?.usage_count || 0) + 1;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ usage_count: newCount })
      .eq('id', userId);

    if (profileError) throw profileError;

    return { success: true, newCount };
  }
};
