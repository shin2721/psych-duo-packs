const { withXcodeProject } = require("@expo/config-plugins");
const { withConfig } = require("@bittingz/expo-widgets/plugin/build/ios/withConfig");
const { withModule } = require("@bittingz/expo-widgets/plugin/build/ios/withModule");
const { withWidgetXCode } = require("@bittingz/expo-widgets/plugin/build/ios/withWidgetXCode");
const { withEntitlements } = require("@bittingz/expo-widgets/plugin/build/ios/xcode/withEntitlements");
const { withWidgetInfoPlist } = require("@bittingz/expo-widgets/plugin/build/ios/xcode/withWidgetInfoPlist");

function normalizeIOSOptions(options) {
  const ios = options?.ios || {};
  const envTeamId =
    process.env.APPLE_TEAM_ID ||
    process.env.EXPO_APPLE_TEAM_ID ||
    process.env.EAS_APPLE_TEAM_ID ||
    "";

  return {
    src: ios.src || "widgets/ios",
    deploymentTarget: ios.deploymentTarget || "16.2",
    useLiveActivities: Boolean(ios.useLiveActivities),
    frequentUpdates: Boolean(ios.frequentUpdates),
    devTeamId: ios.devTeamId || envTeamId || "AAAAAAAAAA",
    moduleDependencies: Array.isArray(ios.moduleDependencies) ? ios.moduleDependencies : [],
    mode: ios.mode || "production",
    widgetExtPlugins: Array.isArray(ios.widgetExtPlugins) ? ios.widgetExtPlugins : [],
    xcode: {
      widgetBundleIdentifier: ios.xcode?.widgetBundleIdentifier,
      appGroupId: ios.xcode?.appGroupId,
      entitlements: ios.xcode?.entitlements,
      configOverrides: ios.xcode?.configOverrides,
      appExtAPI: Boolean(ios.xcode?.appExtAPI),
    },
    targetName: ios.targetName,
  };
}

function withPsycleWidgets(config, options = {}) {
  const iosOptions = normalizeIOSOptions(options);

  config = withConfig(config, iosOptions);

  return withXcodeProject(config, (configWithProject) => {
    const project = configWithProject.modResults;
    const originalAddTargetAttribute = project.addTargetAttribute?.bind(project);

    // expo-widgets writes an invalid PBX line when DevelopmentTeam is empty.
    if (originalAddTargetAttribute) {
      project.addTargetAttribute = (name, value, target) => {
        if (name === "DevelopmentTeam" && (value === "" || value == null)) {
          return null;
        }
        return originalAddTargetAttribute(name, value, target);
      };
    }

    withModule(configWithProject, iosOptions);
    withWidgetXCode(configWithProject, iosOptions);
    withEntitlements(configWithProject, iosOptions);
    withWidgetInfoPlist(configWithProject, iosOptions);
    return configWithProject;
  });
}

module.exports = withPsycleWidgets;
