// Analytics v1 - Core Implementation (最小実装: Console出力のみ)
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  ANALYTICS_DEBUG_ENABLED,
  recordAnalyticsEventStatus,
  safeRecordAnalyticsSystemEvent,
  safeSetAnalyticsCurrentAnonId,
} from "./analytics-runtime/analyticsDebugRuntime";
import {
  generateAnalyticsUuid,
  getAnalyticsErrorMessage,
  sendAnalyticsHttpEvent,
  sendAnalyticsPostHogEvent,
} from "./analytics-runtime/analyticsTransport";
import { analyticsConfig } from "./analytics.config";
import { logDev, warnDev } from "./devLog";
import type {
  AnalyticsConfig,
  AnalyticsEvent,
  AnalyticsProperties,
} from "./analytics.types";

const ANALYTICS_SCHEMA_VERSION = "analytics_v1";
const STORAGE_KEY_ANON_ID = "@psycle/analytics_anon_id";
const STORAGE_KEY_APP_OPEN = "@psycle/analytics_did_track_app_open";
const E2E_ANALYTICS_DEBUG_BUILD =
  typeof process !== "undefined" &&
  process.env?.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === "1";

type QueuedEvent = {
  name: string;
  properties: AnalyticsProperties;
  eventId: string;
  timestamp: string;
};

type EventOverrides = {
  eventId?: string;
  timestamp?: string;
};

class AnalyticsCore {
  private static config: AnalyticsConfig = analyticsConfig;

  private static anonId: string | null = null;
  private static userId: string | null = null;
  private static initialized = false;
  private static initializing = false;
  private static initPromise: Promise<void> | null = null;
  private static eventQueue: QueuedEvent[] = [];
  private static sessionStartTracked = false;
  private static appReadyTracked = false;

  static async initialize(config?: Partial<AnalyticsConfig>): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.ensureInitialized(config);
    return this.initPromise;
  }

  static track(name: string, properties: AnalyticsProperties = {}): void {
    if (!this.config.enabled) {
      return;
    }

    if (!this.initialized) {
      this.enqueueEvent(name, properties);
      this.ensureLazyInitialization();
      return;
    }

    try {
      const event = this.buildEvent(name, properties);
      this.dispatchEvent(event);
      this.recordEventStatus(name, "sent", properties);
    } catch (error) {
      this.handleTrackFailure(name, properties, error);
    }
  }

  static async trackAppOpen(): Promise<void> {
    try {
      const didTrack = await AsyncStorage.getItem(STORAGE_KEY_APP_OPEN);
      if (didTrack === "true") {
        this.debugLog("app_open already tracked, skipping");
        return;
      }

      this.track("app_open");
      await AsyncStorage.setItem(STORAGE_KEY_APP_OPEN, "true");
    } catch (error) {
      this.logRecoverableError("app_open storage guard failed", error);
    }
  }

  static trackSessionStart(): void {
    if (this.sessionStartTracked) {
      this.debugLog("session_start already tracked in this session, skipping");
      return;
    }

    this.track("session_start");
    this.sessionStartTracked = true;
  }

  static trackAppReady(): void {
    if (this.appReadyTracked) {
      this.debugLog("app_ready already tracked in this session, skipping");
      return;
    }

    this.track("app_ready");
    this.appReadyTracked = true;
  }

  static getAnonId(): string {
    return this.getCurrentAnonId();
  }

  static setUserId(userId: string | null | undefined): void {
    this.userId = userId || null;
    this.debugLog("userId updated", { hasUserId: !!this.userId });
  }

  static async resetAnalyticsStateForDebug(
    regenerateAnonId = false
  ): Promise<void> {
    if (!ANALYTICS_DEBUG_ENABLED) return;

    this.initialized = false;
    this.initializing = false;
    this.initPromise = null;
    this.sessionStartTracked = false;
    this.appReadyTracked = false;
    this.eventQueue = [];
    this.userId = null;

    await AsyncStorage.removeItem(STORAGE_KEY_APP_OPEN);

    if (regenerateAnonId) {
      await AsyncStorage.removeItem(STORAGE_KEY_ANON_ID);
      this.anonId = null;
    }

    this.debugLog("Debug reset completed", { regenerateAnonId });
  }

  private static async ensureInitialized(
    config?: Partial<AnalyticsConfig>
  ): Promise<void> {
    this.initializing = true;
    this.mergeConfig(config);

    try {
      this.anonId = await this.loadOrCreateAnonId();
      this.debugLog("Initialized", {
        anonId: this.anonId,
        enabled: this.config.enabled,
      });
      this.flushQueuedEvents();
      safeSetAnalyticsCurrentAnonId(this.anonId);
      safeRecordAnalyticsSystemEvent("initialized", this.anonId);
      this.initialized = true;
    } catch (error) {
      this.handleInitFailure(error);
      throw error;
    } finally {
      this.initializing = false;
      if (!this.initialized) {
        this.initPromise = null;
      }
    }
  }

  private static mergeConfig(config?: Partial<AnalyticsConfig>): void {
    if (!config) {
      return;
    }

    this.config = {
      ...this.config,
      ...config,
    };
  }

  private static ensureLazyInitialization(): void {
    if (this.initializing) {
      return;
    }

    this.initialize().catch((error) => {
      this.logRecoverableError("Lazy initialization failed", error);
    });
  }

  private static enqueueEvent(
    name: string,
    properties: AnalyticsProperties
  ): void {
    this.eventQueue.push({
      name,
      properties: { ...properties },
      eventId: this.generateUUID(),
      timestamp: new Date().toISOString(),
    });

    this.debugLog("Event queued (not initialized yet)", { name });
    this.recordEventStatus(name, "queued", properties);
  }

  private static flushQueuedEvents(): void {
    if (this.eventQueue.length === 0) {
      return;
    }

    const queue = [...this.eventQueue];
    this.eventQueue = [];

    this.debugLog(`Flushing ${queue.length} queued events`);

    queue.forEach((queuedEvent) => {
      try {
        const event = this.buildEvent(queuedEvent.name, queuedEvent.properties, {
          eventId: queuedEvent.eventId,
          timestamp: queuedEvent.timestamp,
        });
        this.dispatchEvent(event);
        this.recordEventStatus(
          queuedEvent.name,
          "sent",
          queuedEvent.properties
        );
      } catch (error) {
        this.handleTrackFailure(
          queuedEvent.name,
          queuedEvent.properties,
          error
        );
      }
    });
  }

  private static buildEvent(
    name: string,
    properties: AnalyticsProperties,
    overrides?: EventOverrides
  ): AnalyticsEvent {
    return {
      eventId: overrides?.eventId ?? this.generateUUID(),
      timestamp: overrides?.timestamp ?? new Date().toISOString(),
      anonId: this.getCurrentAnonId(),
      buildId: Constants.expoConfig?.version || "1.0.0",
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      platform: Platform.OS as "ios" | "android" | "web",
      env: this.config.appEnv || (__DEV__ ? "dev" : "prod"),
      ...(this.userId ? { userId: this.userId } : {}),
      name,
      properties,
    };
  }

  private static dispatchEvent(event: AnalyticsEvent): void {
    this.sendToConsole(event);
    this.sendToHttpIfConfigured(event);
    this.sendToPostHogIfConfigured(event);
  }

  private static sendToConsole(event: AnalyticsEvent): void {
    this.debugLog(event.name, event);
  }

  private static sendToHttpIfConfigured(event: AnalyticsEvent): void {
    if (!this.config.endpoint) {
      return;
    }

    this.sendEventAsync(event).catch((error) => {
      safeRecordAnalyticsSystemEvent("http_send_failed", this.getCurrentAnonId(), {
        eventName: event.name,
        message: getAnalyticsErrorMessage(error),
      });
      this.debugLog("HTTP send failed", {
        eventName: event.name,
        message: getAnalyticsErrorMessage(error),
      });
    });
  }

  private static async sendEventAsync(event: AnalyticsEvent): Promise<void> {
    await sendAnalyticsHttpEvent(this.config, event, (message, payload) =>
      this.debugLog(message, payload)
    );
  }

  private static sendToPostHogIfConfigured(event: AnalyticsEvent): void {
    if (E2E_ANALYTICS_DEBUG_BUILD) {
      this.debugLog("PostHog send skipped for E2E analytics debug build", {
        eventName: event.name,
      });
      return;
    }

    if (!this.config.posthogHost || !this.config.posthogApiKey) {
      return;
    }

    this.sendToPostHogAsync(event).catch((error) => {
      safeRecordAnalyticsSystemEvent(
        "posthog_send_failed",
        this.getCurrentAnonId(),
        {
          eventName: event.name,
          message: getAnalyticsErrorMessage(error),
        }
      );
      this.debugLog("PostHog send failed", {
        eventName: event.name,
        message: getAnalyticsErrorMessage(error),
      });
    });
  }

  private static async sendToPostHogAsync(event: AnalyticsEvent): Promise<void> {
    await sendAnalyticsPostHogEvent(this.config, event, (message, payload) =>
      this.debugLog(message, payload)
    );
  }

  private static async loadOrCreateAnonId(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_ANON_ID);
      if (stored) {
        return stored;
      }

      const newId = this.generateUUID();
      await AsyncStorage.setItem(STORAGE_KEY_ANON_ID, newId);
      return newId;
    } catch (error) {
      this.logRecoverableError("Failed to get/create anonId", error);
      return this.generateUUID();
    }
  }

  private static handleTrackFailure(
    name: string,
    properties: AnalyticsProperties,
    error: unknown
  ): void {
    this.recordEventStatus(name, "failed", properties);
    this.logRecoverableError(`Failed to track event "${name}"`, error);
  }

  private static handleInitFailure(error: unknown): void {
    safeRecordAnalyticsSystemEvent("init_failed", this.getCurrentAnonId(), {
      message: getAnalyticsErrorMessage(error),
    });
    this.logRecoverableError("Initialization failed", error);
  }

  private static recordEventStatus(
    name: string,
    status: "queued" | "sent" | "failed",
    properties: AnalyticsProperties
  ): void {
    recordAnalyticsEventStatus(name, status, this.getCurrentAnonId(), properties);
  }

  private static getCurrentAnonId(): string {
    return this.anonId || "unknown";
  }

  private static debugLog(message: string, payload?: unknown): void {
    if (!this.config.debug) {
      return;
    }

    logDev(`[Analytics] ${message}`, payload);
  }

  private static logRecoverableError(message: string, error: unknown): void {
    warnDev(`[Analytics] ${message}:`, error);
  }

  private static generateUUID(): string {
    return generateAnalyticsUuid();
  }
}

export const Analytics = AnalyticsCore;
