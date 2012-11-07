$(document).ready(function() {

  var components = ["View", "Model", "Collection", "Router", "History"];

  module("Debugging");

  test("Backbone components have an informative toString()", 5, function() {
    _.each(components, function(component) {
      equal(Backbone[component].toString(), "Backbone." + component);
    });
  });

  test("Subclasses permit name setting", 1, function() {
    var sc = Backbone.Model.extend({
      name: "Person"
    });

    equal(sc.name, "Person");
  });

  test("Subclasses of Backbone components have an informative toString()", 5, function() {
    _.each(components, function(component) {
      equal(Backbone[component].extend({}).toString(), "subclass of Backbone." + component);
    });
  });

  test("Subclasses of anonymous subclasses declare their whole line of inheritance up to the Backbone component", 5, function() {
    _.each(components, function(component) {
      equal(Backbone[component].extend({}).extend({}).toString(), "subclass of subclass of Backbone." + component);
    });
  });

  test("Subclasses of named subclasses declare their parent by name", 5, function() {
    _.each(components, function(component) {
      equal(Backbone[component].extend({name: "Person"}).extend({}).toString(), "subclass of Person");
    });
  });

  test("Instances have a unique id", 5, function() {
    _.each(components, function(component) {
      ok(new Backbone[component]().uid);
    });
  });

  test("Instances of Backbone components have an informative toString()", 5, function() {
    _.each(components, function(component) {
      var instance = new Backbone[component]();

      equal(instance.toString(), "<Backbone." + component + ":" + instance.uid + ">");
    });
  });

  test("Instances of unnamed subclasses have an informative toString()", 5, function() {
    _.each(components, function(component) {
      var Sc = Backbone[component].extend({}),
            instance = new Sc();

      equal(instance.toString(), "<" + Sc.toString() + ":" + instance.uid + ">");
    });
  });

  test("Instances of named subclasses have an informative toString()", 5, function() {
    _.each(components, function(component) {
      var Sc = Backbone[component].extend({name: "Person"}),
            instance = new Sc();

      equal(instance.toString(), "<Person:" + instance.uid + ">");
    });
  });

});