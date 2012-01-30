$(document).ready(function() {

  module("Backbone.View.subviews");

  var onRemoveCallbacksCounter;
  var fixture = $('#qunit-fixtures');

  var reset = QUnit.reset;

  QUnit.reset = function() {
    onRemoveCallbacksCounter = 0;
    reset();
  }

  var SubviewClass = Backbone.View.extend({
    className : 'test-subview',
    onRemove: function() {
      onRemoveCallbacksCounter++;
    }
  });

  test("View: Add one subview", function() {
    var view = new (Backbone.View.extend({
      className : 'test-view',
      initialize: function() {
        this.subview = this.addSubview(new SubviewClass);
      },
      render: function() {
        this.$el.append(this.subview.render().el);
        return this;
      } 
    }));
    fixture.html(view.render().el);
    equal(view._subviews.length, 1, "View should have one subview");
    equal(view._subviews[0]._parent, view, "Subview should have view as a _parent");
    equal(_.size(view._namedSubviews), 0, "View named subviews map should be empty");
    equal(fixture.find('.test-view').length, 1, "One View should be added to DOM");
    equal(fixture.find('.test-subview').length, 1, "Subview should be added to DOM");
  });

  test("View: Add multiple views", function() {
    var view = new (Backbone.View.extend({
      className: 'test-view',
      render: function() {
        this.$el.append(this.addSubview(new SubviewClass).render().el);
        this.$el.append(this.addSubview(new SubviewClass).render().el);
        this.$el.append(this.addSubview(new SubviewClass).render().el);
        this.$el.append(this.addSubview(new SubviewClass).render().el);
        return this;
      }
    }));
    fixture.html(view.render().el);
    equal(view._subviews.length, 4, "View should have four subviews");
    equal(view._subviews[0]._parent, view, "Subview should have view as a _parent");
    equal(_.size(view._namedSubviews), 0, "View named subviews map should be empty");
    equal(fixture.find('.test-view').length, 1, "One View should be added to DOM");
    equal(view.$('.test-subview').length, 4, "Four Subviews should be present in the DOM as a child to the view");
  });

  test("View: Add one named subview", function() {
    var view = new (Backbone.View.extend({
      className : 'test-view',
      initialize: function() {
        this.subview = this.addSubview(new SubviewClass, 'test');
      },
      render: function() {
        this.$el.html('view');
        this.$el.append(this.subview.render().el);
        return this;
      } 
    }));
    fixture.html(view.render().el);
    equal(view._subviews.length, 1, "View should have one subview");
    equal(view._subviews[0]._parent, view, "Subview should have view as a _parent");
    equal(view._subviews[0]._name, 'test', "Subview should have 'test' as a _name");
    equal(_.size(view._namedSubviews), 1, "View named subviews map should contain one subview");
    equal(fixture.find('.test-view').length, 1, "One View should be added to DOM");
    equal(view.$('.test-subview').length, 1, "One Subview should be added to DOM as a child to the view");
  });

  test("View: Add multiple named views using different names", function() {
    var view = new (Backbone.View.extend({
      className : 'test-view',
      render: function() {
        this.$el.html('view');
        this.$el.append(this.addSubview(new SubviewClass, 'test1').render().el);
        this.$el.append(this.addSubview(new SubviewClass, 'test2').render().el);
        this.$el.append(this.addSubview(new SubviewClass, 'test3').render().el);
        this.$el.append(this.addSubview(new SubviewClass, 'test4').render().el);
        return this;
      } 
    }));
    fixture.html(view.render().el);
    equal(view._subviews.length, 4, "View should have four subviews");
    equal(_.size(view._namedSubviews), 4, "View named subviews map should contain four subviews");
    equal(fixture.find('.test-view').length, 1, "One View should be added to DOM");
    equal(view.$('.test-subview').length, 4, "Four Subviews should be present in the DOM as a child to the view");
  });

  test("View: Add named view four times using same name", function() {
    var view = new (Backbone.View.extend({
      className : 'test-view',
      render: function() {
        this.$el.html('view');
        this.$el.append(this.addSubview(new SubviewClass, 'test').render().el);
        this.$el.append(this.addSubview(new SubviewClass, 'test').render().el);
        this.$el.append(this.addSubview(new SubviewClass, 'test').render().el);
        this.$el.append(this.addSubview(new SubviewClass, 'test').render().el);
        return this;
      } 
    }));
    fixture.html(view.render().el);
    equal(view._subviews.length, 1, "View should have one subview");
    equal(_.size(view._namedSubviews), 1, "View named subviews map should contain one subview");
    equal(fixture.find('.test-view').length, 1, "One View should be added to DOM");
    equal(onRemoveCallbacksCounter, 3, "onRemove callback should have been called three times");
    equal(view.$('.test-subview').length, 1, "One Subview should be present in the DOM as a child to the view");
  });

  test("View: retrieving a named subview with getSubview", function() {
    var view = new (Backbone.View.extend({
      render: function() {
        this.$el.append(this.addSubview(new SubviewClass, 'test').render().el);
        return this;
      } 
    }));
    view.render();
    equal(view.getSubview('test'), view._subviews[0], 
    "Subview retrieved with getSubviews for name 'test' should be equal to the only available subview");
    equal(view.getSubview('test'), view._namedSubviews['test'], 
    "Subview retrieved with getSubviews for name 'test' should be equal to the subview retrieved from identity map for name 'test'");
  });

  test("View: Removing a view", function() {
    var view = new (Backbone.View.extend({
      onRemove: function() {
        onRemoveCallbacksCounter++;
      }
    }));
    fixture.html(view.render().el);
    equal(fixture.find('*').length, 1, "Fixture should have one child element");
    view.remove();
    equal(fixture.find('*').length, 0, "Fixture should not have any child elements");
    equal(onRemoveCallbacksCounter, 1, "onRemove callback should have been called once");
  });

  test("View: Removing a view with two levels deep view hierarchy", function() {
    var SubviewWithSubviewClass = Backbone.View.extend({
      render: function() {
        this.$el.append(this.addSubview(new SubviewClass).render().el);
        return this;
      },
      onRemove: function() {
        onRemoveCallbacksCounter++;
      }
    });
    var view = new (Backbone.View.extend({
      className : 'test-view',
      render: function() {
        this.$el.append(this.addSubview(new SubviewWithSubviewClass).render().el);
        return this;
      },
      onRemove: function() {
        onRemoveCallbacksCounter++;
      }
    }));
    fixture.html(view.render().el);
    equal(fixture.find('*').length, 3, "Fixture should have three child elements");
    equal(view._subviews.length, 1, "View should have one subview");
    equal(view._subviews[0]._subviews.length, 1, "View's subview should have one subview");
    equal(view._subviews[0]._subviews[0]._subviews.length, 0, "Subview's subview should not have any subviews");
    view.remove();
    equal(fixture.find('*').length, 0, "Fixture should not have any child elements");
    equal(view._subviews, null, "View subviews collection should be nullified");
    equal(onRemoveCallbacksCounter, 3, "onRemove callback should have been called three times");
  });

  test("View: Removing all the view's subviews with removeSubviews", function() {
    var view = new (Backbone.View.extend({
      render: function() {
        this.$el.append(this.addSubview(new SubviewClass).render().el);
        this.$el.append(this.addSubview(new SubviewClass).render().el);
        this.$el.append(this.addSubview(new SubviewClass).render().el);
        this.$el.append(this.addSubview(new SubviewClass).render().el);
        return this;
      },
      onRemove: function() {
        onRemoveCallbacksCounter++;
      }
    }));
    fixture.html(view.render().el);
    equal(fixture.find('*').length, 5, "Fixture should have five child elements");
    equal(view._subviews.length, 4, "View should have four subviews");
    view.removeSubviews();
    equal(fixture.find('*').length, 1, "Fixture should have one child element");
    equal(view._subviews.length, 0, "View should not have any subviews");
    equal(onRemoveCallbacksCounter, 4, "onRemove callback should have been called four times");
  });

  test("View: Detaching subview", function() {
    var view = new (Backbone.View.extend({
      render: function() {
        this.$el.append(this.addSubview(new SubviewClass, 'test').render().el);
        return this;
      }
    }));
    fixture.html(view.render().el);
    equal(fixture.find('*').length, 2, "Fixture should have two child elements");
    equal(view._subviews.length, 1, "View should have one subview");
    view.getSubview('test').detach();
    equal(fixture.find('*').length, 1, "Fixture should have one child element");
    equal(view._subviews.length, 1, "View should not have one subview");
    equal(onRemoveCallbacksCounter, 0, "onRemove callback should not have been called");
  });

  test("View: Removing view with a detached subview", function() {
    var view = new (Backbone.View.extend({
      render: function() {
        this.$el.append(this.addSubview(new SubviewClass, 'test').render().el);
        return this;
      },
      onRemove: function() {
        onRemoveCallbacksCounter++;
      }
    }));
    fixture.html(view.render().el);
    equal(fixture.find('*').length, 2, "Fixture should have two child elements");
    equal(view._subviews.length, 1, "View should have one subview");
    view.getSubview('test').detach();
    equal(fixture.find('*').length, 1, "Fixture should have one child element");
    equal(view._subviews.length, 1, "View should not have one subview");
    view.remove();
    equal(fixture.find('*').length, 0, "Fixture should not have any child elements");
    equal(onRemoveCallbacksCounter, 2, "onRemove callback should have been called two times");
  });
});
