(function() {

  module("Backbone.Promise");

  test("throws an error if invoked", 1, function() {
    try {
      Backbone.Promise();
    } catch (e) {
      ok(e);
    }
  });

  asyncTest(".resolve to passed in value", 1, function() {
    var value = {};
    Backbone.Promise.resolve({}).then(function(val) {
      strictEqual(val, value);
      start();
    });
  });

  asyncTest(".resolve adopts promise state", 1, function() {
    var value = {};
    var promise = Backbone.Promise.resolve(val);
    Backbone.Promise.resolve(promise).then(function(val) {
      strictEqual(val, value);
      start();
    });
  });

  asyncTest(".resolve executes then callback asynchronously", 1, function() {
    var async = false;
    Backbone.Promise.resolve().then(function() {
      ok(async);
      start();
    });
    async = true;
  });

  asyncTest(".reject to passed in value", 1, function() {
    var value = {};
    Backbone.Promise.reject({}).then(null, function(val) {
      strictEqual(val, value);
      start();
    });
  });

  asyncTest(".reject executes then callback asynchronously", 1, function() {
    var async = false;
    Backbone.Promise.reject().then(null, function() {
      ok(async);
      start();
    });
    async = true;
  });

});
