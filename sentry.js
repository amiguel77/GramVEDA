(function () {
  'use strict';

  if (!window.Sentry) {
    console.warn('[Sentry] SDK not available.');
    return;
  }

  Sentry.init({
    sendDefaultPii: false,

    // Helps prevent noisy duplicate events
    maxBreadcrumbs: 50,

    tracesSampleRate: 0,

    beforeSend(event) {
      // Never attach sensitive application data to Sentry
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete event.user.ip_address;
      }

      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;

        if (event.request.headers) {
          delete event.request.headers.Authorization;
          delete event.request.headers.authorization;
          delete event.request.headers.Cookie;
          delete event.request.headers.cookie;
        }
      }

      return event;
    }
  });

// Small helper 
  window.SentryHelper = {
    error(error, context = {}) {
      if (!window.Sentry) return;

      Sentry.withScope((scope) => {
        addSafeContext(scope, context);
        Sentry.captureException(error);
      });
    },

    message(message, context = {}, level = 'info') {
      if (!window.Sentry) return;

      Sentry.withScope((scope) => {
        addSafeContext(scope, context);
        Sentry.captureMessage(message, level);
      });
    },

    breadcrumb(message, category = 'app') {
      if (!window.Sentry) return;

      Sentry.addBreadcrumb({
        message: String(message).slice(0, 200),
        category,
        level: 'info'
      });
    },

    authError(error, context = {}) {
      this.error(error, {
        feature: 'auth',
        ...context
      });
    },

    databaseError(error, context = {}) {
      this.error(error, {
        feature: 'database',
        ...context
      });
    },

    aiError(error, context = {}) {
      this.error(error, {
        feature: 'sahayak',
        ...context
      });
    },

    networkError(error, context = {}) {
      this.error(error, {
        feature: 'network',
        ...context
      });
    }
  };

// Only allow simple supplied metadata
  function addSafeContext(scope, context) {
    const allowedKeys = [
      'feature',
      'action',
      'page',
      'operation',
      'status',
      'method',
      'endpoint',
      'component'
    ];

    for (const key of allowedKeys) {
      if (
        Object.prototype.hasOwnProperty.call(context, key) &&
        context[key] !== undefined &&
        context[key] !== null
      ) {
        scope.setTag(key, String(context[key]).slice(0, 100));
      }
    }
  }

  console.info('[Sentry] GramVEDA monitoring initialized.');
})();
