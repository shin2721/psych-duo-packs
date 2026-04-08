# iOS Native Repair Playbook

This document is the source-controlled recovery path for Psycle's iOS native build.

## Scope

Use this playbook when:

- `expo start` works in Expo Go, but Xcode / `xcodebuild` fails
- generic iOS native build is broken
- dev client builds on device fail after pods regenerate
- node module native patches were wiped by reinstall or pod install

Do not use this document for runtime-only JS bugs after the dev client already launches.

## Source Of Truth

These files are the canonical repair entrypoints:

- `package.json`
- `ios/Podfile`
- `scripts/ios/apply-native-repair.mjs`
- `scripts/ios/seed-swift-compat-headers.mjs`
- `scripts/ios/run-repair-build-detached.sh`
- `scripts/ios/run-device-repair-build-detached.sh`

The repo intentionally tracks only the minimum native repair surface:

- `ios/Podfile`
- `scripts/ios/*`
- doc + package entrypoints that describe and invoke the repair flow

If a native workaround is applied directly inside `node_modules`, mirror it back into `apply-native-repair.mjs` before considering the repair complete.

## Why This Exists

Psycle's iOS native path currently depends on a few explicit repairs that Expo Go does not exercise:

- pods and user projects must disable `SWIFT_ENABLE_EXPLICIT_MODULES`
- some Expo native modules need patched Objective-C / Swift bridging behavior after install
- stale or missing Swift compatibility headers need to be seeded into detached derived data
- hermes needs the `Pre-built` XCFramework slice linked into detached derived data for repaired builds

## Fast Path

Run this first after `npm install`, `pod install`, or any node_modules reset:

```bash
cd psycle-expo
npm run ios:repair:native
```

What it does:

1. reapplies native patches from `scripts/ios/apply-native-repair.mjs`
2. runs `pod install`
3. reapplies the patches again after CocoaPods rewrites files

## Generic iOS Build

Use this when the goal is to verify the native build graph without a phone attached:

```bash
cd psycle-expo
npm run ios:repair:native
npm run ios:repair:build:generic -- \
  /tmp/psycle-repair-build.log \
  /tmp/psycle-repair-build \
  <SEED_SOURCE_DERIVED_DATA_PATH>
tail -n 0 -f /tmp/psycle-repair-build.log
```

Success signal:

- log ends with `** BUILD SUCCEEDED **`

The generic build script also:

- seeds Swift compatibility headers into the detached derived data
- links hermes `Pre-built` to the `ios-arm64` slice
- builds with `CODE_SIGNING_ALLOWED=NO`
- arg3 should point at a prior successful derived data root or index cache root that already contains the needed Swift compatibility headers

## Device Build

Use this after generic build is already healthy and a device is attached:

```bash
cd psycle-expo
npm run ios:repair:native
npm run ios:repair:build:device -- \
  /tmp/psycle-device-build.log \
  /tmp/psycle-device-build \
  /tmp/psycle-repair-build \
  <DEVICE_UDID>
tail -n 0 -f /tmp/psycle-device-build.log
```

Notes:

- arg3 is the seed source derived data path
- the device build expects signing to be available
- the script passes `-allowProvisioningUpdates`

## Runtime Hand-Off

Once the device build succeeds, the native side is healthy enough to install and launch:

```bash
xcrun devicectl device install app --device <DEVICE_UDID> /tmp/psycle-device-build/Build/Products/Debug-iphoneos/Psycle.app
xcrun devicectl device process launch --device <DEVICE_UDID> com.shin27.psycle
```

If Expo dev launcher opens without a server:

```bash
cd psycle-expo
npm run tunnel
```

Then launch the dev client with the reported payload URL or the generated `psycle://expo-development-client/...` deep link.

## Known Repair Invariants

- `ios/Podfile` must keep `SWIFT_ENABLE_EXPLICIT_MODULES=NO`
- `postinstall` must continue to run `scripts/ios/apply-native-repair.mjs`
- detached builds must continue to seed Swift compatibility headers before `xcodebuild`
- detached builds must continue to create the hermes `Pre-built` symlink
- `node_modules` hotfixes are not complete until they are mirrored into `apply-native-repair.mjs`

## When To Edit What

Edit `ios/Podfile` when:

- the fix belongs in pod or project build settings
- the fix should survive pod installation by design

Edit `scripts/ios/apply-native-repair.mjs` when:

- the fix patches generated pod files or module source in `node_modules`
- the fix must be re-applied after reinstall or pod install

Edit `scripts/ios/seed-swift-compat-headers.mjs` when:

- the failure is about missing `*-Swift.h`
- detached derived data is missing compatibility headers or modulemaps

Edit the detached build scripts when:

- the failure only reproduces in detached `xcodebuild`
- hermes, signing, or derived-data bootstrap behavior needs adjustment

## Anti-Patterns

- do not treat Expo Go success as proof that native build is healthy
- do not leave a native fix only in `node_modules`
- do not start with device install before generic build is green
- do not overwrite detached derived data assumptions without updating this playbook
