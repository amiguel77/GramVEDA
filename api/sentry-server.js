import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Do not collect PII by default.
  sendDefaultPii: false,

  // Error monitoring for now.
  tracesSampleRate: 0
});

const SAFE_KEYS = [
  'feature',
  'action',
  'operation',
  'status',
  'method',
  'endpoint',
  'model',
  'environment'
];

function addSafeContext(scope, context = {}) {
  for (const key of SAFE_KEYS) {
    const value = context[key];

    if (
      value !== undefined &&
      value !== null
    ) {
      scope.setTag(
        key,
        String(value).slice(0, 100)
      );
    }
  }
}

export function captureError(error, context = {}) {
  Sentry.withScope((scope) => {
    addSafeContext(scope, context);

    Sentry.captureException(error);
  });
}

export function captureMessage(
  message,
  context = {},
  level = 'info'
) {
  Sentry.withScope((scope) => {
    addSafeContext(scope, context);

    Sentry.captureMessage(
      String(message).slice(0, 200),
      level
    );
  });
}

export function aiError(error, context = {}) {
  captureError(error, {
    feature: 'sahayak',
    ...context
  });
}

export function databaseError(error, context = {}) {
  captureError(error, {
    feature: 'database',
    ...context
  });
}

export function networkError(error, context = {}) {
  captureError(error, {
    feature: 'network',
    ...context
  });
}

export function serverError(error, context = {}) {
  captureError(error, {
    feature: 'server',
    ...context
  });
}

export function breadcrumb(
  message,
  category = 'server'
) {
  Sentry.addBreadcrumb({
    message: String(message).slice(0, 200),
    category,
    level: 'info'
  });
}

export async function flush(timeout = 2000) {
  return Sentry.flush(timeout);
}

export { Sentry };
