// Note some browser launchers should be installed before using karma start.
// For example:
// npm install karma-firefox-launcher
// karma start --browsers=Firefox
module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['browserify', 'mocha'],

    // list of files / patterns to load in the browser
    files: [
      'index.js',
      'test/*.js'
    ],

    preprocessors: {
      'index.js': ['browserify'],
      'test/**/*.js': ['browserify']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9877,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // See http://stackoverflow.com/a/27873086/1517919
    customLaunchers: {
        Chrome_sandbox: {
            base: 'Chrome',
            flags: ['--no-sandbox']
        }
    }
  });
};
