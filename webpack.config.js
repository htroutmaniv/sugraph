const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
  // Entry point is your React app
  entry: './src/client/index.js',

  // Output configuration
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/',
    clean: true,
  },

  // Set single mode and disable source maps for production
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: false,

  // Add optimization for production
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            dead_code: true,
            drop_debugger: true,
          },
          mangle: {
            keep_fnames: true, // Keep function names to prevent breaks
            keep_classnames: true, // Keep class names to prevent breaks
            reserved: ['_j'], // Keep our special functions
            properties: false, // Disable property mangling
          },
          output: {
            comments: false,
            ascii_only: true,
            beautify: false,
          },
        },
        extractComments: false,
      }),
    ],
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },

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
    new WebpackObfuscator(
      {
        rotateStringArray: true,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.5, // Reduced from 0.8
        identifierNamesGenerator: 'hexadecimal',
        splitStrings: false, // Disabled
        transformObjectKeys: false, // Disabled
        numbersToExpressions: false, // Disabled
        controlFlowFlattening: false, // Disabled
        deadCodeInjection: false, // Disabled
        debugProtection: false, // Disabled
        disableConsoleOutput: true,
        selfDefending: false, // Disabled
        renameGlobals: false, // Disabled to prevent breaks
        identifiersPrefix: '_0x',
      },
      [
        // Add any files you want to exclude from obfuscation
        'node_modules/**',
      ]
    ),
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
