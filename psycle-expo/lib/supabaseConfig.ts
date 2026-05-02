const PLACEHOLDER_SUPABASE_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_SUPABASE_ANON_KEY = "placeholder";

type SupabaseRuntimeEnv = {
  EXPO_PUBLIC_APP_ENV?: string;
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  NODE_ENV?: string;
};

function isProductionRuntime(env: SupabaseRuntimeEnv): boolean {
  return env.EXPO_PUBLIC_APP_ENV === "prod" || env.NODE_ENV === "production";
}

function isValidSupabaseUrl(value: string): boolean {
  return value.startsWith("https://") && value !== PLACEHOLDER_SUPABASE_URL;
}

function isValidAnonKey(value: string): boolean {
  return value !== PLACEHOLDER_SUPABASE_ANON_KEY && value.split(".").length === 3;
}

export function resolveSupabaseRuntimeConfig(env: SupabaseRuntimeEnv = process.env as SupabaseRuntimeEnv) {
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL || PLACEHOLDER_SUPABASE_URL;
  const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_SUPABASE_ANON_KEY;

  if (
    isProductionRuntime(env) &&
    (!isValidSupabaseUrl(supabaseUrl) || !isValidAnonKey(supabaseAnonKey))
  ) {
    throw new Error(
      "[Supabase] Production builds require EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}
