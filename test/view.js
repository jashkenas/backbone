$(document).ready(function() {

  module("Backbone View");

  var view = new Backbone.View({
    id        : 'test-view',
    className : 'test-view'
  });

  test("view: constructor", function() {
    equals(view.el.id, 'test-view');
    equals(view.el.className, 'test-view');
    equals(view.options.id, 'test-view');
    equals(view.options.className, 'test-view');
  });

  test("view: jQuery", function() {
    view.el = document.body;
    equals(view.$('#qunit-header').text(), 'Backbone Test Suite');
  });

  test("view: make", function() {
    var div = view.make('div', {id: 'test-div'}, "one two three");
    equals(div.tagName.toLowerCase(), 'div');
    equals(div.id, 'test-div');
    equals($(div).text(), 'one two three');
  });

  test("view: initialize", function() {
    var View = Backbone.View.extend({
      initialize: function() {
        this.one = 1;
      }
    });
    var view = new View;
    equals(view.one, 1);
  });

  test("view: handleEvents", function() {
    var counter = 0;
    view.el = document.body;
    view.increment = function() {
      return ++counter;
    };
    var events = {"click #qunit-banner": "increment"};
    view.handleEvents(events);
    $('#qunit-banner').trigger('click');
    equals(counter, 1);
    $('#qunit-banner').trigger('click');
    equals(counter, 2);
    view.handleEvents(events);
    $('#qunit-banner').trigger('click');
    equals(counter, 3);
  });

});