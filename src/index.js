//     Backbone.js 0.9.2

//     (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

// Save a reference to the global object (`window` in the browser, `global`
// on the server).
var root = this;

// Save the previous value of the `Backbone` variable, so that it can be
// restored later on, if `noConflict` is used.
var previousBackbone = root.Backbone;

var Collection = require('./collection'),
    Model = require('./model'),
    Router = require('./router');

// The top-level namespace. All public Backbone classes and modules will
// be attached to this. Exported for both CommonJS and the browser.
module.exports = exports = {
  Events: require('./events'),
  Model: Model,
  Collection: Collection,
  Router: Router,
  View: require('./view'),
  history: require('./history'),
  sync: require('./sync'),

  setHistory: function(history) {
    exports.history = Router.prototype.history = history;
  },

  setSync: function(sync) {
    exports.sync = Collection.prototype.sync = Model.prototype.sync = sync;
  },

  // Current version of the library. Keep in sync with `package.json`.
  VERSION: '0.9.2',

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  noConflict: function() {
    root.Backbone = previousBackbone;
    return this;
  }
};

if (typeof window !== 'undefined') root.Backbone = exports;
