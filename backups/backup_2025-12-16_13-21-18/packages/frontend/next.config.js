/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    experimental: {
        serverActions: true,
    },
    webpack: (config, { isServer }) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };

        // Add alias for utils
        config.resolve.alias = {
            ...config.resolve.alias,
            '@/utils': path.join(__dirname, 'app/utils'),
        };

        return config;
    },
};

module.exports = nextConfig;
