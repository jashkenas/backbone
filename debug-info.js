(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('backbone')) :
  typeof define === 'function' && define.amd ? define(['backbone'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, (global.Backbone = global.Backbone || {}, global.Backbone.debugInfo = factory(global.Backbone)));
})(this, (function (Backbone) {
  // Provide useful information when things go wrong.
  function debugInfo() {
    // Introspect Backbone.
    var $ = Backbone.$, _b = Backbone._debug(), _ = _b._, root = _b.root;
    // Use the `partialRight` function as a Lodash indicator. It was never in
    // Underscore, has been in Lodash at least since version 1.3.1, and is
    // unlikely to be mixed into Underscore since nobody needs it.
    var lodash = !!_.partialRight;
    var info = {
      backbone: Backbone.VERSION,
      // Is this the exact released version, or a later development version?
      /* This is automatically temporarily replaced when publishing a release,
         so please don't edit this. */
      distribution: 'MARK_DEVELOPMENT',
      _: (lodash ? 'lodash ' : '') + _.VERSION,
      $: !$ ? false : $.fn && $.fn.jquery ? $.fn.jquery :
        $.zepto ? 'zepto' : $.ender ? 'ender' : true
    };
    if (typeof root.Deno !== 'undefined') {
      info.deno = _.pick(root.Deno, 'version', 'build');
    } else if (typeof root.process !== 'undefined') {
      info.process = _.pick(root.process, 'version', 'platform', 'arch');
    } else if (typeof root.navigator !== 'undefined') {
      info.navigator = _.pick(root.navigator, 'userAgent', 'platform', 'webdriver');
    }
    /* eslint-disable-next-line no-console */
    console.debug('Backbone debug info: ', JSON.stringify(info, null, 4));
    return info;
  }

  return debugInfo;

}));
