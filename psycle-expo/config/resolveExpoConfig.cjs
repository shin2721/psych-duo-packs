const base = require("../app.json");

const PRODUCTION_PROFILE = "production";
const DEV_CLIENT_PLUGIN = "expo-dev-client";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isProductionProfile(env = process.env) {
  return env.EAS_BUILD_PROFILE === PRODUCTION_PROFILE;
}

function pruneProductionOnlyConfig(config) {
  const next = clone(config);

  next.plugins = (next.plugins || []).filter((plugin) => {
    if (typeof plugin === "string") return plugin !== DEV_CLIENT_PLUGIN;
    return plugin?.[0] !== DEV_CLIENT_PLUGIN;
  });

  const infoPlist = next.ios?.infoPlist;
  const ats = infoPlist?.NSAppTransportSecurity;
  if (ats) {
    delete ats.NSAllowsLocalNetworking;
    delete ats.NSExceptionDomains?.["exp.direct"];
    if (ats.NSExceptionDomains && Object.keys(ats.NSExceptionDomains).length === 0) {
      delete ats.NSExceptionDomains;
    }
  }

  return next;
}

function resolveExpoConfig(env = process.env) {
  const config = clone(base.expo);
  return isProductionProfile(env) ? pruneProductionOnlyConfig(config) : config;
}

module.exports = {
  resolveExpoConfig,
  pruneProductionOnlyConfig,
  isProductionProfile,
};
