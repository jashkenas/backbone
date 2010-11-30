$(document).ready(function() {

  module("Backbone.View");

  var view = new Backbone.View({
    id        : 'test-view',
    className : 'test-view'
  });

  test("View: constructor", function() {
    equals(view.el.id, 'test-view');
    equals(view.el.className, 'test-view');
    equals(view.options.id, 'test-view');
    equals(view.options.className, 'test-view');
  });

  test("View: jQuery", function() {
    view.el = document.body;
    equals(view.$('#qunit-header').get(0).innerHTML, 'Backbone Test Suite');
    equals(view.$('#qunit-header').get(1).innerHTML, 'Backbone Speed Suite');
  });

  test("View: make", function() {
    var div = view.make('div', {id: 'test-div'}, "one two three");
    equals(div.tagName.toLowerCase(), 'div');
    equals(div.id, 'test-div');
    equals($(div).text(), 'one two three');
  });

  test("View: initialize", function() {
    var View = Backbone.View.extend({
      initialize: function() {
        this.one = 1;
      }
    });
    var view = new View;
    equals(view.one, 1);
  });

  test("View: delegateEvents", function() {
    var counter = 0;
    view.el = document.body;
    view.increment = function() {
      return ++counter;
    };
    var events = {"click #qunit-banner": "increment"};
    view.delegateEvents(events);
    $('#qunit-banner').trigger('click');
    equals(counter, 1);
    $('#qunit-banner').trigger('click');
    equals(counter, 2);
    view.delegateEvents(events);
    $('#qunit-banner').trigger('click');
    equals(counter, 3);
  });

  test("View: _ensureElement", function() {
    var ViewClass = Backbone.View.extend({
      el: document.body
    });
    var view = new ViewClass;
    equals(view.el, document.body);
  });

});
