const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  output: {
    publicPath: "/",
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true
  },
  watchOptions: {
    aggregateTimeout: 200,
    poll: 1000
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Cocoding Classroom",
      template: "./src/index.html",
      inject: false
    })
  ],
  devServer: {
    port: 3000,
    static: path.resolve(__dirname, "dist"),
    historyApiFallback: true,
    hot: true
  },
  devtool: "eval-source-map",
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|jpg|jpeg|gif|md)$/i,
        type: "asset/resource"
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
      },
      {
        test: /\.(md)$/i,
        type: "asset/source"
      },
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  }
};
