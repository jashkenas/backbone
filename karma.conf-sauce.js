var _ = require('underscore');

// Browsers to run on Sauce Labs platforms
var sauceBrowsers = _.reduce([
  ['firefox', '35'],
  ['firefox', '30'],
  ['firefox', '21'],
  ['firefox', '11'],
  ['firefox', '4'],

  ['chrome', '40'],
  ['chrome', '39'],
  ['chrome', '31'],
  ['chrome', '26'],

  ['microsoftedge', '20.10240', 'Windows 10'],
  ['internet explorer', '11', 'Windows 10'],
  ['internet explorer', '10', 'Windows 8'],
  ['internet explorer', '9', 'Windows 7'],

  ['opera', '12'],
  ['opera', '11'],

  ['android', '5'],
  ['android', '4.4'],

  // 4.3 currently erros with some router tests
  // ['android', '4.3'],

  ['android', '4.0'],

  ['safari', '8.0', 'OS X 10.10'],
  ['safari', '7'],
  ['safari', '6'],
  ['safari', '5']
], function(memo, platform) {
  // internet explorer -> ie
  var label = platform[0].split(' ');
  if (label.length > 1) {
    label = _.invoke(label, 'charAt', 0);
  }
  label = (label.join('') + '_v' + platform[1]).replace(' ', '_').toUpperCase();
  memo[label] = _.pick({
    base: 'SauceLabs',
    browserName: platform[0],
    version: platform[1],
    platform: platform[2]
  }, Boolean);
  return memo;
}, {});

module.exports = function(config) {
  if ( !process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY ) {
    // eslint-disable-next-line no-console
    console.log('Sauce environments not set --- Skipping');
    return process.exit(0);
  }

  config.set({
    basePath: '',
    frameworks: ['qunit'],
    singleRun: true,

    // list of files / patterns to load in the browser
    files: [
      'test/vendor/jquery.js',
      'test/vendor/json2.js',
      'test/vendor/underscore.js',
      'backbone.js',
      'test/setup/*.js',
      'test/*.js'
    ],

    // Number of sauce tests to start in parallel
    concurrency: 9,

    // test results reporter to use
    reporters: ['dots', 'saucelabs'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    sauceLabs: {
      build: 'GH #' + process.env.BUILD_NUMBER + ' (' + process.env.BUILD_ID + ')',
      startConnect: true,
      tunnelIdentifier: process.env.JOB_NUMBER
    },

    captureTimeout: 120000,
    customLaunchers: sauceBrowsers,

    // Browsers to launch, commented out to prevent karma from starting
    // too many concurrent browsers and timing sauce out.
    browsers: _.keys(sauceBrowsers)
  });
};
