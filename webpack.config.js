const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf)$/i,
        type: 'asset/resource',
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: 'body' // ✅ ensures bundle.js is inserted correctly
    })
  ],
  output: {
    filename: 'bundle.[contenthash].js', // ✅ cache-busting
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',  // ✅ absolute path for Vercel
    clean: true
  },
  devServer: {
    static: './dist',
    port: 8080,
    historyApiFallback: true // ✅ React Router SPA fallback
  }
};
