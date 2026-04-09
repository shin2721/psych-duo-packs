import React, { useState } from "react";
import { Pressable, Text } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

jest.mock("../../lib/billing", () => ({
  openBillingPortal: jest.fn(),
  restorePurchases: jest.fn(),
}));

jest.mock("../../lib/analytics", () => ({
  Analytics: {
    track: jest.fn(),
  },
}));

jest.mock("../../lib/app-state/billingStorage", () => ({
  persistPlanChangeSnapshot: jest.fn(),
}));

jest.mock("../../lib/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

const { openBillingPortal, restorePurchases } = require("../../lib/billing");
const { Analytics } = require("../../lib/analytics");
const { persistPlanChangeSnapshot } = require("../../lib/app-state/billingStorage");
const { useSettingsBillingActions } = require("../../lib/settings/useSettingsBillingActions");

function Harness() {
  const [planId, setPlanId] = useState("free");
  const [activeUntil, setActiveUntil] = useState<string | null>(null);
  const [lastToast, setLastToast] = useState("null");
  const actions = useSettingsBillingActions({
    userId: "user_1",
    planId,
    setPlanId,
    setActiveUntil,
  });

  return (
    <>
      <Text testID="plan-id">{planId}</Text>
      <Text testID="active-until">{activeUntil ?? "null"}</Text>
      <Text testID="restore-status">{actions.restoreStatus}</Text>
      <Text testID="portal-status">{actions.portalStatus}</Text>
      <Text testID="restore-message">{actions.restoreStatusMessage}</Text>
      <Text testID="portal-message">{actions.portalStatusMessage}</Text>
      <Text testID="toast">{lastToast}</Text>
      <Pressable
        testID="restore"
        onPress={async () => {
          const toast = await actions.restorePurchasesFromSettings();
          setLastToast(JSON.stringify(toast));
        }}
      />
      <Pressable
        testID="portal"
        onPress={async () => {
          const toast = await actions.openBillingPortalFromSettings();
          setLastToast(JSON.stringify(toast));
        }}
      />
    </>
  );
}

describe("useSettingsBillingActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  test("restore success updates state, tracks analytics, and resets status timer", async () => {
    (restorePurchases as jest.Mock).mockResolvedValue({
      status: "restored",
      planId: "pro",
      activeUntil: "2026-12-31T00:00:00.000Z",
    });

    const screen = render(<Harness />);
    fireEvent.press(screen.getByTestId("restore"));

    await waitFor(() => {
      expect(screen.getByTestId("plan-id").props.children).toBe("pro");
    });

    expect(persistPlanChangeSnapshot).toHaveBeenCalledWith("user_1", {
      planId: "pro",
      activeUntil: "2026-12-31T00:00:00.000Z",
    });
    expect(Analytics.track).toHaveBeenCalledWith("plan_changed", expect.objectContaining({
      source: "restore_purchases",
      fromPlan: "free",
      toPlan: "pro",
    }));
    expect(screen.getByTestId("restore-status").props.children).toBe("success");

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("restore-status").props.children).toBe("idle");
    });
  });

  test("restore not_found keeps dedicated error status", async () => {
    (restorePurchases as jest.Mock).mockResolvedValue({ status: "not_found" });

    const screen = render(<Harness />);
    fireEvent.press(screen.getByTestId("restore"));

    await waitFor(() => {
      expect(screen.getByTestId("restore-message").props.children).toBe("settings.restoreStatusNotFound");
    });
  });

  test("portal success updates success status", async () => {
    (openBillingPortal as jest.Mock).mockResolvedValue({ ok: true });

    const screen = render(<Harness />);
    fireEvent.press(screen.getByTestId("portal"));

    await waitFor(() => {
      expect(screen.getByTestId("portal-status").props.children).toBe("success");
    });
  });
});
