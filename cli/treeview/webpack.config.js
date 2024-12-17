const path = require('path');
const { webpack } = require('webpack');

module.exports = {
  entry: './src/index.ts', 

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  
  target: 'node', 
  mode: 'none',
  resolve: {
    extensions: [ '.js' ,'.ts']
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: path.resolve(__dirname, "./src/"),
        exclude: /node_modules/,
        loader: 'ts-loader',
      }
    ]
  },

  devtool: 'inline-source-map',
};
