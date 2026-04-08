#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const touched = [];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function write(relativePath, contents) {
  fs.writeFileSync(path.join(repoRoot, relativePath), contents);
  touched.push(relativePath);
}

function update(relativePath, transform) {
  const current = read(relativePath);
  const next = transform(current);
  if (next !== current) {
    write(relativePath, next);
  }
}

function overwrite(relativePath, contents) {
  const normalized = contents.endsWith('\n') ? contents : `${contents}\n`;
  if (read(relativePath) !== normalized) {
    write(relativePath, normalized);
  }
}

function ensureArrayEntries(relativePath, marker, entries) {
  update(relativePath, (current) => {
    const start = current.indexOf(marker);
    if (start === -1) {
      throw new Error(`Could not find marker "${marker}" in ${relativePath}`);
    }

    const arrayStart = current.indexOf('[', start);
    const arrayEnd = current.indexOf(']', arrayStart);
    if (arrayStart === -1 || arrayEnd === -1) {
      throw new Error(`Could not find array for "${marker}" in ${relativePath}`);
    }

    const block = current.slice(arrayStart, arrayEnd + 1);
    const missing = entries.filter((entry) => !block.includes(`"${entry}"`));
    if (missing.length === 0) {
      return current;
    }

    const insertion = missing.map((entry) => `            "${entry}",\n`).join('');
    return `${current.slice(0, arrayEnd)}${insertion}${current.slice(arrayEnd)}`;
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removePodsShellScriptPhases(relativePath, phaseNames) {
  update(relativePath, (current) => {
    const removed = [];
    const blockPattern = /\n\t\t([A-Z0-9]+) \/\* ([^*]+?) \*\/ = \{\n\t\t\tisa = PBXShellScriptBuildPhase;[\s\S]*?\n\t\t\};/g;

    let next = current.replace(blockPattern, (block, id, name) => {
      if (!phaseNames.includes(name)) {
        return block;
      }

      removed.push({ id, name });
      return '';
    });

    if (removed.length === 0) {
      return current;
    }

    for (const { id, name } of removed) {
      const referencePattern = new RegExp(`\\n\\s*${escapeRegExp(id)} /\\* ${escapeRegExp(name)} \\*/,`, 'g');
      next = next.replace(referencePattern, '');
    }

    return next;
  });
}

function rewritePodConfigModulemapPaths() {
  const targetSupportRoot = path.join(repoRoot, 'ios/Pods/Target Support Files');
  if (!fs.existsSync(targetSupportRoot)) {
    return;
  }

  const availableModulemaps = new Map();
  const supportDirDefaultModulemaps = new Map();

  for (const supportDirName of fs.readdirSync(targetSupportRoot)) {
    const supportDir = path.join(targetSupportRoot, supportDirName);
    if (!fs.statSync(supportDir).isDirectory()) {
      continue;
    }

    for (const fileName of fs.readdirSync(supportDir)) {
      if (!fileName.endsWith('.modulemap')) {
        continue;
      }

      availableModulemaps.set(
        `${supportDirName}/${fileName}`,
        `\${PODS_ROOT}/Target Support Files/${supportDirName}/${fileName}`
      );

      if (fileName === `${supportDirName}.modulemap`) {
        supportDirDefaultModulemaps.set(
          supportDirName,
          `\${PODS_ROOT}/Target Support Files/${supportDirName}/${fileName}`
        );
      }
    }
  }

  for (const supportDirName of fs.readdirSync(targetSupportRoot)) {
    const supportDir = path.join(targetSupportRoot, supportDirName);
    if (!fs.statSync(supportDir).isDirectory()) {
      continue;
    }

    for (const fileName of fs.readdirSync(supportDir)) {
      if (!fileName.endsWith('.xcconfig')) {
        continue;
      }

      const relativePath = path.relative(repoRoot, path.join(supportDir, fileName));
      update(relativePath, (current) =>
        current.replace(
          /\$\{PODS_CONFIGURATION_BUILD_DIR\}\/([^/]+)\/([^/"\s]+\.modulemap)/g,
          (match, supportDirNameFromConfig, modulemapName) =>
            availableModulemaps.get(`${supportDirNameFromConfig}/${modulemapName}`) ??
            supportDirDefaultModulemaps.get(supportDirNameFromConfig) ??
            match
        )
      );
    }
  }
}

function rewriteKnownExpoDevModulemapAliases() {
  const targetSupportRoot = path.join(repoRoot, 'ios/Pods/Target Support Files');
  if (!fs.existsSync(targetSupportRoot)) {
    return;
  }

  const replacements = new Map([
    [
      '${PODS_CONFIGURATION_BUILD_DIR}/expo-dev-launcher/EXDevLauncher.modulemap',
      '${PODS_ROOT}/Target Support Files/expo-dev-launcher/expo-dev-launcher.modulemap',
    ],
    [
      '${PODS_CONFIGURATION_BUILD_DIR}/expo-dev-menu/EXDevMenu.modulemap',
      '${PODS_ROOT}/Target Support Files/expo-dev-menu/expo-dev-menu.modulemap',
    ],
    [
      '${PODS_CONFIGURATION_BUILD_DIR}/expo-dev-menu-interface/EXDevMenuInterface.modulemap',
      '${PODS_ROOT}/Target Support Files/expo-dev-menu-interface/expo-dev-menu-interface.modulemap',
    ],
  ]);

  for (const supportDirName of fs.readdirSync(targetSupportRoot)) {
    const supportDir = path.join(targetSupportRoot, supportDirName);
    if (!fs.statSync(supportDir).isDirectory()) {
      continue;
    }

    for (const fileName of fs.readdirSync(supportDir)) {
      if (!fileName.endsWith('.xcconfig')) {
        continue;
      }

      const relativePath = path.relative(repoRoot, path.join(supportDir, fileName));
      update(relativePath, (current) => {
        let next = current;
        for (const [from, to] of replacements.entries()) {
          next = next.replaceAll(from, to);
        }
        return next;
      });
    }
  }
}

overwrite(
  'node_modules/expo-dev-launcher/ios/EXDevLauncherController.h',
  `#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeDelegate.h>

#import <UIKit/UIKit.h>

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

#import <ExpoModulesCore/ExpoModulesCore.h>
#import <ExpoModulesCore/EXReactDelegateWrapper.h>
#if __has_include(<EXUpdatesInterface/EXUpdatesInterface-Swift.h>)
#import <EXUpdatesInterface/EXUpdatesInterface-Swift.h>
#elif __has_include("EXUpdatesInterface-Swift.h")
#import "EXUpdatesInterface-Swift.h"
#endif

@protocol EXRequestCdpInterceptorDelegate;
@protocol EXAppDelegateSubscriberProtocol;
#ifndef EXBaseAppDelegateSubscriber
#define EXBaseAppDelegateSubscriber NSObject
#endif
#ifndef BaseExpoAppDelegateSubscriber
#define BaseExpoAppDelegateSubscriber EXBaseAppDelegateSubscriber
#endif
#ifndef EXReactDelegateHandler
#define EXReactDelegateHandler EXReactDelegateWrapper
#endif
#ifndef ExpoReactDelegateHandler
#define ExpoReactDelegateHandler EXReactDelegateHandler
#endif

NS_ASSUME_NONNULL_BEGIN

@class EXAppContext;
@class EXDevLauncherInstallationIDHelper;
@class EXDevLauncherPendingDeepLinkRegistry;
@class EXDevLauncherRecentlyOpenedAppsRegistry;
@class EXDevLauncherController;
@class EXDevLauncherErrorManager;
@class EXManifestsManifest;
@protocol EXUpdatesExternalInterface;
@protocol EXUpdatesExternalInterfaceDelegate;

@protocol EXDevLauncherControllerDelegate <NSObject>

- (void)devLauncherController:(EXDevLauncherController *)developmentClientController
                didStartWithSuccess:(BOOL)success;

@end

@interface EXDevLauncherController : RCTDefaultReactNativeFactoryDelegate <RCTBridgeDelegate, EXUpdatesExternalInterfaceDelegate>

@property (nonatomic, weak) RCTBridge * _Nullable appBridge;
@property (nonatomic, weak) EXAppContext * _Nullable appContext;
@property (nonatomic, strong) EXDevLauncherPendingDeepLinkRegistry *pendingDeepLinkRegistry;
@property (nonatomic, strong) EXDevLauncherRecentlyOpenedAppsRegistry *recentlyOpenedAppsRegistry;
@property (nonatomic, strong) id<EXUpdatesExternalInterface> updatesInterface;
@property (nonatomic, readonly, assign) BOOL isStarted;

+ (instancetype)sharedInstance;

- (void)startWithWindow:(UIWindow *)window delegate:(id<EXDevLauncherControllerDelegate>)delegate launchOptions:(NSDictionary * _Nullable)launchOptions;

- (void)autoSetupPrepare:(id<EXDevLauncherControllerDelegate>)delegate launchOptions:(NSDictionary * _Nullable)launchOptions;

- (void)autoSetupStart:(UIWindow *)window;

- (nullable NSURL *)sourceUrl;

- (void)navigateToLauncher;

- (BOOL)onDeepLink:(NSURL *)url options:(NSDictionary *)options;

- (void)loadApp:(NSURL *)url onSuccess:(void (^ _Nullable)(void))onSuccess onError:(void (^ _Nullable)(NSError *error))onError;

- (void)loadApp:(NSURL *)expoUrl withProjectUrl:(NSURL  * _Nullable)projectUrl onSuccess:(void (^ _Nullable)(void))onSuccess onError:(void (^ _Nullable)(NSError *error))onError;

- (void)clearRecentlyOpenedApps;

- (NSDictionary *)getLaunchOptions;

- (EXManifestsManifest * _Nullable)appManifest;

- (NSURL * _Nullable)appManifestURL;

- (nullable NSURL *)appManifestURLWithFallback;

- (BOOL)isAppRunning;

- (BOOL)isStarted;

- (UIWindow * _Nullable)currentWindow;

- (EXDevLauncherErrorManager *)errorManager;

- (EXDevLauncherInstallationIDHelper *)installationIDHelper;

+ (NSString * _Nullable)version;

- (NSDictionary *)getBuildInfo;

- (void)copyToClipboard:(NSString *)content;

- (NSDictionary *)getUpdatesConfig: (nullable NSDictionary *) constants;

- (UIViewController *)createRootViewController;

- (void)setRootView:(UIView *)rootView toRootViewController:(UIViewController *)rootViewController;

@end

NS_ASSUME_NONNULL_END
`
);

overwrite(
  'node_modules/expo-dev-launcher/ios/Manifest/EXDevLauncherManifestParser.h',
  `// Copyright 2015-present 650 Industries. All rights reserved.

NS_ASSUME_NONNULL_BEGIN

typedef void (^IsManifestURL)(BOOL isManifestURL);
typedef void (^OnManifestParsed)(id _Nullable manifest);
typedef void (^OnManifestError)(NSError *error);

@interface EXDevLauncherManifestParser : NSObject

- (instancetype)initWithURL:(NSURL *)url
             installationID:(NSString *)installationID
                    session:(NSURLSession *)session
             requestTimeout:(NSTimeInterval)requestTimeout;

- (void)isManifestURLWithCompletion:(IsManifestURL)completion
                            onError:(OnManifestError)onError;

- (void)tryToParseManifest:(OnManifestParsed)onParsed
                   onError:(OnManifestError)onError;

@end

NS_ASSUME_NONNULL_END
`
);

overwrite(
  'node_modules/expo-dev-launcher/ios/Manifest/EXDevLauncherManifestParser.m',
  `// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXDevLauncher/EXDevLauncherManifestParser.h>

typedef void (^CompletionHandler)(NSData *data, NSURLResponse *response);

static id EXDevLauncherCreateManifestFromJson(NSDictionary *jsonObject)
{
  Class manifestFactoryClass = NSClassFromString(@"EXManifestsManifestFactory");
  SEL selector = @selector(manifestForManifestJSON:);
  if (manifestFactoryClass == Nil || ![manifestFactoryClass respondsToSelector:selector]) {
    return nil;
  }
  id (*imp)(id, SEL, NSDictionary *) = (id (*)(id, SEL, NSDictionary *))[manifestFactoryClass methodForSelector:selector];
  return imp ? imp(manifestFactoryClass, selector, jsonObject) : nil;
}

@interface EXDevLauncherManifestParser ()

@property (strong, nonatomic) NSURL *url;
@property (nonatomic, strong) NSString *installationID;
@property (weak, nonatomic) NSURLSession *session;
@property (nonatomic, assign) NSTimeInterval requestTimeout;

@end

@implementation EXDevLauncherManifestParser

- (instancetype)initWithURL:(NSURL *)url
             installationID:(NSString *)installationID
                    session:(NSURLSession *)session
             requestTimeout:(NSTimeInterval)requestTimeout
{
  if (self = [super init]) {
    self.url = url;
    self.installationID = installationID;
    self.session = session;
    self.requestTimeout = requestTimeout;
  }
  return self;
}

- (void)isManifestURLWithCompletion:(IsManifestURL)completion
                            onError:(OnManifestError)onError
{
  [self _fetch:@"HEAD" onError:onError completionHandler:^(NSData *data, NSURLResponse *response) {
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;

    if (httpResponse.statusCode < 200 || httpResponse.statusCode >= 300) {
      completion(YES);
      return;
    }

    NSDictionary *headers = [httpResponse allHeaderFields];
    if (headers[@"Exponent-Server"]) {
      completion(YES);
      return;
    }

    NSString *contentType = headers[@"Content-Type"];
    if (contentType && ![contentType hasPrefix:@"text/html"] && ![contentType containsString:@"/javascript"]) {
      completion(YES);
      return;
    }

    completion(NO);
  }];
}

- (void)tryToParseManifest:(OnManifestParsed)onParsed
                   onError:(OnManifestError)onError
{
  [self _fetch:@"GET" onError:onError completionHandler:^(NSData *data, NSURLResponse *response) {
    if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
      if (httpResponse.statusCode < 200 || httpResponse.statusCode >= 300) {
        NSString *message = @"Failed to open app.\\n\\nIf you are trying to load the app from a development server, check your network connectivity and make sure you can access the server from your device.\\n\\nIf you are trying to open a published project, install a compatible version of expo-updates and follow all setup and integration steps.";
        onError([NSError errorWithDomain:@"DevelopmentClient" code:1 userInfo:@{NSLocalizedDescriptionKey: message}]);
        return;
      }
    }

    NSError *error;
    NSDictionary *jsonObject = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&error];
    if (!jsonObject) {
      NSMutableDictionary *details = [NSMutableDictionary dictionary];
      details[NSLocalizedDescriptionKey] = [NSString stringWithFormat:@"Couldn't parse the manifest. %@", (error ? error.localizedDescription : @"")];
      if (error) {
        details[NSUnderlyingErrorKey] = error;
      }
      onError([[NSError alloc] initWithDomain:@"DevelopmentClient" code:1 userInfo:details]);
      return;
    }

    onParsed(EXDevLauncherCreateManifestFromJson(jsonObject));
  }];
}

- (void)_fetch:(NSString *)method onError:(OnManifestError)onError completionHandler:(CompletionHandler)completionHandler
{
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:self.url];
  [request setHTTPMethod:method];
  [request setValue:@"ios" forHTTPHeaderField:@"expo-platform"];
  [request setValue:@"application/expo+json,application/json" forHTTPHeaderField:@"accept"];
  [request setTimeoutInterval:self.requestTimeout];
  if (self.installationID) {
    [request setValue:self.installationID forHTTPHeaderField:@"Expo-Dev-Client-ID"];
  }
  NSURLSessionDataTask *dataTask = [self.session dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
    if (error) {
      onError(error);
      return;
    }
    completionHandler(data, response);
  }];
  [dataTask resume];
}

@end
`
);

update('node_modules/expo-dev-launcher/ios/EXDevLauncherController.m', (current) => {
  let next = current;

  if (!next.includes('ExpoModulesCore-Swift.h')) {
    next = next.replace(
      '#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>\n\n',
      '#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>\n\n#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)\n#import <ExpoModulesCore/ExpoModulesCore-Swift.h>\n#elif __has_include("ExpoModulesCore-Swift.h")\n#import "ExpoModulesCore-Swift.h"\n#endif\n'
    );
  }

  if (!next.includes('EXManifests-Swift.h')) {
    next = next.replace(
      '#endif\n\n#ifdef RCT_NEW_ARCH_ENABLED\n',
      '#endif\n#if __has_include(<EXManifests/EXManifests-Swift.h>)\n#import <EXManifests/EXManifests-Swift.h>\n#elif __has_include("EXManifests-Swift.h")\n#import "EXManifests-Swift.h"\n#endif\n'
    );
    next = next.replace(
      '#import "EXManifests-Swift.h"\n#endif\n',
      '#import "EXManifests-Swift.h"\n#endif\n\n'
    );
  }

  if (!next.includes('EXUpdatesInterface-Swift.h')) {
    next = next.replace(
      '#endif\n\n#ifdef RCT_NEW_ARCH_ENABLED\n',
      '#endif\n#if __has_include(<EXUpdatesInterface/EXUpdatesInterface-Swift.h>)\n#import <EXUpdatesInterface/EXUpdatesInterface-Swift.h>\n#elif __has_include("EXUpdatesInterface-Swift.h")\n#import "EXUpdatesInterface-Swift.h"\n#endif\n'
    );
    next = next.replace(
      '#import "EXUpdatesInterface-Swift.h"\n#endif\n',
      '#import "EXUpdatesInterface-Swift.h"\n#endif\n\n'
    );
  }

  if (!next.includes('EXDevMenu-Swift.h')) {
    next = next.replace(
      '#endif\n\n#ifdef RCT_NEW_ARCH_ENABLED\n',
      '#endif\n#if __has_include(<EXDevMenu/EXDevMenu-Swift.h>)\n#import <EXDevMenu/EXDevMenu-Swift.h>\n#elif __has_include("EXDevMenu-Swift.h")\n#import "EXDevMenu-Swift.h"\n#endif\n'
    );
    next = next.replace(
      '#import "EXDevMenu-Swift.h"\n#endif\n',
      '#import "EXDevMenu-Swift.h"\n#endif\n\n'
    );
  }

  if (!next.includes('#ifndef BaseExpoAppDelegateSubscriber\n#define BaseExpoAppDelegateSubscriber EXBaseAppDelegateSubscriber\n#endif')) {
    next = next.replace(
      '#endif\n#if __has_include(<EXDevLauncher/EXDevLauncher-Swift.h>)\n',
      '#endif\n#ifndef BaseExpoAppDelegateSubscriber\n#define BaseExpoAppDelegateSubscriber EXBaseAppDelegateSubscriber\n#endif\n#ifndef ExpoReactDelegateHandler\n#define ExpoReactDelegateHandler EXReactDelegateHandler\n#endif\n#if __has_include(<EXDevLauncher/EXDevLauncher-Swift.h>)\n'
    );
  }

  if (!next.includes('@import EXUpdatesInterface;\n')) {
    next = next.replace('@import EXManifests;\n', '@import EXManifests;\n@import EXUpdatesInterface;\n');
  }

  if (!next.includes('static id EXDevLauncherDevMenuManagerSharedInstance(void)')) {
    next = next.replace(
      '#define EX_DEV_LAUNCHER_PACKAGER_PATH @"packages/expo-dev-launcher/index.bundle?platform=ios&dev=true&minify=false"\n',
      '#define EX_DEV_LAUNCHER_PACKAGER_PATH @"packages/expo-dev-launcher/index.bundle?platform=ios&dev=true&minify=false"\n\nstatic id EXDevLauncherDevMenuManagerSharedInstance(void)\n{\n  Class managerClass = NSClassFromString(@"EXDevMenu.DevMenuManager") ?: NSClassFromString(@"DevMenuManager");\n  SEL sharedSelector = @selector(shared);\n  if (managerClass == Nil || ![managerClass respondsToSelector:sharedSelector]) {\n    return nil;\n  }\n  id (*sharedImp)(id, SEL) = (id (*)(id, SEL))[managerClass methodForSelector:sharedSelector];\n  return sharedImp ? sharedImp(managerClass, sharedSelector) : nil;\n}\n\nstatic NSURL *EXDevLauncherUpdatesLaunchAssetURL(id updatesInterface)\n{\n  SEL selector = @selector(launchAssetURL);\n  if (updatesInterface == nil || ![updatesInterface respondsToSelector:selector]) {\n    return nil;\n  }\n  NSURL *(*imp)(id, SEL) = (NSURL *(*)(id, SEL))[updatesInterface methodForSelector:selector];\n  return imp ? imp(updatesInterface, selector) : nil;\n}\n'
    );
  }

  next = next.replace(
    '- (void)setDevMenuAppBridge\n{\n  DevMenuManager *manager = [DevMenuManager shared];\n  manager.currentBridge = self.appBridge.parentBridge;\n\n  if (self.manifest != nil) {\n    manager.currentManifest = self.manifest;\n    manager.currentManifestURL = self.manifestURL;\n  }\n}\n',
    '- (void)setDevMenuAppBridge\n{\n  id manager = EXDevLauncherDevMenuManagerSharedInstance();\n  if (manager == nil) {\n    return;\n  }\n  [manager setValue:self.appBridge.parentBridge forKey:@"currentBridge"];\n\n  if (self.manifest != nil) {\n    [manager setValue:self.manifest forKey:@"currentManifest"];\n    [manager setValue:self.manifestURL forKey:@"currentManifestURL"];\n  }\n}\n'
  );

  next = next.replace(
    '- (void)invalidateDevMenuApp\n{\n  DevMenuManager *manager = [DevMenuManager shared];\n  manager.currentBridge = nil;\n  manager.currentManifest = nil;\n  manager.currentManifestURL = nil;\n}\n',
    '- (void)invalidateDevMenuApp\n{\n  id manager = EXDevLauncherDevMenuManagerSharedInstance();\n  if (manager == nil) {\n    return;\n  }\n  [manager setValue:nil forKey:@"currentBridge"];\n  [manager setValue:nil forKey:@"currentManifest"];\n  [manager setValue:nil forKey:@"currentManifestURL"];\n}\n'
  );

  next = next.replace(
    '- (nullable NSURL *)sourceUrl\n{\n  if (_shouldPreferUpdatesInterfaceSourceUrl && _updatesInterface && ((id<EXUpdatesExternalInterface>)_updatesInterface).launchAssetURL) {\n    return ((id<EXUpdatesExternalInterface>)_updatesInterface).launchAssetURL;\n  }\n  return _sourceUrl;\n}\n',
    '- (nullable NSURL *)sourceUrl\n{\n  NSURL *launchAssetURL = EXDevLauncherUpdatesLaunchAssetURL(_updatesInterface);\n  if (_shouldPreferUpdatesInterfaceSourceUrl && launchAssetURL != nil) {\n    return launchAssetURL;\n  }\n  return _sourceUrl;\n}\n'
  );

  next = next.replace(
    '    } success:^(NSDictionary * _Nullable manifest) {\n      if (manifest) {\n        launchExpoApp(((id<EXUpdatesExternalInterface>)self->_updatesInterface).launchAssetURL, [EXManifestsManifestFactory manifestForManifestJSON:manifest]);\n      }\n    } error:onError];\n',
    '    } success:^(NSDictionary * _Nullable manifest) {\n      if (manifest) {\n        launchExpoApp(EXDevLauncherUpdatesLaunchAssetURL(self->_updatesInterface), [EXManifestsManifestFactory manifestForManifestJSON:manifest]);\n      }\n    } error:onError];\n'
  );

  const duplicatedMacros =
    '#ifndef BaseExpoAppDelegateSubscriber\\n#define BaseExpoAppDelegateSubscriber EXBaseAppDelegateSubscriber\\n#endif\\n#ifndef ExpoReactDelegateHandler\\n#define ExpoReactDelegateHandler EXReactDelegateHandler\\n#endif\\n#ifndef BaseExpoAppDelegateSubscriber\\n#define BaseExpoAppDelegateSubscriber EXBaseAppDelegateSubscriber\\n#endif\\n#ifndef ExpoReactDelegateHandler\\n#define ExpoReactDelegateHandler EXReactDelegateHandler\\n#endif\\n';
  while (next.includes(duplicatedMacros)) {
    next = next.replace(
      duplicatedMacros,
      '#ifndef BaseExpoAppDelegateSubscriber\\n#define BaseExpoAppDelegateSubscriber EXBaseAppDelegateSubscriber\\n#endif\\n#ifndef ExpoReactDelegateHandler\\n#define ExpoReactDelegateHandler EXReactDelegateHandler\\n#endif\\n'
    );
  }

  return next;
});

update('node_modules/expo-dev-launcher/ios/Manifest/EXDevLauncherManifestParser.h', (current) => {
  if (current.includes('EXManifests-Swift.h')) {
    return current;
  }

  return current.replace(
    '@import EXManifests;\n',
    '#if __has_include(<EXManifests/EXManifests-Swift.h>)\n#import <EXManifests/EXManifests-Swift.h>\n#elif __has_include("EXManifests-Swift.h")\n#import "EXManifests-Swift.h"\n#else\n@import EXManifests;\n#endif\n'
  );
});

overwrite(
  'node_modules/expo-dev-launcher/ios/EXDevLauncher.m',
  `// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXDevLauncher/EXDevLauncher.h>
#import <EXDevLauncher/EXDevLauncherController.h>
#import <ExpoModulesCore/ExpoModulesCore.h>

@protocol EXRequestCdpInterceptorDelegate;
@protocol EXAppDelegateSubscriberProtocol;

#ifndef EXBaseAppDelegateSubscriber
#define EXBaseAppDelegateSubscriber NSObject
#endif
#ifndef BaseExpoAppDelegateSubscriber
#define BaseExpoAppDelegateSubscriber EXBaseAppDelegateSubscriber
#endif
#ifndef EXReactDelegateHandler
#define EXReactDelegateHandler EXReactDelegateWrapper
#endif
#ifndef ExpoReactDelegateHandler
#define ExpoReactDelegateHandler EXReactDelegateHandler
#endif

#if __has_include(<EXDevLauncher/EXDevLauncher-Swift.h>)
#import <EXDevLauncher/EXDevLauncher-Swift.h>
#else
#import <EXDevLauncher-Swift.h>
#endif

static NSDictionary *EXDevLauncherManifestJson(id manifest)
{
  if (manifest == nil || ![manifest respondsToSelector:@selector(rawManifestJSON)]) {
    return nil;
  }
  NSDictionary *(*imp)(id, SEL) = (NSDictionary *(*)(id, SEL))[manifest methodForSelector:@selector(rawManifestJSON)];
  return imp ? imp(manifest, @selector(rawManifestJSON)) : nil;
}

@implementation EXDevLauncher

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary *)constantsToExport
{
  id manifest = [EXDevLauncherController.sharedInstance appManifest];
  NSDictionary *rawManifestJSON = EXDevLauncherManifestJson(manifest);
  NSData *manifestStringData = rawManifestJSON ? [NSJSONSerialization dataWithJSONObject:rawManifestJSON options:kNilOptions error:NULL] : nil;
  NSString *manifestURLString = [EXDevLauncherController.sharedInstance appManifestURL].absoluteString;
  return @{
    @"manifestString": manifestStringData ? [[NSString alloc] initWithData:manifestStringData encoding:NSUTF8StringEncoding] : [NSNull null],
    @"manifestURL": manifestURLString ?: [NSNull null]
  };
}

@end
`
);

overwrite(
  'node_modules/expo-dev-launcher/ios/Errors/EXDevLauncherRedBox.m',
  `// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTAssert.h>

#import <EXDevLauncher/EXDevLauncherRedBox.h>
#import <EXDevLauncher/EXDevLauncherController.h>

@interface EXDevLauncherRedBox ()

@property (nonatomic, weak) RCTLogBox *logBox;

@end

static id EXDevLauncherMakeAppError(NSString *message, NSArray<RCTJSStackFrame *> *stack)
{
  Class appErrorClass = NSClassFromString(@"EXDevLauncher.EXDevLauncherAppError") ?: NSClassFromString(@"EXDevLauncherAppError");
  SEL initSelector = @selector(initWithMessage:stack:);
  if (appErrorClass == Nil || ![appErrorClass instancesRespondToSelector:initSelector]) {
    return nil;
  }
  id instance = [appErrorClass alloc];
  id (*imp)(id, SEL, NSString *, NSArray<RCTJSStackFrame *> *) = (id (*)(id, SEL, NSString *, NSArray<RCTJSStackFrame *> *))[instance methodForSelector:initSelector];
  return imp ? imp(instance, initSelector, message, stack) : nil;
}

@implementation EXDevLauncherRedBox

@synthesize overrideBundleURL;
@synthesize overrideReloadAction;

- (void)registerLogBox:(RCTLogBox * _Nullable)logBox
{
  self.logBox = logBox;
}

- (void)addCustomButton:(NSString *)title onPressHandler:(RCTRedBoxButtonPressHandler)handler {

}

- (void)dismiss {

}

- (void)registerErrorCustomizer:(id<RCTErrorCustomizer>)errorCustomizer {

}

- (void)showError:(NSError *)error
{
  [self showErrorMessage:error.localizedDescription
             withDetails:error.localizedFailureReason
                   stack:error.userInfo[RCTJSStackTraceKey]
             errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message
{
  [self showErrorMessage:message withParsedStack:nil isUpdate:NO errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details
{
  [self showErrorMessage:message withDetails:details stack:nil errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message
             withDetails:(NSString *)details
                   stack:(NSArray<RCTJSStackFrame *> *)stack
             errorCookie:(int)errorCookie
{
  NSString *combinedMessage = message;
  if (details) {
    combinedMessage = [NSString stringWithFormat:@"%@\\n\\n%@", message, details];
  }
  [self showErrorMessage:combinedMessage withParsedStack:stack isUpdate:NO errorCookie:errorCookie];
}

- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack
{
  [self showErrorMessage:message withRawStack:rawStack errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack errorCookie:(int)errorCookie
{
  NSArray<RCTJSStackFrame *> *stack = [RCTJSStackFrame stackFramesWithLines:rawStack];
  [self showErrorMessage:message withParsedStack:stack isUpdate:NO errorCookie:errorCookie];
}

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
  [self showErrorMessage:message withStack:stack errorCookie:-1];
}

- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
  [self updateErrorMessage:message withStack:stack errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack errorCookie:(int)errorCookie
{
  [self showErrorMessage:message
         withParsedStack:[RCTJSStackFrame stackFramesWithDictionaries:stack]
                isUpdate:NO
             errorCookie:errorCookie];
}

- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack errorCookie:(int)errorCookie
{
  [self showErrorMessage:message
         withParsedStack:[RCTJSStackFrame stackFramesWithDictionaries:stack]
                isUpdate:YES
             errorCookie:errorCookie];
}

- (void)showErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
{
  [self showErrorMessage:message withParsedStack:stack errorCookie:-1];
}

- (void)updateErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
{
  [self updateErrorMessage:message withParsedStack:stack errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message
         withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
             errorCookie:(int)errorCookie
{
  [self showErrorMessage:message withParsedStack:stack isUpdate:NO errorCookie:errorCookie];
}

- (void)updateErrorMessage:(NSString *)message
           withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
               errorCookie:(int)errorCookie
{
  [self showErrorMessage:message withParsedStack:stack isUpdate:YES errorCookie:errorCookie];
}

- (void)showErrorMessage:(NSString *)message
         withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
                isUpdate:(BOOL)isUpdate
             errorCookie:(int)errorCookie
{
  if (isUpdate || errorCookie != -1) {
    return;
  }

  if ([self.logBox respondsToSelector:@selector(hide)]) {
    [self.logBox performSelector:@selector(hide)];
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    id appError = EXDevLauncherMakeAppError([self stripAnsi:message], stack);
    id errorManager = [[EXDevLauncherController sharedInstance] errorManager];
    if (appError != nil && errorManager != nil && [errorManager respondsToSelector:@selector(showError:)]) {
      void (*imp)(id, SEL, id) = (void (*)(id, SEL, id))[errorManager methodForSelector:@selector(showError:)];
      if (imp) {
        imp(errorManager, @selector(showError:), appError);
      }
    }
  });
}

- (RCTRedBox *)unsafe_castToRCTRedBox {
  return (RCTRedBox *)self;
}

- (NSString *)stripAnsi:(NSString *)text
{
  NSError *error = nil;
  NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"\\\\x1b\\\\[[0-9;]*m"
                                                                         options:NSRegularExpressionCaseInsensitive
                                                                           error:&error];
  return [regex stringByReplacingMatchesInString:text options:0 range:NSMakeRange(0, [text length]) withTemplate:@""];
}

@end
`
);

update('node_modules/expo-av/ios/EXAV/EXAV.m', (current) => {
  let next = current;
  const swiftImportBlock =
    '#import <ExpoModulesCore/ExpoModulesCore.h>\n#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)\n#import <ExpoModulesCore/ExpoModulesCore-Swift.h>\n#elif __has_include("ExpoModulesCore-Swift.h")\n#import "ExpoModulesCore-Swift.h"\n#endif\n';
  if (!next.includes('ExpoModulesCore-Swift.h')) {
    next = next.replace('#import <ExpoModulesCore/Swift.h>\n', '');
    next = next.replace(
      '#import <ExpoModulesCore/EXJavaScriptContextProvider.h>\n',
      `#import <ExpoModulesCore/EXJavaScriptContextProvider.h>\n${swiftImportBlock}`
    );
  }

  if (!next.includes('Class expoVideoViewClass = NSClassFromString(@"ExpoVideoView") ?: [EXVideoView class];')) {
    next = next.replace(
      '  // TODO check that the bridge is still valid after the dispatch\n  // TODO check if the queues are ok\n',
      '  // TODO check that the bridge is still valid after the dispatch\n  // TODO check if the queues are ok\n  Class expoVideoViewClass = NSClassFromString(@"ExpoVideoView") ?: [EXVideoView class];\n'
    );
  }

  return next.replaceAll('forView:reactTag ofClass:[ExpoVideoView class]];', 'forView:reactTag ofClass:expoVideoViewClass];');
});

update('node_modules/expo-av/ios/EXAV/EXAVTV.m', (current) => {
  if (current.includes('Class expoVideoViewClass = NSClassFromString(@"ExpoVideoView") ?: [EXVideoView class];')) {
    return current.replaceAll('forView:reactTag ofClass:[ExpoVideoView class]];', 'forView:reactTag ofClass:expoVideoViewClass];');
  }

  return current
    .replace(
      '  // TODO check that the bridge is still valid after the dispatch\n  // TODO check if the queues are ok\n',
      '  // TODO check that the bridge is still valid after the dispatch\n  // TODO check if the queues are ok\n  Class expoVideoViewClass = NSClassFromString(@"ExpoVideoView") ?: [EXVideoView class];\n'
    )
    .replaceAll('forView:reactTag ofClass:[ExpoVideoView class]];', 'forView:reactTag ofClass:expoVideoViewClass];');
});

update('node_modules/expo-av/ios/EXAV/ExpoVideoView.swift', (current) => {
  let next = current;
  next = next.replace(
    '@objc(ExpoVideoView)\npublic final class ExpoVideoView: ExpoView {',
    '@objc(ExpoVideoView)\npublic final class ExpoVideoView: ExpoFabricViewObjC {'
  );
  next = next.replace(
    'import ExpoModulesCore\n\npublic final class ExpoVideoView: ExpoView {',
    'import ExpoModulesCore\n\n@objc(ExpoVideoView)\npublic final class ExpoVideoView: ExpoFabricViewObjC {'
  );
  next = next.replace('    super.init(appContext: appContext)\n', '    super.init(frame: .zero)\n');
  if (!next.includes('required init?(coder: NSCoder)')) {
    next = next.replace(
      '  public override func layoutSubviews() {\n    super.layoutSubviews()\n    self.contentView.frame = bounds\n  }\n',
      '  public override func layoutSubviews() {\n    super.layoutSubviews()\n    self.contentView.frame = bounds\n  }\n\n  @available(*, unavailable)\n  required init?(coder: NSCoder) {\n    fatalError("init(coder:) has not been implemented")\n  }\n'
    );
  }
  return next;
});

update('node_modules/expo-av/ios/EXAV.podspec', (current) => {
  if (
    current.includes('"${PODS_ROOT}/Headers/Private/ExpoModulesCore"') &&
    current.includes('"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header"')
  ) {
    return current;
  }

  return current.replace(
    "  s.pod_target_xcconfig = {\n    'DEFINES_MODULE' => 'YES',\n    'SWIFT_COMPILATION_MODE' => 'wholemodule',\n    \"CLANG_CXX_LANGUAGE_STANDARD\" => \"c++20\"\n  }\n",
    "  s.pod_target_xcconfig = {\n    'DEFINES_MODULE' => 'YES',\n    'SWIFT_COMPILATION_MODE' => 'wholemodule',\n    'HEADER_SEARCH_PATHS' => '\"${PODS_ROOT}/Headers/Private/ExpoModulesCore\" \"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header\"',\n    \"CLANG_CXX_LANGUAGE_STANDARD\" => \"c++20\"\n  }\n"
  );
});

update('node_modules/expo-dev-menu/expo-dev-menu.podspec', (current) => {
  let next = current;
  if (!next.includes(`'"$(PODS_CONFIGURATION_BUILD_DIR)/Expo/Swift Compatibility Header"'`)) {
    next = next.replace(
      `    '"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header"',\n`,
      `    '"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header"',\n    '"$(PODS_CONFIGURATION_BUILD_DIR)/Expo/Swift Compatibility Header"',\n`
    );
  }
  if (!next.includes(`'"$(PODS_CONFIGURATION_BUILD_DIR)/EXManifests/Swift Compatibility Header"'`)) {
    next = next.replace(
      `    '"$(PODS_CONFIGURATION_BUILD_DIR)/Expo/Swift Compatibility Header"',\n`,
      `    '"$(PODS_CONFIGURATION_BUILD_DIR)/Expo/Swift Compatibility Header"',\n    '"$(PODS_CONFIGURATION_BUILD_DIR)/EXManifests/Swift Compatibility Header"',\n`
    );
  }
  if (!next.includes('\'"${PODS_ROOT}/Headers/Private/Expo"\'')) {
    next = next.replace(
      `    '"\${PODS_ROOT}/Headers/Private/React-Core"',\n`,
      `    '"\${PODS_ROOT}/Headers/Private/React-Core"',\n    '"\${PODS_ROOT}/Headers/Private/Expo"',\n`
    );
  }
  return next;
});

update('node_modules/expo-dev-launcher/expo-dev-launcher.podspec', (current) => {
  let next = current;

  if (!next.includes(`'"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header"',`)) {
    next = next.replace(
      `  header_search_paths = [\n    '"$(PODS_ROOT)/Headers/Private/React-Core"',\n    '"\${PODS_ROOT}/Headers/Public/RNReanimated"',\n`,
      `  header_search_paths = [\n    '"$(PODS_ROOT)/Headers/Private/React-Core"',\n    '"\${PODS_ROOT}/Headers/Public/RNReanimated"',\n    '"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header"',\n`
    );
  }

  if (next.includes(`'"$(PODS_CONFIGURATION_BUILD_DIR)/expo-dev-menu/Swift Compatibility Header"',`)) {
    return next;
  }

  return next.replace(
    `    '"$(PODS_CONFIGURATION_BUILD_DIR)/EXUpdatesInterface/Swift Compatibility Header"',\n`,
    `    '"$(PODS_CONFIGURATION_BUILD_DIR)/EXUpdatesInterface/Swift Compatibility Header"',\n    '"$(PODS_CONFIGURATION_BUILD_DIR)/expo-dev-menu/Swift Compatibility Header"',\n`
  );
});

overwrite(
  'node_modules/expo-dev-menu/ios/EXDevMenuAppInfo.m',
  `// Copyright 2015-present 650 Industries. All rights reserved.
#import <EXDevMenu/EXDevMenuAppInfo.h>
#import <React/RCTBridge+Private.h>
#import <ExpoModulesCore/ExpoModulesCore.h>

#ifndef EXReactDelegateHandler
#define EXReactDelegateHandler EXReactDelegateWrapper
#endif
#ifndef ExpoReactDelegateHandler
#define ExpoReactDelegateHandler EXReactDelegateHandler
#endif

#if __has_include(<EXDevMenu/EXDevMenu-Swift.h>)
#import <EXDevMenu/EXDevMenu-Swift.h>
#else
#import <EXDevMenu-Swift.h>
#endif

static NSString *EXDevMenuStringValue(id object, SEL selector)
{
  if (object == nil || ![object respondsToSelector:selector]) {
    return nil;
  }
  NSString *(*imp)(id, SEL) = (NSString *(*)(id, SEL))[object methodForSelector:selector];
  return imp ? imp(object, selector) : nil;
}

@implementation EXDevMenuAppInfo

+(NSDictionary *)getAppInfo
{
  NSMutableDictionary *appInfo = [NSMutableDictionary new];

  NSString *appIcon = [EXDevMenuAppInfo getAppIcon];
  NSString *runtimeVersion = @"";
  NSString *appVersion = [EXDevMenuAppInfo getFormattedAppVersion];
  NSString *appName = [[NSBundle mainBundle] objectForInfoDictionaryKey: @"CFBundleDisplayName"] ?: [[NSBundle mainBundle] objectForInfoDictionaryKey: @"CFBundleExecutable"];

  DevMenuManager *manager = [DevMenuManager shared];
  id currentManifest = [manager valueForKey:@"currentManifest"];
  NSURL *currentManifestURL = [manager valueForKey:@"currentManifestURL"];

  if (currentManifest != nil) {
    appName = EXDevMenuStringValue(currentManifest, @selector(name)) ?: appName;
    appVersion = EXDevMenuStringValue(currentManifest, @selector(version)) ?: appVersion;
    runtimeVersion = EXDevMenuStringValue(currentManifest, @selector(runtimeVersion)) ?: runtimeVersion;
  }

  NSString *engine;
  NSString *bridgeDescription = [[[manager currentBridge] batchedBridge] bridgeDescription];

  if ([bridgeDescription containsString:@"BridgeProxy"]) {
  #if USE_HERMES
    engine = @"Hermes";
  #else
    engine = @"JSC";
  #endif
  } else if ([bridgeDescription containsString:@"Hermes"]) {
    engine = @"Hermes";
  } else if ([bridgeDescription containsString:@"V8"]) {
    engine = @"V8";
  } else {
    engine = @"JSC";
  }

  NSString *hostUrl = [currentManifestURL absoluteString] ?: @"";

  appInfo[@"appName"] = appName;
  appInfo[@"appIcon"] = appIcon;
  appInfo[@"appVersion"] = appVersion;
  appInfo[@"runtimeVersion"] = runtimeVersion;
  appInfo[@"hostUrl"] = hostUrl;
  appInfo[@"engine"] = engine;

  return appInfo;
}

+(NSString *)getAppIcon
{
  NSString *appIcon = @"";
  NSString *appIconName = nil;
  @try {
    appIconName = [[[[[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleIcons"] objectForKey:@"CFBundlePrimaryIcon"] objectForKey:@"CFBundleIconFiles"]  lastObject];
  } @catch(NSException *_e) {}

  if (appIconName != nil) {
    NSString *resourcePath = [[NSBundle mainBundle] resourcePath];
    NSString *appIconPath = [resourcePath stringByAppendingPathComponent:[appIconName stringByAppendingPathExtension:@"png"]];
    appIcon = [@"file://" stringByAppendingString:appIconPath];
  }

  return appIcon;
}

+(NSString *)getFormattedAppVersion
{
  NSString *shortVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
  NSString *buildVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"];
  NSString *appVersion = [NSString stringWithFormat:@"%@ (%@)", shortVersion, buildVersion];
  return appVersion;
}

@end
`
);

update(
  'node_modules/expo-dev-launcher/ios/ReactDelegateHandler/ExpoDevLauncherReactDelegateHandler.swift',
  (current) => {
    let next = current;
    if (!next.includes('import React\n')) {
      next = next.replace(
        'import ExpoModulesCore\nimport EXUpdatesInterface\n',
        'import ExpoModulesCore\nimport EXUpdatesInterface\nimport React\n'
      );
    }

    return next
      .replace(
        '    if let sharedController = UpdatesControllerRegistry.sharedInstance.controller {\n      // for some reason the swift compiler and bridge are having issues here\n      EXDevLauncherController.sharedInstance().updatesInterface = sharedController\n      sharedController.updatesExternalInterfaceDelegate = EXDevLauncherController.sharedInstance()\n    }\n',
        '    if let sharedController = UpdatesControllerRegistry.sharedInstance.controller {\n      // Keep this dynamic so Swift does not depend on imported ObjC protocol metadata here.\n      let devLauncherController = EXDevLauncherController.sharedInstance() as NSObject\n      devLauncherController.setValue(sharedController, forKey: "updatesInterface")\n      (sharedController as AnyObject).setValue(devLauncherController, forKey: "updatesExternalInterfaceDelegate")\n    }\n'
      )
      .replace(
        '    developmentClientController.appBridge = RCTBridge.current()\n',
        '    let currentBridge = (NSClassFromString("RCTBridge") as? NSObject.Type)?.value(forKey: "currentBridge")\n    (developmentClientController as NSObject).setValue(currentBridge, forKey: "appBridge")\n'
      )
      .replace(
        '    (developmentClientController as NSObject).setValue(RCTBridge.current(), forKey: "appBridge")\n',
        '    let currentBridge = (NSClassFromString("RCTBridge") as? NSObject.Type)?.value(forKey: "currentBridge")\n    (developmentClientController as NSObject).setValue(currentBridge, forKey: "appBridge")\n'
      );
  }
);

overwrite(
  'node_modules/expo/ios/AppDelegates/EXReactRootViewFactory.h',
  `// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/Platform.h>
#import <Expo/RCTAppDelegateUmbrella.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXReactRootViewFactoryReactDelegate <NSObject>

- (UIView *)createReactRootViewWithModuleName:(NSString *)moduleName
                            initialProperties:(nullable NSDictionary *)initialProperties
                                launchOptions:(nullable NSDictionary *)launchOptions;

- (nullable NSURL *)bundleURL;

@end

NS_SWIFT_NAME(ExpoReactRootViewFactory)
@interface EXReactRootViewFactory : RCTRootViewFactory

@property (nonatomic, weak, nullable) id<EXReactRootViewFactoryReactDelegate> reactDelegate;

/**
 Initializer for EXAppDelegateWrapper integration
 */
- (instancetype)initWithReactDelegate:(nullable id)reactDelegate
                        configuration:(RCTRootViewFactoryConfiguration *)configuration
           turboModuleManagerDelegate:(nullable id)turboModuleManagerDelegate
    NS_SWIFT_NAME(init(reactDelegate:configuration:turboModuleManagerDelegate:));

/**
 Calls super \`viewWithModuleName:initialProperties:launchOptions:\` from \`RCTRootViewFactory\`.
 */
- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(nullable NSDictionary *)initialProperties
                      launchOptions:(nullable NSDictionary *)launchOptions;

@end

FOUNDATION_EXTERN EXReactRootViewFactory *EXCreateReactRootViewFactory(
    id _Nullable reactDelegate,
    RCTRootViewFactoryConfiguration *configuration,
    id _Nullable turboModuleManagerDelegate)
    NS_SWIFT_NAME(EXCreateReactRootViewFactory(_:configuration:turboModuleManagerDelegate:));

NS_ASSUME_NONNULL_END
`
);

overwrite(
  'node_modules/expo/ios/AppDelegates/EXReactRootViewFactory.mm',
  `// Copyright 2018-present 650 Industries. All rights reserved.

#import <Expo/EXReactRootViewFactory.h>
#import <Expo/RCTAppDelegateUmbrella.h>
#import <Expo/Swift.h>

@interface RCTRootViewFactory ()

- (NSURL *)bundleURL;

@end

@implementation EXReactRootViewFactory

- (instancetype)initWithReactDelegate:(nullable id)reactDelegate
                        configuration:(RCTRootViewFactoryConfiguration *)configuration
           turboModuleManagerDelegate:(nullable id)turboModuleManagerDelegate
{
  if (self = [super initWithConfiguration:configuration andTurboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate]) {
    self.reactDelegate = (id<EXReactRootViewFactoryReactDelegate>)reactDelegate;
  }
  return self;
}

- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties
                 launchOptions:(nullable NSDictionary *)launchOptions
{
  if (self.reactDelegate != nil) {
    return [self.reactDelegate createReactRootViewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
  }
  return [super viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
}

- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(nullable NSDictionary *)initialProperties
                      launchOptions:(nullable NSDictionary *)launchOptions
{
  return [super viewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
}

- (NSURL *)bundleURL
{
  return [self.reactDelegate bundleURL] ?: [super bundleURL];
}

@end

EXReactRootViewFactory *EXCreateReactRootViewFactory(
    id _Nullable reactDelegate,
    RCTRootViewFactoryConfiguration *configuration,
    id _Nullable turboModuleManagerDelegate)
{
  return [[EXReactRootViewFactory alloc] initWithReactDelegate:reactDelegate
                                                 configuration:configuration
                                    turboModuleManagerDelegate:turboModuleManagerDelegate];
}
`
);

update('node_modules/expo-modules-core/ios/ExpoModulesCore.h', (current) => {
  let next = current.replace(/^#pragma once\s*\n+/, '');
  next = `#pragma once\n\n${next}`;
  next = next.replace(/^#import <ExpoModulesCore\/ExpoModulesCore\.h>\n/gm, '');
  next = next.replace(/^#import "ExpoModulesCore\.h"\n/gm, '');
  return next;
});

for (const relativePath of [
  'node_modules/react-native/ReactCommon/hermes/executor/HermesExecutorFactory.h',
  'node_modules/react-native/ReactCommon/react/runtime/hermes/HermesInstance.h',
]) {
  update(relativePath, (current) =>
    current
      .replace('#include <hermes/hermes.h>', '#include "hermes/hermes.h"')
      .replace('#include <hermes/Public/HermesRuntime.h>', '#include "hermes/hermes.h"')
  );
}

ensureArrayEntries(
  'node_modules/react-native/scripts/cocoapods/new_architecture.rb',
  'excluded_info_plist = [',
  ['.appex', 'build/', 'Build/', 'build-device-xcode/', 'build-generic-xcode/', 'DerivedData/']
);

const podsProjectPath = 'ios/Pods/Pods.xcodeproj/project.pbxproj';
if (fs.existsSync(path.join(repoRoot, podsProjectPath))) {
  removePodsShellScriptPhases(podsProjectPath, [
    'Copy generated compatibility header',
    '[CP-User] Generate app.config for prebuilt Constants.manifest',
    '[CP] Copy XCFrameworks',
    '[CP-User] [Hermes] Replace Hermes for the right configuration, if needed',
    '[CP-User] [RN]Check FBReactNativeSpec',
    '[CP-User] Generate Specs',
  ]);
}

rewritePodConfigModulemapPaths();
rewriteKnownExpoDevModulemapAliases();

for (const relativePath of [
  'ios/Pods/Target Support Files/EXAV/EXAV.debug.xcconfig',
  'ios/Pods/Target Support Files/EXAV/EXAV.release.xcconfig',
]) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) {
    continue;
  }

  update(relativePath, (current) => {
    const needle = '"${PODS_ROOT}/Headers/Private/EXAV"';
    const insertion = '"${PODS_ROOT}/Headers/Private/ExpoModulesCore"';
    let next = current;
    if (!next.includes(insertion)) {
      next = next.replace(needle, `${needle} ${insertion}`);
    }
    const swiftCompat = '"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header"';
    if (!next.includes(swiftCompat)) {
      next = next.replace(
        '"${PODS_ROOT}/Headers/Public/hermes-engine"',
        '"${PODS_ROOT}/Headers/Public/hermes-engine" ' + swiftCompat
      );
    }
    return next;
  });
}

for (const relativePath of [
  'ios/Pods/Target Support Files/expo-dev-menu/expo-dev-menu.debug.xcconfig',
  'ios/Pods/Target Support Files/expo-dev-menu/expo-dev-menu.release.xcconfig',
]) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) {
    continue;
  }

  update(relativePath, (current) => {
    let next = current;
    if (!next.includes('"${PODS_ROOT}/Headers/Private/Expo"')) {
      next = next.replace(
        '"${PODS_ROOT}/Headers/Private/React-Core"',
        '"${PODS_ROOT}/Headers/Private/React-Core" "${PODS_ROOT}/Headers/Private/Expo"'
      );
    }
    if (!next.includes('"$(PODS_CONFIGURATION_BUILD_DIR)/EXManifests/Swift Compatibility Header"')) {
      next = next.replace(
        '"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header"',
        '"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header" "$(PODS_CONFIGURATION_BUILD_DIR)/Expo/Swift Compatibility Header" "$(PODS_CONFIGURATION_BUILD_DIR)/EXManifests/Swift Compatibility Header"'
      );
    } else if (!next.includes('"$(PODS_CONFIGURATION_BUILD_DIR)/Expo/Swift Compatibility Header"')) {
      next = next.replace(
        '"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header"',
        '"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header" "$(PODS_CONFIGURATION_BUILD_DIR)/Expo/Swift Compatibility Header"'
      );
    }
    return next;
  });
}

for (const relativePath of [
  'ios/Pods/Target Support Files/expo-dev-launcher/expo-dev-launcher.debug.xcconfig',
  'ios/Pods/Target Support Files/expo-dev-launcher/expo-dev-launcher.release.xcconfig',
]) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) {
    continue;
  }

  update(relativePath, (current) => {
    let next = current;
    const expoModulesSwiftCompat = '"$(PODS_CONFIGURATION_BUILD_DIR)/ExpoModulesCore/Swift Compatibility Header"';
    const devMenuSwiftCompat = '"$(PODS_CONFIGURATION_BUILD_DIR)/expo-dev-menu/Swift Compatibility Header"';
    if (!next.includes(expoModulesSwiftCompat)) {
      next = next.replace(
        '"${PODS_ROOT}/Headers/Public/RNReanimated"',
        '"${PODS_ROOT}/Headers/Public/RNReanimated" ' + expoModulesSwiftCompat
      );
    }
    if (next.includes(devMenuSwiftCompat)) {
      return next;
    }
    return next.replace(
      expoModulesSwiftCompat,
      `${expoModulesSwiftCompat} ${devMenuSwiftCompat}`
    );
  });
}

if (touched.length === 0) {
  console.log('native repair: already applied');
} else {
  console.log(`native repair: updated ${touched.length} file(s)`);
  for (const relativePath of touched) {
    console.log(`- ${relativePath}`);
  }
}
