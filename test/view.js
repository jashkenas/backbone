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
    equals(view.$('#qunit-header')[0].innerHTML, 'Backbone Test Suite');
    equals(view.$('#qunit-header')[1].innerHTML, 'Backbone Speed Suite');
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

  test("View: handleEvents", function() {
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

  test("view: Backbone.Brace event handling", function() {
    var View = Backbone.View.extend({

      braceRoutes : {
        'change:shape' : 'mutate'
      },

      onChangeFoo : function(obj, newValue) {
        this.fooChanged = true;
      },

      onAdd : function(item) {
        this.itemAdded = true;
      },

      onRemove : function(item) {
        this.itemRemoved = true;
      },

      mutate : function(obj, newValue) {
        this.mutated = true;
      }

    });

    var model = new Backbone.Model;
    var col = new Backbone.Collection();
    var view = new View({
      model : model,
      collection : col
    });

    model.set({'foo' : 'bar'});
    equals(view.fooChanged, true);

    var item = new Backbone.Model;
    col.add(item);

    equals(view.itemAdded, true);

    col.remove(item);
    equals(view.itemRemoved, true);

    model.set({'shape' : 'trapezoid'});
    equals(view.mutated, true);
  });

});
