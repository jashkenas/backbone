$(document).ready(function() {

  module("Backbone.Router");

  var Router = Backbone.Router.extend({

    routes: {
      "search/:query":              "search",
      "search/:query/p:page":       "search",
      "splat/*args/end":            "splat",
      "*first/complex-:part/*rest": "complex",
      ":entity?*args":              "query",
      "*anything":                  "anything"
    },

    initialize : function(options) {
      this.testing = options.testing;
    },

    search : function(query, page) {
      this.query = query;
      this.page = page;
    },

    splat : function(args) {
      this.args = args;
    },

    complex : function(first, part, rest) {
      this.first = first;
      this.part = part;
      this.rest = rest;
    },

    query : function(entity, args) {
      this.entity    = entity;
      this.queryArgs = args;
    },

    anything : function(whatever) {
      this.anything = whatever;
    }

  });

  function routeBind(callback) {
    var handler = function() {
      callback.apply(undefined, arguments);
      Backbone.history.unbind('route', handler);
    };
    Backbone.history.bind('route', handler);
  }

  Backbone.history = null;
  var router = new Router({testing: 101});

  Backbone.history.interval = 9;
  Backbone.history.start({pushState: false});

  test("Router: initialize", function() {
    equals(router.testing, 101);
  });

  asyncTest("Router: routes (simple)", 3, function() {
    window.location.hash = 'search/news';
    routeBind(function(fragment) {
      equals(fragment, 'search/news');
      equals(router.query, 'news');
      equals(router.page, undefined);
      start();
    });
  });

  asyncTest("Router: routes (two part)", 3, function() {
    window.location.hash = 'search/nyc/p10';
    routeBind(function(fragment) {
      equals(fragment, 'search/nyc/p10');
      equals(router.query, 'nyc');
      equals(router.page, '10');
      start();
    });
  });

  asyncTest("Router: routes via navigate", 4, function() {
    var originalHistory = window.history.length;
    routeBind(function(fragment) {
      equals(fragment, 'search/manhattan/p20');
      equals(router.query, 'manhattan');
      equals(router.page, '20');

      // Warn: This is only valid up to the history limit of the browser (50 in chrome)
      equals(window.history.length, originalHistory+1);
      start();
    });

    Backbone.history.navigate('search/manhattan/p20', true);
  });

  asyncTest("Router: routes via navigate replace", 4, function() {
    var originalHistory = window.history.length;
    routeBind(function(fragment) {
      equals(fragment, 'search/manhattan/p30');
      equals(router.query, 'manhattan');
      equals(router.page, '30');
      equals(window.history.length, originalHistory);
      start();
    });

    Backbone.history.navigate('search/manhattan/p30', true, true);
  });

  asyncTest("Router: routes (splats)", 2, function() {
    window.location.hash = 'splat/long-list/of/splatted_99args/end';
    routeBind(function(fragment) {
      equals(fragment, 'splat/long-list/of/splatted_99args/end');
      equals(router.args, 'long-list/of/splatted_99args');
      start();
    });
  });

  asyncTest("Router: routes (complex)", 4, function() {
    window.location.hash = 'one/two/three/complex-part/four/five/six/seven';
    routeBind(function(fragment) {
      equals(fragment, 'one/two/three/complex-part/four/five/six/seven');
      equals(router.first, 'one/two/three');
      equals(router.part, 'part');
      equals(router.rest, 'four/five/six/seven');
      start();
    });
  });

  asyncTest("Router: routes (query)", 3, function() {
    window.location.hash = 'mandel?a=b&c=d';
    routeBind(function(fragment) {
      equals(fragment, 'mandel?a=b&c=d');
      equals(router.entity, 'mandel');
      equals(router.queryArgs, 'a=b&c=d');
      start();
    });
  });

  asyncTest("Router: routes (anything)", 1, function() {
    window.location.hash = 'doesnt-match-a-route';
    routeBind(function() {
      equals(router.anything, 'doesnt-match-a-route');
      start();
      window.location.hash = '';
    });
  });

});
