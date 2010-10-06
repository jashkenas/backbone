$(document).ready(function() {

  module("Backbone collections");

  test("collections: simple", function() {
    a = new Backbone.Model({label: 'a'});
    b = new Backbone.Model({label: 'b'});
    c = new Backbone.Model({label: 'c'});
    d = new Backbone.Model({label: 'd'});
    col = new Backbone.Collection([a,b,c,d]);
    equals(col.first(), a, "a should be first");
    equals(col.last(), d, "d should be last");
  });

  test("collections: sorted", function() {

  });

});