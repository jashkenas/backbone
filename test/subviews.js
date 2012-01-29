$(document).ready(function() {

  module("Backbone.View.subviews");

  var ViewClass = Backbone.View.extend({
    className : 'test-view',
    initialize: function() {
      this.subview = this.addSubview(new SubviewClass());
    },
    render: function() {
      this.$el.html('view');
      this.$el.append(this.subview.render().el);
      return this;
    } 
  });

  var ViewNamedSubClass = Backbone.View.extend({
    className : 'test-view',
    initialize: function() {
      this.subview = this.addSubview(new SubviewClass(), 'test');
    },
    render: function() {
      this.$el.html('view');
      this.$el.append(this.subview.render().el);
      return this;
    } 
  });

  var ViewMultipleClass = Backbone.View.extend({
    className: 'test-view',
    render: function() {
      this.$el.append(this.addSubview(new SubviewClass()).render().el);
      this.$el.append(this.addSubview(new SubviewClass()).render().el);
      this.$el.append(this.addSubview(new SubviewClass()).render().el);
      this.$el.append(this.addSubview(new SubviewClass()).render().el);
      return this;
    }
  });

  var ViewNamedReplaceClass = Backbone.View.extend({
    className : 'test-view',
    render: function() {
      this.$el.html('view');
      this.$el.append(this.addSubview(new SubviewClass(), 'test').render().el);
      this.$el.append(this.addSubview(new SubviewClass(), 'test').render().el);
      this.$el.append(this.addSubview(new SubviewClass(), 'test').render().el);
      this.$el.append(this.addSubview(new SubviewClass(), 'test').render().el);
      return this;
    } 
  });

  var SubviewClass = Backbone.View.extend({
    className : 'test-subview',
    render: function() {
      this.$el.html('subview');
      return this;
    }
  });

  var fixture = $('#qunit-fixtures');

  test("View: addSubview", function() {
    var view = new ViewClass;
    fixture.html(view.render().el);
    equal(view._subviews.length, 1, "View should have one subview");
    equal(view._subviews[0]._parent, view, "Subview should have view as a _parent");
    equal(_.size(view._namedSubviews), 0, "View named subviews map should be empty");
    equal(fixture.find('.test-view').length, 1, "One View should be added to DOM");
    equal(fixture.find('.test-subview').length, 1, "Subview should be added to DOM");
  });

  test("View: multiple views using addSubview", function() {
    var view = new ViewMultipleClass;
    fixture.html(view.render().el);
    equal(view._subviews.length, 4, "View should have four subview");
    equal(view._subviews[0]._parent, view, "Subview should have view as a _parent");
    equal(_.size(view._namedSubviews), 0, "View named subviews map should be empty");
    equal(fixture.find('.test-view').length, 1, "One View should be added to DOM");
    equal(fixture.find('.test-subview').length, 4, "Four Subviews should be added to DOM");
  });

  test("View: addSubview with name", function() {
    var view = new ViewNamedSubClass();
    fixture.html(view.render().el);
    equal(view._subviews.length, 1, "View should have one subview");
    equal(view._subviews[0]._parent, view, "Subview should have view as a _parent");
    equal(view._subviews[0]._name, 'test', "Subview should have 'test' as a _name");
    equal(_.size(view._namedSubviews), 1, "View named subviews map should contain one view");
    equal(fixture.find('.test-view').length, 1, "One View should be added to DOM");
    equal(view.$('.test-subview').length, 1, "One Subview should be added to DOM as a child to the view");
  });

  test("View: replace views using addSubview with name", function() {
    var view = new ViewNamedReplaceClass();
    fixture.html(view.render().el);
    equal(view._subviews.length, 1, "View should have one subview");
    equal(_.size(view._namedSubviews), 1, "View named subviews map should contain one view");
    equal(fixture.find('.test-view').length, 1, "One View should be added to DOM");
    equal(view.$('.test-subview').length, 1, "One Subview should be present in the DOM as a child to the view");
  });
});
