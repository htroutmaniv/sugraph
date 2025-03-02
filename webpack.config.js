const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Entry point is your React app
  entry: './src/client/index.js',

  // Output configuration
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/',
  },

  // Development settings
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: 'source-map',

  // Loaders for different file types
  module: {
    rules: [
      {
        // JavaScript/React files
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react'],
          },
        },
      },
      {
        // CSS files
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        // Image files
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/,
        type: 'asset/resource',
      },
    ],
  },

  // Plugins
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],

  // Development server configuration
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:3001', // Proxy API requests to backend
    },
  },

  // Path resolving
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
