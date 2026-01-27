const { DetoxCircusEnvironment, SpecReporter, WorkerAssignReporter } = require('detox/runners/jest');

const config = {
  setupTimeout: 120000,
  teardownTimeout: 120000,
  heartbeatInterval: 5000,
  safetyInterval: 3000,
  launchTimeout: 60000,
  responseTimeout: 30000,
};

const detoxCircus = DetoxCircusEnvironment(config);
const specReporter = SpecReporter({ detox: { cleanup: false } });
const workerAssignReporter = WorkerAssignReporter();

module.exports = detoxCircus;