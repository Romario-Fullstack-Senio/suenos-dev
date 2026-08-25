import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

export default withSentryConfig(nextConfig, {
  org: 'suenos-dev',
  project: 'web',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/api/sentry',
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
