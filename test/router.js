$(document).ready(function() {

  var router = null;
  var lastRoute = null;
  var lastArgs = [];

  function onRoute(router, route, args) {
    lastRoute = route;
    lastArgs = args;
  }

  module("Backbone.Router", {

    setup: function() {
      Backbone.history = null;
      router = new Router({testing: 101});
      Backbone.history.interval = 9;
      Backbone.history.start({pushState: false});
      lastRoute = null;
      lastArgs = [];
      Backbone.history.on('route', onRoute);
    },

    teardown: function() {
      Backbone.history.stop();
      Backbone.history.off('route', onRoute);
    }

  });

  var Router = Backbone.Router.extend({

    count: 0,

    routes: {
      "noCallback":                 "noCallback",
      "counter":                    "counter",
      "search/:query":              "search",
      "search/:query/p:page":       "search",
      "contacts":                   "contacts",
      "contacts/new":               "newContact",
      "contacts/:id":               "loadContact",
      "splat/*args/end":            "splat",
      "*first/complex-:part/*rest": "complex",
      ":entity?*args":              "query",
      "*anything":                  "anything"
    },

    initialize : function(options) {
      this.testing = options.testing;
      this.route('implicit', 'implicit');
    },

    counter: function() {
      this.count++;
    },

    implicit: function() {
      this.count++;
    },

    search : function(query, page) {
      this.query = query;
      this.page = page;
    },

    contacts: function(){
      this.contact = 'index';
    },

    newContact: function(){
      this.contact = 'new';
    },

    loadContact: function(){
      this.contact = 'load';
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

    // do not provide a callback method for the noCallback route

  });

  test("Router: initialize", function() {
    equal(router.testing, 101);
  });

  asyncTest("Router: routes (simple)", 4, function() {
    window.location.hash = 'search/news';
    setTimeout(function() {
      equal(router.query, 'news');
      equal(router.page, undefined);
      equal(lastRoute, 'search');
      equal(lastArgs[0], 'news');
      start();
    }, 10);
  });

  asyncTest("Router: routes (two part)", 2, function() {
    window.location.hash = 'search/nyc/p10';
    setTimeout(function() {
      equal(router.query, 'nyc');
      equal(router.page, '10');
      start();
    }, 10);
  });

  test("Router: routes via navigate", 2, function() {
    Backbone.history.navigate('search/manhattan/p20', {trigger: true});
    equal(router.query, 'manhattan');
    equal(router.page, '20');
  });

  test("Router: routes via navigate for backwards-compatibility", 2, function() {
    Backbone.history.navigate('search/manhattan/p20', true);
    equal(router.query, 'manhattan');
    equal(router.page, '20');
  });

  test("Router: route precedence via navigate", 6, function(){
    // check both 0.9.x and backwards-compatibility options
    _.each([ { trigger: true }, true ], function( options ){
      Backbone.history.navigate('contacts', options);
      equal(router.contact, 'index');
      Backbone.history.navigate('contacts/new', options);
      equal(router.contact, 'new');
      Backbone.history.navigate('contacts/foo', options);
      equal(router.contact, 'load');
    });
  });

  test("Router: doesn't fire routes to the same place twice", function() {
    equal(router.count, 0);
    router.navigate('counter', {trigger: true});
    equal(router.count, 1);
    router.navigate('/counter', {trigger: true});
    router.navigate('/counter', {trigger: true});
    equal(router.count, 1);
    router.navigate('search/counter', {trigger: true});
    router.navigate('counter', {trigger: true});
    equal(router.count, 2);
    Backbone.history.stop();
    router.navigate('search/counter', {trigger: true});
    router.navigate('counter', {trigger: true});
    equal(router.count, 2);
    Backbone.history.start();
    equal(router.count, 3);
  });

  test("Router: use implicit callback if none provided", function() {
    router.count = 0;
    router.navigate('implicit', {trigger: true});
    equal(router.count, 1);
  });

  asyncTest("Router: routes via navigate with {replace: true}", function() {
    var historyLength = window.history.length;
    router.navigate('search/manhattan/start_here');
    router.navigate('search/manhattan/then_here');
    router.navigate('search/manhattan/finally_here', {replace: true});

    equal(window.location.hash, "#search/manhattan/finally_here");
    window.history.go(-1);
    setTimeout(function() {
      equal(window.location.hash, "#search/manhattan/start_here");
      start();
    }, 500);
  });

  asyncTest("Router: routes (splats)", function() {
    window.location.hash = 'splat/long-list/of/splatted_99args/end';
    setTimeout(function() {
      equal(router.args, 'long-list/of/splatted_99args');
      start();
    }, 10);
  });

  asyncTest("Router: routes (complex)", 3, function() {
    window.location.hash = 'one/two/three/complex-part/four/five/six/seven';
    setTimeout(function() {
      equal(router.first, 'one/two/three');
      equal(router.part, 'part');
      equal(router.rest, 'four/five/six/seven');
      start();
    }, 10);
  });

  asyncTest("Router: routes (query)", 5, function() {
    window.location.hash = 'mandel?a=b&c=d';
    setTimeout(function() {
      equal(router.entity, 'mandel');
      equal(router.queryArgs, 'a=b&c=d');
      equal(lastRoute, 'query');
      equal(lastArgs[0], 'mandel');
      equal(lastArgs[1], 'a=b&c=d');
      start();
    }, 10);
  });

  asyncTest("Router: routes (anything)", 1, function() {
    window.location.hash = 'doesnt-match-a-route';
    setTimeout(function() {
      equal(router.anything, 'doesnt-match-a-route');
      start();
      window.location.hash = '';
    }, 10);
  });

  asyncTest("Router: fires event when router doesn't have callback on it", 1, function() {
    try{
      var callbackFired = false;
      var myCallback = function(){ callbackFired = true; };
      router.bind("route:noCallback", myCallback);
      window.location.hash = "noCallback";
      setTimeout(function(){
        equal(callbackFired, true);
        start();
        window.location.hash = '';
      }, 10);
    } catch (err) {
      ok(false, "an exception was thrown trying to fire the router event with no router handler callback");
    }
  });

  test("#933, #908 - leading slash", function() {
    var history = new Backbone.History();
    history.options = {root: '/root'};
    equal(history.getFragment('/root/foo'), 'foo');
    history.options.root = '/root/';
    equal(history.getFragment('/root/foo'), 'foo');
  });

  test("#1003 - History is started before navigate is called", function() {
    var history = new Backbone.History();
    history.navigate = function(){ ok(Backbone.History.started); };
    Backbone.history.stop();
    history.start();
  });

  test("Router: route callback gets passed non-decoded values", function() {
    var route = 'has%2Fslash/complex-has%23hash/has%20space';
    Backbone.history.navigate(route, {trigger: true});
    equal(router.first, 'has%2Fslash');
    equal(router.part, 'has%23hash');
    equal(router.rest, 'has%20space');
  });

  asyncTest("Router: correctly handles URLs with % (#868)", 3, function() {
    window.location.hash = 'search/fat%3A1.5%25';
    setTimeout(function() {
      window.location.hash = 'search/fat';
      setTimeout(function() {
          equal(router.query, 'fat');
          equal(router.page, undefined);
          equal(lastRoute, 'search');
          start();
        }, 50);
    }, 50);
  });

});
