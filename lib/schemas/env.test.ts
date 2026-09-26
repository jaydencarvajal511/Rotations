import { describe, expect, it } from "vitest";

import { parseEnv, publicEnvSchema, serverEnvSchema } from "./env";

describe("parseEnv", () => {
  it("returns parsed public env when valid", () => {
    const env = parseEnv(publicEnvSchema, {
      NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abc.supabase.co");
  });

  it("rejects a malformed Supabase URL", () => {
    expect(() =>
      parseEnv(publicEnvSchema, {
        NEXT_PUBLIC_SUPABASE_URL: "not a url",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("names every missing server var in the error", () => {
    expect(() => parseEnv(serverEnvSchema, {})).toThrow(
      /SPOTIFY_CLIENT_ID[\s\S]*SPOTIFY_CLIENT_SECRET/,
    );
  });

  it("treats empty strings as missing", () => {
    expect(() =>
      parseEnv(serverEnvSchema, {
        SPOTIFY_CLIENT_ID: "",
        SPOTIFY_CLIENT_SECRET: "secret",
      }),
    ).toThrow(/SPOTIFY_CLIENT_ID/);
  });
});
