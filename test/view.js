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
    var model = new Backbone.Model;
    var col = new Backbone.Collection();

    var View = Backbone.View.extend({

      modelBraceRoutes : {
        'model:change:shape' : 'mutate'
      },

      collectionBraceRoutes : {
        'col:sort' : 'sortCollection',
      },

      onModelChangeFoo : function(obj, newValue) {
        this.fooChanged = true;
      },

      onCollectionAdd : function(item) {
        this.itemAdded = true;
      },

      onCollectionRemove : function(item) {
        this.itemRemoved = true;
      },

      mutate : function(obj, newValue) {
        this.mutated = true;
      },

      sortCollection : function() {
        this.sorted = true;
      }

    });

    var view = new View({
      model : model,
      collection : col
    });

    model.set({'foo' : 'bar'});
    ok(view.fooChanged, 'model change property event not handled properly');

    var item = new Backbone.Model;
    col.add(item);

    ok(view.itemAdded, 'collection add item event not handled properly');

    col.remove(item);
    ok(view.itemRemoved, 'collection remove item not handled properly');

    model.set({'shape' : 'trapezoid'});
    ok(view.mutated, 'model declared event route not handled properly');

    col.trigger('col:sort');
    ok(view.sorted, 'collection declared event route not handled properly');
  });

});
