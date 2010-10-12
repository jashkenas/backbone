$(document).ready(function() {

  module("Backbone collections");

  window.lastRequest = null;

  Backbone.sync = function() {
    lastRequest = _.toArray(arguments);
  };

  var a = new Backbone.Model({id: 4, label: 'a'});
  var b = new Backbone.Model({id: 3, label: 'b'});
  var c = new Backbone.Model({id: 2, label: 'c'});
  var d = new Backbone.Model({id: 1, label: 'd'});
  var e = null;
  var col = window.col = new Backbone.Collection([a,b,c,d]);

  test("collections: new and sort", function() {
    equals(col.first(), a, "a should be first");
    equals(col.last(), d, "d should be last");
    col.comparator = function(model) { return model.id; };
    col.sort();
    equals(col.first(), d, "d should be first");
    equals(col.last(), a, "a should be last");
    equals(col.length, 4);
  });

  test("collections: toString", function() {
    equals(col.toString(), 'Collection (4 models)');
  });

  test("collections: get, getByCid", function() {
    equals(col.get(1), d);
    equals(col.get(3), b);
    equals(col.getByCid(col.first().cid), col.first());
  });

  test("collections: at", function() {
    equals(col.at(2), b);
  });

  test("collections: pluck", function() {
    equals(col.pluck('label').join(' '), 'd c b a');
  });

  test("collections: add", function() {
    var added = null;
    col.bind('add', function(model){ added = model.get('label'); });
    e = new Backbone.Model({id: 0, label : 'e'});
    col.add(e);
    equals(added, 'e');
    equals(col.length, 5);
    equals(col.first(), e);
  });

  test("collections: remove", function() {
    var removed = null;
    col.bind('remove', function(model){ removed = model.get('label'); });
    col.remove(e);
    equals(removed, 'e');
    equals(col.length, 4);
    equals(col.first(), d);
  });

  test("collections: refresh", function() {
    var refreshed = 0;
    var models = col.models;
    col.bind('refresh', function() { refreshed += 1; });
    col.refresh([]);
    equals(refreshed, 1);
    equals(col.length, 0);
    equals(col.last(), null);
    col.refresh(models);
    equals(refreshed, 2);
    equals(col.length, 4);
    equals(col.last(), a);
  });

  test("collections: fetch", function() {
    col.fetch();
    equals(lastRequest[0], 'GET');
    equals(lastRequest[1], col);
  });

  test("collections: create", function() {
    var model = col.create({label: 'f'});
    equals(lastRequest[0], 'POST');
    equals(lastRequest[1], model);
    equals(model.get('label'), 'f');
    equals(model.collection, col);
  });

  test("collections: Underscore methods", function() {
    equals(col.map(function(model){ return model.get('label'); }).join(' '), 'd c b a');
    equals(col.any(function(model){ return model.id === 100; }), false);
    equals(col.any(function(model){ return model.id === 1; }), true);
    equals(col.indexOf(b), 2);
    equals(col.size(), 4);
    equals(col.rest().length, 3);
    ok(!_.include(col.rest()), a);
    ok(!_.include(col.rest()), d);
    ok(!col.isEmpty());
    ok(!_.include(col.without(d)), d);
    equals(col.max(function(model){ return model.id; }).id, 4);
    equals(col.min(function(model){ return model.id; }).id, 1);
  });

});
