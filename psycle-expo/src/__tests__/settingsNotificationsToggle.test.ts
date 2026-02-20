import React from 'react';
import { Alert, Switch } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetNotificationPreference = jest.fn();
const mockSetNotificationPreference = jest.fn();
const mockEnsureNotificationPermission = jest.fn();
const mockCancelPsycleReminders = jest.fn();
const mockSyncDailyReminders = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock('expo/virtual/env', () => ({
  env: {},
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../lib/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user_1', email: 'user@example.com' },
    signOut: jest.fn(),
  }),
}));

jest.mock('../../lib/state', () => ({
  useAppState: () => ({
    setPlanId: jest.fn(),
    setActiveUntil: jest.fn(),
    hasPendingDailyQuests: false,
  }),
}));

jest.mock('../../lib/LocaleContext', () => ({
  useLocale: () => ({
    locale: 'ja',
    options: [{ code: 'ja', label: '日本語' }],
    setLocale: jest.fn(),
  }),
}));

jest.mock('../../lib/billing', () => ({
  openBillingPortal: jest.fn(),
  restorePurchases: jest.fn(),
}));

jest.mock('../../lib/dogfood', () => ({
  getExportableJSON: jest.fn(),
}));

jest.mock('../../lib/i18n', () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

jest.mock('../../lib/notifications', () => ({
  getNotificationPreference: (...args: unknown[]) => mockGetNotificationPreference(...args),
  setNotificationPreference: (...args: unknown[]) => mockSetNotificationPreference(...args),
  ensureNotificationPermission: (...args: unknown[]) => mockEnsureNotificationPermission(...args),
  cancelPsycleReminders: (...args: unknown[]) => mockCancelPsycleReminders(...args),
  syncDailyReminders: (...args: unknown[]) => mockSyncDailyReminders(...args),
}));

const SettingsScreen = require('../../app/settings/index').default;

describe('Settings notification toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined as unknown as void);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('ON with denied permission rolls back to OFF and cancels reminders', async () => {
    mockGetNotificationPreference.mockResolvedValue(false);
    mockSetNotificationPreference.mockResolvedValue(undefined);
    mockEnsureNotificationPermission.mockResolvedValue('denied');
    mockCancelPsycleReminders.mockResolvedValue(undefined);

    const screen = render(React.createElement(SettingsScreen));

    await waitFor(() => {
      expect(mockGetNotificationPreference).toHaveBeenCalled();
    });

    const toggles = screen.UNSAFE_getAllByType(Switch);
    fireEvent(toggles[0], 'valueChange', true);

    await waitFor(() => {
      expect(mockEnsureNotificationPermission).toHaveBeenCalledWith('settings_toggle');
    });

    expect(mockSetNotificationPreference).toHaveBeenCalledWith(true);
    expect(mockSetNotificationPreference).toHaveBeenCalledWith(false);
    expect(mockCancelPsycleReminders).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalled();
  });

  test('OFF cancels reminders immediately', async () => {
    mockGetNotificationPreference.mockResolvedValue(true);
    mockSetNotificationPreference.mockResolvedValue(undefined);
    mockCancelPsycleReminders.mockResolvedValue(undefined);

    const screen = render(React.createElement(SettingsScreen));

    await waitFor(() => {
      expect(mockGetNotificationPreference).toHaveBeenCalled();
    });

    const toggles = screen.UNSAFE_getAllByType(Switch);
    fireEvent(toggles[0], 'valueChange', false);

    await waitFor(() => {
      expect(mockSetNotificationPreference).toHaveBeenCalledWith(false);
    });

    expect(mockCancelPsycleReminders).toHaveBeenCalled();
    expect(mockEnsureNotificationPermission).not.toHaveBeenCalled();
  });
});
