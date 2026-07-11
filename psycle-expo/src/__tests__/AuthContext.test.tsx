import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";

const mockGetSession = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      })),
      signOut: jest.fn(),
    },
  },
}));

import { AuthProvider, useAuth } from "../../lib/AuthContext";

function AuthProbe({ onSession }: { onSession: (session: Session | null) => void }) {
  const { session } = useAuth();
  React.useEffect(() => onSession(session), [onSession, session]);
  return null;
}

describe("AuthProvider guest restoration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("keeps a stored development guest when Supabase has no session", async () => {
    const guestSession = {
      access_token: "guest_token",
      refresh_token: "guest_refresh",
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id: "guest_user_saved",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: "2026-07-11T00:00:00.000Z",
      },
    } as Session;
    jest.spyOn(AsyncStorage, "getItem").mockResolvedValue(JSON.stringify(guestSession));
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const onSession = jest.fn();

    render(
      <AuthProvider>
        <AuthProbe onSession={onSession} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(onSession).toHaveBeenLastCalledWith(
        expect.objectContaining({ user: expect.objectContaining({ id: "guest_user_saved" }) })
      );
    });
  });
});
