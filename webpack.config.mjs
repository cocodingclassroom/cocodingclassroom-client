import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default (env, arg) => {
    return {
        mode: 'development',
        output: {
            publicPath: '/',
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
        },
        watchOptions: {
            aggregateTimeout: 200,
            poll: 1000,
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: 'Cocoding Classroom',
                template: './src/index.html',
                inject: false,
            }),
            new CopyPlugin({
                patterns: [
                    './src/assets/resource/*.svg',
                    './src/assets/fonts/*',
                    './src/assets/css/global.css',
                    { from: './src/bindings/', to: 'bindings' },
                ],
            }),
        ],
        devServer: {
            port: 3000,
            static: path.resolve(__dirname, 'dist'),
            historyApiFallback: true,
            hot: true,
        },
        devtool: 'eval-source-map',
        module: {
            rules: [
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.svg$/,
                    loader: 'svg-inline-loader',
                },
                {
                    test: /\.(md)$/i,
                    type: 'asset/source',
                },
                {
                    test: /\.(png|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.\/src\/assets\/resource\/*.svg$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.(js)$/,
                    exclude: /node_modules/,
                    resolve: {
                        fullySpecified: false,
                    },
                },
                {
                    test: /\.m?js/,
                    resolve: {
                        fullySpecified: false,
                    },
                },
            ],
        },
    }
}
