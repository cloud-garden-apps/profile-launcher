import { supabase } from "./supabase";

const APP_ID = import.meta.env.VITE_APP_ID;

export type Thought = {
  id: string;
  content: string;
  ideas: string[] | null;
  created_at: string;
};

export const saveThought = async (content: string, ideas: string[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("thoughts")
    .insert({ user_id: user.id, content, ideas, app_id: APP_ID })
    .select()
    .single();

  if (error) throw error;
  return data as Thought;
};

export const getThoughts = async () => {
  const { data, error } = await supabase
    .from("thoughts")
    .select("*")
    .eq("app_id", APP_ID)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Thought[];
};

export const deleteThought = async (id: string) => {
  const { error } = await supabase
    .from("thoughts")
    .delete()
    .eq("id", id)
    .eq("app_id", APP_ID);
  if (error) throw error;
};
