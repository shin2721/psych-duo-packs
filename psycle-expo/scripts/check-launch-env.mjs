#!/usr/bin/env node
import fs from "node:fs";

import { resolveExpoConfig } from "../config/resolveExpoConfig.cjs";

const REQUIRED_PRODUCTION_ENV = [
  "EXPO_PUBLIC_APP_ENV",
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_SUPABASE_FUNCTION_URL",
];

const REQUIRED_PRIVACY_COLLECTED_DATA_TYPES = [
  "NSPrivacyCollectedDataTypeEmailAddress",
  "NSPrivacyCollectedDataTypeUserID",
  "NSPrivacyCollectedDataTypeProductInteraction",
  "NSPrivacyCollectedDataTypePurchaseHistory",
];

const FORBIDDEN_PRODUCTION_ENV_VALUES = {
  EXPO_PUBLIC_E2E_ANALYTICS_DEBUG: "1",
  EXPO_PUBLIC_IOS_EXTERNAL_CHECKOUT_ENABLED: "1",
};

function fail(message) {
  console.error(`[launch-env] ${message}`);
  process.exitCode = 1;
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function assertFileExists(path, label = path) {
  if (!fs.existsSync(path)) {
    fail(`missing required file: ${label}`);
  }
}

function assertAppAssetPath(config, path, label) {
  if (typeof path !== "string" || path.trim().length === 0) {
    fail(`missing app asset config: ${label}`);
    return;
  }
  assertFileExists(path.replace(/^\.\//, ""), label);
}

function assertFileDoesNotContain(path, pattern, label = path) {
  const body = fs.readFileSync(path, "utf8");
  if (body.includes(pattern)) {
    fail(`${label} must not contain stale value: ${pattern}`);
  }
}

const eas = readJson("eas.json");
const appConfig = readJson("app.json").expo ?? {};
const gamificationConfig = readJson("config/gamification.json");
const productionEnv = eas.build?.production?.env ?? {};

function productionValue(key) {
  return productionEnv[key] || process.env[key];
}

for (const key of REQUIRED_PRODUCTION_ENV) {
  const value = productionValue(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`missing production env: ${key}`);
  }
}

if (productionValue("EXPO_PUBLIC_APP_ENV") !== "prod") {
  fail("EXPO_PUBLIC_APP_ENV must be prod for production builds");
}

for (const [key, forbiddenValue] of Object.entries(FORBIDDEN_PRODUCTION_ENV_VALUES)) {
  if (productionValue(key) === forbiddenValue) {
    fail(`${key} must not be enabled for production builds`);
  }
}

const supabaseUrl = productionValue("EXPO_PUBLIC_SUPABASE_URL");
if (supabaseUrl === "https://placeholder.supabase.co" || !supabaseUrl?.startsWith("https://")) {
  fail("EXPO_PUBLIC_SUPABASE_URL must be a real https Supabase URL");
}

const anonKey = productionValue("EXPO_PUBLIC_SUPABASE_ANON_KEY");
if (anonKey === "placeholder" || anonKey.split(".").length !== 3) {
  fail("EXPO_PUBLIC_SUPABASE_ANON_KEY must be a JWT-like public anon key");
}

const functionUrl = productionValue("EXPO_PUBLIC_SUPABASE_FUNCTION_URL");
if (!functionUrl?.startsWith("https://") || !functionUrl.includes(".functions.supabase.co")) {
  fail("EXPO_PUBLIC_SUPABASE_FUNCTION_URL must be a real https Supabase Functions URL");
}

const productionConfig = resolveExpoConfig({ EAS_BUILD_PROFILE: "production" });
const plugins = productionConfig.plugins ?? [];
if (plugins.includes("expo-dev-client")) {
  fail("production Expo config must not include expo-dev-client");
}

const ats = productionConfig.ios?.infoPlist?.NSAppTransportSecurity ?? {};
if (ats.NSAllowsLocalNetworking !== undefined) {
  fail("production ATS must not include NSAllowsLocalNetworking");
}
if (ats.NSExceptionDomains?.["exp.direct"]) {
  fail("production ATS must not include exp.direct exception");
}

if (appConfig.ios?.config?.usesNonExemptEncryption !== false) {
  fail("ios.config.usesNonExemptEncryption must be false for App Store export compliance");
}

const iosBundleIdentifier = appConfig.ios?.bundleIdentifier;
if (iosBundleIdentifier !== "com.shin27.psycle") {
  fail("expo.ios.bundleIdentifier must be com.shin27.psycle");
}

const xcodeProjectPath = "ios/Psycle.xcodeproj/project.pbxproj";
assertFileExists(xcodeProjectPath, xcodeProjectPath);
const xcodeProject = fs.readFileSync(xcodeProjectPath, "utf8");
if (!xcodeProject.includes("PRODUCT_BUNDLE_IDENTIFIER = com.shin27.psycle;")) {
  fail("native Psycle target bundle identifier must match app.json");
}
if (!xcodeProject.includes("PRODUCT_BUNDLE_IDENTIFIER = com.shin27.psycle.PsycleWidgetExtension;")) {
  fail("native widget extension bundle identifier must match app.json prefix");
}

const staleBundleId = "com.s6n2j9.psycle";
for (const path of [
  xcodeProjectPath,
  "ios/Psycle/Psycle.entitlements",
  "ios/Psycle/Psycle.debug.entitlements",
  "ios/PsycleWidgetExtension/PsycleWidgetExtension.entitlements",
  "ios/PsycleWidgetExtension/PsycleWidgetExtension.debug.entitlements",
  "ios/PsycleWidgetExtension/PsycleStreakWidget.swift",
  "scripts/native-agent/_psycle_env.sh",
  "scripts/native-agent/_send",
  "scripts/native-agent/run-flow",
]) {
  assertFileDoesNotContain(path, staleBundleId);
}

assertAppAssetPath(appConfig, appConfig.icon, "expo.icon");
assertAppAssetPath(appConfig, appConfig.splash?.image, "expo.splash.image");
assertAppAssetPath(appConfig, appConfig.android?.adaptiveIcon?.foregroundImage, "expo.android.adaptiveIcon.foregroundImage");

const privacyInfoPath = "ios/Psycle/PrivacyInfo.xcprivacy";
assertFileExists(privacyInfoPath, privacyInfoPath);
const privacyInfo = fs.existsSync(privacyInfoPath) ? fs.readFileSync(privacyInfoPath, "utf8") : "";
if (!privacyInfo.includes("<key>NSPrivacyTracking</key>") || !privacyInfo.includes("<false/>")) {
  fail("PrivacyInfo.xcprivacy must declare NSPrivacyTracking false");
}
if (!privacyInfo.includes("<key>NSPrivacyCollectedDataTypes</key>")) {
  fail("PrivacyInfo.xcprivacy must declare NSPrivacyCollectedDataTypes");
}
for (const dataType of REQUIRED_PRIVACY_COLLECTED_DATA_TYPES) {
  if (!privacyInfo.includes(dataType)) {
    fail(`PrivacyInfo.xcprivacy must declare collected data type: ${dataType}`);
  }
}
if (privacyInfo.includes("<key>NSPrivacyCollectedDataTypes</key>\n\t<array/>")) {
  fail("PrivacyInfo.xcprivacy collected data types must not be empty");
}
if (!privacyInfo.includes("NSPrivacyCollectedDataTypePurposeAnalytics")) {
  fail("PrivacyInfo.xcprivacy must declare analytics purpose for collected interaction/user data");
}

if (gamificationConfig.notifications?.default_enabled !== false) {
  fail("notifications.default_enabled must be false so permission prompts remain opt-in");
}

if (!process.exitCode) {
  console.log("[launch-env] production env/config checks passed");
}
