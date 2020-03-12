module.exports = {
    entry: './src/js/index.js',
    module: {
        rules: [
            {
                test: /\.html$/,
                use: ['html-loader'],
            },
        ],
    },
};
