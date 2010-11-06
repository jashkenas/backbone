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

  test("View: handleBindings", function() {
    var ViewClass = Backbone.View.extend({
        initialize: function () {
          this.el = $('<div class="classic"><h1 class="title blue">something</h1><p class="content">the content</p></div>');
          this.handleBindings();
        },
        
        contentBindings: {
          title: '.title',
          body: ''
        },
        
        classBindings: {
          open: '.title',
          color: '.title',
          focused: '',
          status: ''
        }
      }),
      ModelClass = Backbone.Model.extend({
        initialize: function () {
          // set some initial values
          this.set({
            title: 'something',
            open: false,
            color: 'blue',
            focused: false,
            status: 'classic'
          });
        }
      }),
      model = new ModelClass(),
      view = new ViewClass({model: model});
      
      equals(view.el.find('.title').text(), 'something');
      
      // change everything
      model.set({
        title: 'something else',
        open: true,
        color: 'green',
        focused: true,
        status: 'old'
      });
      // make sure our content updated
      equals(view.el.find('.title').text(), 'something else');
      
      // make sure our boolean added active class
      ok(view.el.find('.title').hasClass('active'), "okay: now has class 'active'");
      
      // make sure our string added new class property & removed old
      ok(view.el.find('.title').hasClass('green'), "okay: now has class 'green'");
      equals(view.el.find('.title').hasClass('blue'), false);
      
      // make sure works on parent element too.
      ok(view.el.hasClass('active'), "okay: parent el now has class 'active'");
      ok(view.el.hasClass('old'), "okay: now has class 'green'");
      equals(view.el.hasClass('classic'), false);
      
      // make sure content works on parent too
      model.set({body: "different"});
      equals(view.el.text(), "different");
  });

  test("View: _ensureElement", function() {
    var ViewClass = Backbone.View.extend({
      el: document.body
    });
    var view = new ViewClass;
    equals(view.el, document.body);
  });

});