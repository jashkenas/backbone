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
      var args = arguments;

      // Let the route execute before we verify
      setTimeout(function() {
        callback.apply(undefined, args);
        Backbone.history.unbind('route', handler);
      }, 0);
    };
    Backbone.history.bind('route', handler);
  }

  Backbone.history = null;
  var router = new Router({testing: 101});

  Backbone.history.interval = 9;
  Backbone.history.start({pushState: false, trackDirection: true});

  test("Router: initialize", function() {
    equals(router.testing, 101);
  });

  asyncTest("Router: routes (simple)", 4, function() {
    routeBind(function(fragment, delta) {
      equals(fragment, 'search/news');
      equals(delta, 1);
      equals(router.query, 'news');
      equals(router.page, undefined);
      start();
    });

    window.location.hash = 'search/news';
  });

  asyncTest("Router: routes (two part)", 4, function() {
    routeBind(function(fragment, delta) {
      equals(fragment, 'search/nyc/p10');
      equals(delta, 1);
      equals(router.query, 'nyc');
      equals(router.page, '10');
      start();
    });

    Backbone.history.navigate('search/nyc/p10', true);
  });

  asyncTest("Router: routes via navigate", 6, function() {
    var originalHistory = window.history.length,
        startingIndex = Backbone.history.getIndex();
    routeBind(function(fragment, delta) {
      equals(fragment, 'search/manhattan/p20');
      equals(delta, 1);
      equals(Backbone.history.getIndex(), startingIndex+1);
      equals(router.query, 'manhattan');
      equals(router.page, '20');

      // Warn: This is only valid up to the history limit of the browser (50 in chrome)
      equals(window.history.length, originalHistory+1);
      start();
    });

    Backbone.history.navigate('search/manhattan/p20', true);
  });

  asyncTest("Router: routes via navigate replace", 6, function() {
    var originalHistory = window.history.length,
        startingIndex = Backbone.history.getIndex();
    routeBind(function(fragment, delta) {
      equals(fragment, 'search/manhattan/p30');
      equals(delta, 0);
      equals(Backbone.history.getIndex(), startingIndex);
      equals(router.query, 'manhattan');
      equals(router.page, '30');
      equals(window.history.length, originalHistory);
      start();
    });

    Backbone.history.navigate('search/manhattan/p30', true, true);
  });

  asyncTest("Router: routes (splats)", 3, function() {
    routeBind(function(fragment, delta) {
      equals(fragment, 'splat/long-list/of/splatted_99args/end');
      equals(delta, 1);
      equals(router.args, 'long-list/of/splatted_99args');
      start();
    });

    Backbone.history.navigate('splat/long-list/of/splatted_99args/end', true);
  });

  asyncTest("Router: routes (complex)", 5, function() {
    routeBind(function(fragment, delta) {
      equals(fragment, 'one/two/three/complex-part/four/five/six/seven');
      equals(delta, 1);
      equals(router.first, 'one/two/three');
      equals(router.part, 'part');
      equals(router.rest, 'four/five/six/seven');
      start();
    });

    Backbone.history.navigate('one/two/three/complex-part/four/five/six/seven', true);
  });

  asyncTest("Router: routes (query)", 4, function() {
    routeBind(function(fragment, delta) {
      equals(fragment, 'mandel?a=b&c=d');
      equals(delta, 1);
      equals(router.entity, 'mandel');
      equals(router.queryArgs, 'a=b&c=d');
      start();
    });

    Backbone.history.navigate('mandel?a=b&c=d', true);
  });

  asyncTest("Router: routes (anything)", 3, function() {
    routeBind(function(fragment, delta) {
      equals(fragment, 'doesnt-match-a-route');
      equals(delta, 1);
      equals(router.anything, 'doesnt-match-a-route');
      start();
    });

    Backbone.history.navigate('doesnt-match-a-route', true);
  });

  asyncTest("Router: index delta", 20, function() {
    console.log('index delta');
    var startingIndex = Backbone.history.getIndex();

    function step1(fragment, delta) {
      equals(fragment, 'search/manhattan/p20');
      equals(delta, 1);
      equals(Backbone.history.getIndex(), startingIndex+1);
      equals(router.query, 'manhattan');
      equals(router.page, '20');

      routeBind(step2);

      setTimeout(function() {
        Backbone.history.navigate('search/manhattan/p30', true, true);
      }, 0);
    }
    function step2(fragment, delta) {
      equals(fragment, 'search/manhattan/p30');
      equals(delta, 0);
      equals(Backbone.history.getIndex(), startingIndex+1);
      equals(router.query, 'manhattan');
      equals(router.page, '30');

      routeBind(step3);

      setTimeout(function() {
        Backbone.history.navigate('search/manhattan/p40', true);
      }, 0);
    }
    function step3(fragment, delta) {
      equals(fragment, 'search/manhattan/p40');
      equals(delta, 1);
      equals(Backbone.history.getIndex(), startingIndex+2);
      equals(router.query, 'manhattan');
      equals(router.page, '40');

      routeBind(step4);

      setTimeout(function() {
        window.history.back();
      }, 0);
    }
    function step4(fragment, delta) {
      console.log(Backbone.history._state);
      equals(fragment, 'search/manhattan/p30');
      equals(delta, -1);
      equals(Backbone.history.getIndex(), startingIndex+1);
      equals(router.query, 'manhattan');
      equals(router.page, '30');


      setTimeout(function() {
        window.location.hash = '';
        start();
      }, 0);
    }

    routeBind(step1);
    setTimeout(function() {
      Backbone.history.navigate('search/manhattan/p20', true);
    }, 0);
  });

});
