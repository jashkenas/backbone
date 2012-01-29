$(document).ready(function() {

  module("Backbone.View.subviews");

  var SubviewClass = Backbone.View.extend({
    className : 'test-subview',
    render: function() {
      this.$el.html('subview');
      return this;
    }
  });

  var fixture = $('#qunit-fixtures');

  test("View: Add one subview", function() {
    var view = new (Backbone.View.extend({
      className : 'test-view',
      initialize: function() {
        this.subview = this.addSubview(new SubviewClass());
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
    equal(_.size(view._namedSubviews), 0, "View named subviews map should be empty");
    equal(fixture.find('.test-view').length, 1, "One View should be added to DOM");
    equal(fixture.find('.test-subview').length, 1, "Subview should be added to DOM");
  });

  test("View: Add multiple views using addSubview", function() {
    var view = new (Backbone.View.extend({
      className: 'test-view',
      render: function() {
        this.$el.append(this.addSubview(new SubviewClass()).render().el);
        this.$el.append(this.addSubview(new SubviewClass()).render().el);
        this.$el.append(this.addSubview(new SubviewClass()).render().el);
        this.$el.append(this.addSubview(new SubviewClass()).render().el);
        return this;
      }
    }));
    fixture.html(view.render().el);
    equal(view._subviews.length, 4, "View should have four subviews");
    equal(view._subviews[0]._parent, view, "Subview should have view as a _parent");
    equal(_.size(view._namedSubviews), 0, "View named subviews map should be empty");
    equal(fixture.find('.test-view').length, 1, "One View should be added to DOM");
    equal(fixture.find('.test-subview').length, 4, "Four Subviews should be added to DOM");
  });

  test("View: Add one named subview", function() {
    var view = new (Backbone.View.extend({
      className : 'test-view',
      initialize: function() {
        this.subview = this.addSubview(new SubviewClass(), 'test');
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
        this.$el.append(this.addSubview(new SubviewClass(), 'test1').render().el);
        this.$el.append(this.addSubview(new SubviewClass(), 'test2').render().el);
        this.$el.append(this.addSubview(new SubviewClass(), 'test3').render().el);
        this.$el.append(this.addSubview(new SubviewClass(), 'test4').render().el);
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
        this.$el.append(this.addSubview(new SubviewClass(), 'test').render().el);
        this.$el.append(this.addSubview(new SubviewClass(), 'test').render().el);
        this.$el.append(this.addSubview(new SubviewClass(), 'test').render().el);
        this.$el.append(this.addSubview(new SubviewClass(), 'test').render().el);
        return this;
      } 
    }));
    fixture.html(view.render().el);
    equal(view._subviews.length, 1, "View should have one subview");
    equal(_.size(view._namedSubviews), 1, "View named subviews map should contain one subview");
    equal(fixture.find('.test-view').length, 1, "One View should be added to DOM");
    equal(view.$('.test-subview').length, 1, "One Subview should be present in the DOM as a child to the view");
  });
});
