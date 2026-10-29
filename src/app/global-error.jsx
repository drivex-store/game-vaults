'use client';

import React, { useEffect } from 'react';

const ACCENT_COLOR = '#fd551d';
const BG_COLOR = '#141314';
const TEXT_COLOR = '#eeeeee';
const POSTHOG_KEY = 'phc_Yecr0Uo2VzDFAMckw6XdMeHxMC8JorR3xFeMYmtBm3v';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    try {
      typeof window.posthog?.captureException === 'function'
        ? window.posthog.captureException(error, {
            $exception_level: 'error',
            source: 'global-error',
          })
        : (function (err) {
            if (
              !POSTHOG_KEY ||
              typeof navigator === 'undefined' ||
              typeof navigator.sendBeacon !== 'function'
            ) {
              return;
            }
            const payload = JSON.stringify({
              api_key: POSTHOG_KEY,
              event: '$exception',
              distinct_id: 'global-error-' + Math.random().toString(36).slice(2),
              properties: {
                $exception_level: 'error',
                $exception_type: err?.name || 'Error',
                $exception_message: err?.message || String(err),
                $exception_list: [
                  {
                    type: err?.name || 'Error',
                    value: err?.message || String(err),
                    mechanism: {
                      handled: true,
                      synthetic: false,
                    },
                  },
                ],
                source: 'global-error',
                ...(err?.digest ? { digest: err.digest } : {}),
              },
              timestamp: new Date().toISOString(),
            });
            navigator.sendBeacon(
              '/relay-A8q3/e/',
              new Blob([payload], { type: 'application/json' })
            );
          })(error);
    } catch (err) {}
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG_COLOR,
          color: TEXT_COLOR,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: 480, padding: '0 24px', textAlign: 'center' }}>
          <div
            style={{
              width: 10,
              height: 10,
              background: ACCENT_COLOR,
              margin: '0 auto 28px',
            }}
          />
          <h1
            style={{
              fontSize: 28,
              lineHeight: 1.1,
              fontWeight: 500,
              margin: '0 0 12px',
            }}
          >
            Something broke.
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              opacity: 0.7,
              margin: '0 0 28px',
            }}
          >
            An unexpected error stopped the page from loading. Something went
            wrong on our side. Try again, or head back home.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              style={{
                background: ACCENT_COLOR,
                color: BG_COLOR,
                border: 'none',
                padding: '10px 18px',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                background: 'transparent',
                color: TEXT_COLOR,
                border: `1px solid ${TEXT_COLOR}1a`,
                padding: '10px 18px',
                fontSize: 13,
                textDecoration: 'none',
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
              }}
            >
              Go home
            </a>
          </div>
          {error?.digest ? (
            <p
              style={{
                marginTop: 24,
                fontSize: 11,
                opacity: 0.4,
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
