var _ = require('underscore');

// Browsers to run on Sauce Labs platforms
var sauceBrowsers = _.reduce([
  ['firefox', 'latest'],
  ['firefox', '60'],
  ['firefox', '40'],
  // TODO: find a way to get testing on old Firefox to work. See
  // https://github.com/jashkenas/backbone/runs/4907194010?check_suite_focus=true
  // ['firefox', '11'],

  ['chrome', 'latest'],
  ['chrome', '60'],
  ['chrome', '40'],
  ['chrome', '26'],

  // latest Edge as well as pre-Blink versions
  ['microsoftedge', 'latest', 'Windows 11'],
  ['microsoftedge', '18', 'Windows 10'],
  ['microsoftedge', '13', 'Windows 10'],

  ['internet explorer', 'latest', 'Windows 10'],
  ['internet explorer', '10', 'Windows 8'],
  ['internet explorer', '9', 'Windows 7'],
  // Older versions of IE no longer supported by Sauce Labs

  ['safari', 'latest', 'macOS 12'],
  ['safari', '12', 'macOS 10.14'],
  ['safari', '11', 'macOS 10.13'],
  ['safari', '8', 'OS X 10.10'],

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
    browserDisconnectTimeout: 60000,
    browserDisconnectTolerance: 2,
    browserNoActivityTimeout: 60000,

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
    concurrency: 4,

    // test results reporter to use
    reporters: ['dots', 'saucelabs'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    sauceLabs: {
      build: 'GH #' + process.env.BUILD_NUMBER + ' (' + process.env.BUILD_ID + ')',
      startConnect: true,
      tunnelIdentifier: process.env.JOB_NUMBER,
      region: 'eu'
    },

    captureTimeout: 60000,
    customLaunchers: sauceBrowsers,

    // Browsers to launch, commented out to prevent karma from starting
    // too many concurrent browsers and timing sauce out.
    browsers: _.keys(sauceBrowsers)
  });
};
