$(document).ready(function() {

  module("Backbone.Router");

  var Router = Backbone.Router.extend({

    routes: {
      "noCallback":                 "noCallback",
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

    search : function(query, page, queryParams) {
      this.query = query;
      this.page = page;
      this.queryParams = queryParams;
    },

    splat : function(args, queryParams) {
      this.args = args;
      this.queryParams = queryParams;
    },

    complex : function(first, part, rest, queryParams) {
      this.first = first;
      this.part = part;
      this.rest = rest;
      this.queryParams = queryParams;
    },

    query : function(entity, args, queryParams) {
      this.entity    = entity;
      this.queryArgs = args;
      this.queryParams = queryParams;
    },

    anything : function(whatever, queryParams) {
      this.anything = whatever;
      this.queryParams = queryParams;
    }

    // do not provide a callback method for the noCallback route

  });

  Backbone.history = null;
  var router = new Router({testing: 101});

  Backbone.history.interval = 9;
  Backbone.history.start({pushState: false});

  test("Router: initialize", function() {
    equals(router.testing, 101);
  });

  asyncTest("Router: routes (simple)", 2, function() {
    window.location.hash = 'search/news';
    setTimeout(function() {
      equals(router.query, 'news');
      equals(router.page, undefined);
      start();
    }, 10);
  });

  asyncTest("Router: routes (two part)", 2, function() {
    window.location.hash = 'search/nyc/p10';
    setTimeout(function() {
      equals(router.query, 'nyc');
      equals(router.page, '10');
      start();
    }, 10);
  });

  asyncTest("Router: routes (two part - encoded reserved char)", 2, function() {
    window.location.hash = 'search/nyc/pa%2Fb';
    setTimeout(function() {
      equals(router.query, 'nyc');
      equals(router.page, 'a/b');
      start();
    }, 10);
  });

  asyncTest("Router: routes (two part - query params)", 3, function() {
    window.location.hash = 'search/nyc/p10?a=b';
    setTimeout(function() {
      equals(router.query, 'nyc');
      equals(router.page, '10');
      equals(router.queryParams.a, 'b');
      start();
    }, 10);
  });

  asyncTest("Router: routes (two part - query params - hash)", 16, function() {
    window.location.hash = 'search/nyc/p10?a=b&b.c=d&b.d=e&b.e.f=g&array1=|a&array2=a|b&array3=|c|d&array4=|e%7C';
    setTimeout(function() {
      equals(router.query, 'nyc');
      equals(router.page, '10');
      equals(router.queryParams.a, 'b');
      equals(router.queryParams.b.c, 'd');
      equals(router.queryParams.b.d, 'e');
      equals(router.queryParams.b.e.f, 'g');
      equals(router.queryParams.array1.length, 1);
      equals(router.queryParams.array1[0], 'a');
      equals(router.queryParams.array2.length, 2);
      equals(router.queryParams.array2[0], 'a');
      equals(router.queryParams.array2[1], 'b');
      equals(router.queryParams.array3.length, 2);
      equals(router.queryParams.array3[0], 'c');
      equals(router.queryParams.array3[1], 'd');
      equals(router.queryParams.array4.length, 1);
      equals(router.queryParams.array4[0], 'e|');
      start();
    }, 10);
  });

  test("Router: routes via navigate", 2, function() {
    Backbone.history.navigate('search/manhattan/p20', {trigger: true});
    equals(router.query, 'manhattan');
    equals(router.page, '20');
  });

  test("Router: routes via navigate for backwards-compatibility", 2, function() {
    Backbone.history.navigate('search/manhattan/p20', true);
    equals(router.query, 'manhattan');
    equals(router.page, '20');
  });

  asyncTest("Router: routes via navigate with {replace: true}", function() {
    var historyLength = window.history.length;
    router.navigate('search/manhattan/start_here');
    router.navigate('search/manhattan/then_here');
    router.navigate('search/manhattan/finally_here', {replace: true});

    equals(window.location.hash, "#search/manhattan/finally_here");
    window.history.go(-1);
    setTimeout(function() {
      equals(window.location.hash, "#search/manhattan/start_here");
      start();
    }, 500);
  });

  asyncTest("Router: routes (splats)", function() {
    window.location.hash = 'splat/long-list/of/splatted_99args/end';
    setTimeout(function() {
      equals(router.args, 'long-list/of/splatted_99args');
      start();
    }, 10);
  });

  asyncTest("Router: routes (splats - query params)", 2, function() {
    window.location.hash = 'splat/long-list/of/splatted_99args/end?c=d';
    setTimeout(function() {
      equals(router.args, 'long-list/of/splatted_99args');
      equals(router.queryParams.c, 'd');
      start();
    }, 10);
  });

  asyncTest("Router: routes (complex)", 3, function() {
    window.location.hash = 'one/two/three/complex-part/four/five/six/seven';
    setTimeout(function() {
      equals(router.first, 'one/two/three');
      equals(router.part, 'part');
      equals(router.rest, 'four/five/six/seven');
      start();
    }, 10);
  });

  asyncTest("Router: routes (complex - query params)", 4, function() {
    window.location.hash = 'one/two/three/complex-part/four/five/six/seven?e=f';
    setTimeout(function() {
      equals(router.first, 'one/two/three');
      equals(router.part, 'part');
      equals(router.rest, 'four/five/six/seven');
      equals(router.queryParams.e, 'f');
      start();
    }, 10);
  });

  asyncTest("Router: routes (query)", 2, function() {
    window.location.hash = 'mandel?a=b&c=d';
    setTimeout(function() {
      equals(router.entity, 'mandel');
      equals(router.queryArgs, 'a=b&c=d');
      start();
    }, 10);
  });

  asyncTest("Router: routes (anything)", 1, function() {
    window.location.hash = 'doesnt-match-a-route';
    setTimeout(function() {
      equals(router.anything, 'doesnt-match-a-route');
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
        equals(callbackFired, true);
        start();
        window.location.hash = '';
      }, 10);
    } catch (err) {
      ok(false, "an exception was thrown trying to fire the router event with no router handler callback");
    }
  });

});
