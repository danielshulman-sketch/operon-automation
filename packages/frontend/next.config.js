/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    experimental: {
        instrumentationHook: false,
    },
    webpack: (config, { isServer }) => {
        // Avoid filesystem cache recursion issues on OneDrive/Windows.
        config.cache = { type: 'memory' };

        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };

        // Avoid resolve loops with pnpm junctions on Windows/OneDrive.
        config.resolve.symlinks = false;
        config.resolveLoader = {
            ...config.resolveLoader,
            symlinks: false,
        };

        // Add alias for utils
        config.resolve.alias = {
            ...config.resolve.alias,
            'mock-aws-s3': false,
            'aws-sdk': false,
            'nock': false,
            '@/utils': path.join(__dirname, 'app/utils'),
        };

        if (isServer) {
            const currentExternals = Array.isArray(config.externals)
                ? config.externals
                : config.externals
                    ? [config.externals]
                    : [];
            config.externals = [...currentExternals, 'argon2'];
        }

        return config;
    },
};

module.exports = nextConfig;
