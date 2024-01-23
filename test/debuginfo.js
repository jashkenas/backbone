/* eslint-disable no-console */

(function(QUnit) {

  var logs, originalDebug = console.debug;

  function spyDebug() {
    logs.push(arguments);
    originalDebug.apply(console, arguments);
  }

  QUnit.module('Backbone.debugInfo', {

    beforeEach: function() {
      logs = [];
      console.debug = spyDebug;
    },

    afterEach: function() {
      console.debug = originalDebug;
      logs = undefined;
    }
  });

  QUnit.test('debugInfo', function(assert) {
    var info = Backbone.debugInfo();
    assert.strictEqual(info.backbone, Backbone.VERSION, 'includes Backbone version');
    assert.strictEqual(info.distribution, 'MARK_DEVELOPMENT', 'distribution mark sticks to development');
    assert.strictEqual(info._, _.VERSION, 'includes Underscore version');
    assert.strictEqual(info.$, $.fn.jquery, 'includes jQuery version');
    if (typeof navigator !== 'undefined') {
      assert.ok(typeof info.navigator === 'object');
      assert.strictEqual(info.navigator.userAgent, navigator.userAgent, 'includes user agent');
      assert.strictEqual(info.navigator.platform, navigator.platform, 'includes navigator platform');
      assert.strictEqual(info.navigator.webdriver, navigator.webdriver, 'includes webdriver state');
    }
    assert.strictEqual(logs.length, 1, 'prints to console as side effect');
    var debugArgs = logs[0];
    var infoString = JSON.stringify(info, null, 4);
    assert.strictEqual(debugArgs[1], infoString, 'prints payload as second argument');
  });

})(QUnit);
