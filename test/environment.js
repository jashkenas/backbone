define('environment', function(require, exports, mod) {

  mod.exports = exports = function(){};

  _.extend(exports.prototype, {

    ajax: Backbone.sync.ajax,

    sync: Backbone.sync,

    emulateHTTP: Backbone.sync.emulateHTTP,

    emulateJSON: Backbone.sync.emulateJSON,

    setup: function() {
      var env = this;

      // Capture the arguments to Backbone.sync for comparison.
      Backbone.setSync(function(method, model, options) {
        env.syncArgs = {
          method: method,
          model: model,
          options: options
        };

        // Ensure that ajax and emulate settings are correct.
        env.sync.ajax = Backbone.sync.ajax;
        env.sync.emulateHTTP = Backbone.sync.emulateHTTP;
        env.sync.emulateJSON = Backbone.sync.emulateJSON;

        env.sync.apply(this, arguments);
      });

      // Capture ajax settings for comparison.
      Backbone.sync.ajax = function(settings) {
        env.ajaxSettings = settings;
      };
    },

    teardown: function() {
      this.syncArgs = null;
      this.ajaxSettings = null;
      Backbone.setSync(this.sync);
      Backbone.sync.ajax = this.ajax;
      Backbone.sync.emulateHTTP = this.emulateHTTP;
      Backbone.sync.emulateJSON = this.emulateJSON;
    }

  });

});
