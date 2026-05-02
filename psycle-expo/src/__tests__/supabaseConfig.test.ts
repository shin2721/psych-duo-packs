import { resolveSupabaseRuntimeConfig } from "../../lib/supabaseConfig";

describe("resolveSupabaseRuntimeConfig", () => {
  test("keeps dev builds bootable with placeholders", () => {
    expect(resolveSupabaseRuntimeConfig({ EXPO_PUBLIC_APP_ENV: "dev" })).toEqual({
      supabaseUrl: "https://placeholder.supabase.co",
      supabaseAnonKey: "placeholder",
    });
  });

  test("rejects placeholder Supabase config in app production", () => {
    expect(() => resolveSupabaseRuntimeConfig({ EXPO_PUBLIC_APP_ENV: "prod" })).toThrow(
      "Production builds require"
    );
  });

  test("rejects placeholder Supabase config in Node production", () => {
    expect(() => resolveSupabaseRuntimeConfig({ NODE_ENV: "production" })).toThrow(
      "Production builds require"
    );
  });

  test("accepts real production Supabase config", () => {
    expect(
      resolveSupabaseRuntimeConfig({
        EXPO_PUBLIC_APP_ENV: "prod",
        EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        EXPO_PUBLIC_SUPABASE_ANON_KEY: "header.payload.signature",
      })
    ).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "header.payload.signature",
    });
  });
});
