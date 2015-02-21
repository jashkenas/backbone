var _ = require('underscore');

// Browsers to run on Sauce Labs platforms
var sauceBrowsers = _.reduce([
  ['firefox', '35'],
  ['firefox', '30'],
  ['firefox', '20'],
  ['firefox', '11'],
  ['firefox', '4'],

  ['chrome', '40'],
  ['chrome', '35'],
  ['chrome', '28'],

  ['internet explorer', '11', 'Windows 8.1'],
  ['internet explorer', '10', 'Windows 8'],
  ['internet explorer', '9', 'Windows 7'],
  ['internet explorer', '8'],
  ['internet explorer', '7', 'Windows XP'],
  // ['internet explorer', '6', 'Windows XP'],

  ['opera', '12'],
  ['opera', '11'],

  ['android', '4.3'],
  ['android', '4.0'],

  ['safari', '8'],
  ['safari', '7'],
  ['safari', '6'],
  ['safari', '5']
], function(memo, platform) {
  var label = (platform[0] + '_v' + platform[1]).replace(' ', '_').toUpperCase();
  memo[label] = _.pick({
    'base': 'SauceLabs',
    'browserName': platform[0],
    'version': platform[1],
    'platform': platform[2]
  }, Boolean);
  return memo;
}, {});

module.exports = function(config) {
  if ( !process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY ) {
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

    // test results reporter to use
    reporters: ['dots', 'saucelabs'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    sauceLabs: {
      build: 'TRAVIS #' + process.env.TRAVIS_BUILD_NUMBER + ' (' + process.env.TRAVIS_BUILD_ID + ')',
      startConnect: true,
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
    },

    captureTimeout: 120000,
    customLaunchers: sauceBrowsers

    // Browsers to launch, commented out to prevent karma from starting
    // too many concurrent browsers and timing sauce out.
    // browsers: _.keys(sauceBrowsers)
  });
};
