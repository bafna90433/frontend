const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.[contenthash].js",
    publicPath: "/",
    clean: true
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  module: {
    rules: [
      { test: /\.tsx?$/, exclude: /node_modules/, use: "ts-loader" },
      { test: /\.css$/i, use: ["style-loader", "css-loader"] },
      { test: /\.(png|jpe?g|gif|svg|webp|ico)$/i, type: "asset/resource" },
      { test: /\.(woff2?|eot|ttf|otf)$/i, type: "asset/resource" }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: "./public/index.html" }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "public", to: ".", globOptions: { ignore: ["**/index.html"] } }
      ]
    })
  ],
  devServer: {
    historyApiFallback: true,
    static: { directory: path.join(__dirname, "public") },
    port: 3000
  }
};
