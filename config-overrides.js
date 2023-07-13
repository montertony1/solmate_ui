const { ProvidePlugin } = require('webpack');

module.exports = function (config, env) {
    return {
        ...config,
        module: {
            ...config.module,
            rules: [
                ...config.module.rules,
                {
                    test: /\.(m?js|ts)$/,
                    enforce: 'pre',
                    use: ['source-map-loader'],
                },
            ],
        },
        plugins: [
            ...config.plugins,
            new ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
            }),
            new ProvidePlugin({
                process: 'process/browser',
            }),
        ],
        resolve: {
            ...config.resolve,
            fallback: {
                "crypto": require.resolve("crypto-browserify"), 
                "stream": require.resolve("stream-browserify"), 
                "assert": require.resolve("assert"), 
                "http": require.resolve("stream-http"), 
                "https": require.resolve("https-browserify"), 
                "os": require.resolve("os-browserify"), 
                "url": require.resolve("url"),
                "zlib": require.resolve("browserify-zlib")
            },
        },
        ignoreWarnings: [/Failed to parse source map/],
    };
};
