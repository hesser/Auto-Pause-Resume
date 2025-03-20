const path = require('path');

module.exports = {
  entry: './src/pause-resume-recording-widget.js',
  output: {
    filename: 'wxcc-recording-control.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'WxccRecordingControl',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  
};