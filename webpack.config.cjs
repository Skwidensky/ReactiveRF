const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.tsx',
    mode: 'development',
    devServer: {
        static: path.join(__dirname, 'dist'),
        port: 4002,
        host: '0.0.0.0',
        proxy: {
            '^/api/*': {
                target: 'http://0.0.0.0:4003/api/',
                secure: false,
                context: () => true,
            }
        },
    },
    output: {
        publicPath: 'http://0.0.0.0:4002/',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx|tsx|ts)$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            }
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        // Work around for Buffer is undefined:
        // https://github.com/webpack/changelog-v5/issues/10
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        new webpack.HotModuleReplacementPlugin({
            multiStep: true
        })
    ]
}
