const _ = require('underscore');

// Browsers to run on Sauce Labs platforms
const sauceBrowsers = _.reduce([
  // Match last 4 ESR version numbers
  ['firefox', '52'],
  ['firefox', '45'],
  ['firefox', '38'],
  ['firefox', '24'],

  // Match significant Chrome versions
  ['chrome', '66'],
  ['chrome', '51'],
  ['chrome', '49'],
  ['chrome', '26'],

  // Edge
  ['microsoftedge', '42.17134', 'Windows 10'],
  ['microsoftedge', '41.16299', 'Windows 10'],
  ['microsoftedge', '40.15063', 'Windows 10'],
  ['microsoftedge', '38.14393', 'Windows 10'],
  ['microsoftedge', '20.10240', 'Windows 10'],

  // IE
  ['internet explorer', '11', 'Windows 10'],
  ['internet explorer', '11', 'Windows 8'],
  ['internet explorer', '11', 'Windows 7'],

  // Opera
  ['opera', '52'],
  ['opera', '36'],
  ['opera', '12'],

  // Android
  ['android', '8'],
  ['android', '7'],
  ['android', '6'],
  ['android', '5'],
  ['android', '4.4'],

  // Latest Safari + last one for old OSX
  ['safari', '11.1'],
  ['safari', '5']
], (memo, platform) => {
  // internet explorer -> ie
  let label = platform[0].split(' ');
  if (label.length > 1) {
    label = _.invoke(label, 'charAt', 0)
  }
  label = (label.join("") + '_v' + platform[1]).replace(' ', '_').toUpperCase();
  memo[label] = _.pick({
    'base': 'SauceLabs',
    'browserName': platform[0],
    'version': platform[1],
    'platform': platform[2]
  }, Boolean);
  return memo;
}, {});

module.exports = (config) => {
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

    // Number of sauce tests to start in parallel
    concurrency: 9,

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
    customLaunchers: sauceBrowsers,

    // Browsers to launch, commented out to prevent karma from starting
    // too many concurrent browsers and timing sauce out.
    browsers: _.keys(sauceBrowsers)
  });
};
