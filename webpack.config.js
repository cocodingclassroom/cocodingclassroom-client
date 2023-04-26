const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { tree } = require("lib0");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    publicPath: "/",
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  watchOptions: {
    aggregateTimeout: 200,
    poll: 1000,
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Cocoding Classroom",
      template: "./src/index.html",
    }),
  ],
  devServer: {
    port: 3000,
    static: path.resolve(__dirname, "dist"),
    historyApiFallback: true,
    hot: false,
  },
  devtool: "eval-source-map",
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
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
};
