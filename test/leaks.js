$(document).ready(function() {

  module("leaks:jQuery");

  var onRemoveCallbacksCounter;
  var fixture = $('#qunit-fixtures');

  var reset = QUnit.reset;

  QUnit.reset = function() {
    onRemoveCallbacksCounter = 0;
    $.cleanData([fixture]);
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
  test("Leak: Subview created in initialize never attached to the DOM tree with delegated events using addSubview and detached flag should not leak", function() {
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

  // to fix we can use newly added "detached" flag which will mark a view as a suspect to being detached
  // and then add the view using the new addSubview method
  test("Leak: Subview detached to the DOM tree using new detach method will not leak", function() {
    var startCacheSize = _.size($.cache);
    var view = new (Backbone.View.extend({
      initialize: function() {
        this.subview = this.addSubview(new SubviewClass({ detached: true }));
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
});
