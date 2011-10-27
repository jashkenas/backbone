$(document).ready(function() {

  module("Backbone.Namespace");

  test("Namespace: it should namespace data into backbone", function() {
    Backbone.namespace('current_user', {foo: 'bar'});
    equals(Backbone.namespace('current_user').foo, 'bar');
  });

});
