const ENV_NAME = 'SOURCE_DATE_EPOCH';

export function sourceDateEpoch(env = process.env) {
  const value = env[ENV_NAME];
  if (value === undefined || value === '') return undefined;
  if (!/^\d+$/.test(value)) {
    throw new Error(`${ENV_NAME} must be an integer number of seconds since the Unix epoch`);
  }

  const seconds = Number(value);
  const milliseconds = seconds * 1000;
  if (
    !Number.isSafeInteger(seconds) ||
    !Number.isFinite(milliseconds) ||
    Number.isNaN(new Date(milliseconds).valueOf())
  ) {
    throw new Error(`${ENV_NAME} is outside the supported date range`);
  }
  return seconds;
}

export function buildDate(env = process.env, fallback = new Date()) {
  const seconds = sourceDateEpoch(env);
  return seconds === undefined ? fallback : new Date(seconds * 1000);
}

export function formatBuildTimestamp(date) {
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

export function reproducibleBuild(env = process.env) {
  return sourceDateEpoch(env) !== undefined;
}
