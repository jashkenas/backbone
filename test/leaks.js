$(document).ready(function() {

  module("leaks:Views");

  var onRemoveCallbacksCounter;
  var fixture = $('#qunit-fixtures');

  var reset = QUnit.reset;

  QUnit.reset = function() {
    onRemoveCallbacksCounter = 0;
    reset();
  }

  var SubviewClass = Backbone.View.extend({
    className : 'test-subview',
    events: {
      'click': 'noop'
    },
    onRemove: function() {
      onRemoveCallbacksCounter++;
    },
    noop: function() {}
  });

  // these tests will show leaks which can be caused by jquery cache not being 
  // cleared properly and thus forever keeping the views and all other objects 
  // they reference in the memory

  // Here we create a subview in the initializer - it would have been inserted into the DOM tree
  // as a result of an evnet, user action etc.
  test("Leak: Subview created in initialize never attached to the DOM tree with delegated events will leak", function() {
    var startCacheSize = _.size($.cache);
    var view = new (Backbone.View.extend({
      initialize: function() {
        this.subview = new SubviewClass;
      }
    }));
    fixture.html(view.render().el);
    view.remove();
    ok(startCacheSize < _.size($.cache), "$.cache size should increase and prove a leak");
  });

  // to fix we can use newly added "detached" flag which will mark a view as a suspect to being detached
  // and then add the view using the new addSubview method
  test("Leak fix: Subview created in initialize never attached to the DOM tree with delegated events using addSubview and detached flag should not leak", function() {
    var startCacheSize = _.size($.cache);
    var view = new (Backbone.View.extend({
      initialize: function() {
        this.subview = this.addSubview(new SubviewClass({ detached: true }));
      }
    }));
    fixture.html(view.render().el);
    view.remove();
    equal(_.size($.cache), startCacheSize, "$.cache size should not increase");
  });

    test("Leak: Subview detached from the DOM tree with jquery detach method will leak", function() {
    var startCacheSize = _.size($.cache);
    var view = new (Backbone.View.extend({
      initialize: function() {
        this.subview = new SubviewClass;
      },
      render: function() {
        this.$el.append(this.subview.render().el);
        return this;
      }
    }));
    fixture.html(view.render().el);
    view.subview.$el.detach();
    view.remove();
    ok(startCacheSize < _.size($.cache), "$.cache size should increase and prove a leak");
  });

  // to fix we can use newly added detach method which will flag the view as detached
  // and then add the view using the new addSubview method
  test("Leak fix: Subview detached to the DOM tree using new detach method will not leak", function() {
    var startCacheSize = _.size($.cache);
    var view = new (Backbone.View.extend({
      initialize: function() {
        this.subview = this.addSubview(new SubviewClass);
      },
      render: function() {
        this.$el.append(this.subview.render().el);
        return this;
      }
    }));
    fixture.html(view.render().el);
    view.subview.detach();
    view.remove();
    equal(_.size($.cache), startCacheSize, "$.cache size should not increase");
  });

  module('leaks:References to persistent resources');

  test("Leak: Subview with persistent collection or model without cleaning it's event bindings will leak", function() {
    var persistentCollection = new Backbone.Collection;
    var eventsBound = persistentCollection._callbacks && persistentCollection._callbacks['change'] || 0; 
    var viewClass = Backbone.View.extend({
      collection: persistentCollection,
      initialize: function() {
        this.collection.on('change', this.noop);
      },
      noop: function() {}
    });

    equal(persistentCollection._callbacks, undefined, "initially collection's _callbacks object shoudl be undefined");

    new viewClass().remove();
    new viewClass().remove();
    new viewClass().remove();
    new viewClass().remove();

    ok(persistentCollection._callbacks['change'].next, "callback's collection of change event should have the events still bound thus keeping views in memory and leaking");
  });

  test("Leak fix: Subview with persistent collection or model cleaned using added onRemove method will not leak", function() {
    var persistentCollection = new Backbone.Collection;
    var eventsBound = persistentCollection._callbacks && persistentCollection._callbacks['change'] || 0; 
    var viewClass = Backbone.View.extend({
      collection: persistentCollection,
      initialize: function() {
        this.detached = true;
        this.collection.on('change', this.noop, this);
      },
      noop: function() {},
      onRemove: function() {
        this.collection.off('change', this.noop, this);
      }
    });

    equal(persistentCollection._callbacks, undefined, "initially collection's _callbacks object shoudl be undefined");

    new viewClass().remove();
    new viewClass().remove();
    new viewClass().remove();
    new viewClass().remove();

    equal(persistentCollection._callbacks['change'], undefined, "callback's collection of change events should be cleaned and not leak");
  });
});
