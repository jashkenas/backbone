$(document).ready(function() {

  module("Backbone collections");

  var a = new Backbone.Model({id: 4, label: 'a'});
  var b = new Backbone.Model({id: 3, label: 'b'});
  var c = new Backbone.Model({id: 2, label: 'c'});
  var d = new Backbone.Model({id: 1, label: 'd'});
  var col = new Backbone.Collection([a,b,c,d]);

  test("collections: simple and sorted", function() {
    equals(col.first(), a, "a should be first");
    equals(col.last(), d, "d should be last");
    col.comparator = function(model) { return model.id; };
    col.sort();
    equals(col.first(), d, "d should be first");
    equals(col.last(), a, "a should be last");
    equals(col.length, 4);
  });

  test("collections: get, getByCid", function() {
    equals(col.get(1), d);
    equals(col.get(3), b);
    equals(col.getByCid(col.first().cid), col.first());
  });

  test("collections: getIds, getCids", function() {
    equals(col.getIds().sort().join(' '), '1 2 3 4');
    equals(col.getCids().sort().join(' '), 'c1 c2 c3 c4');
  });

  test("collections: at", function() {
    equals(col.at(2), b);
  });

  test("collections: add", function() {
    var added = null;
    col.bind('add', function(model){ added = model.get('label'); });
    var e = new Backbone.Model({id: 0, label : 'e'});
    col.add(e);
    equals(added, 'e');
    equals(col.length, 5);
    equals(col.first(), e);
  });

});