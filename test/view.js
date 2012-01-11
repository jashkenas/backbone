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
    ok(view.$('#qunit-header a').get(0).innerHTML.match(/Backbone Test Suite/));
    ok(view.$('#qunit-header a').get(1).innerHTML.match(/Backbone Speed Suite/));
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
    var counter = counter2 = 0;
    view.el = document.body;
    view.increment = function(){ counter++; };
    view.$().bind('click', function(){ counter2++; });
    var events = {"click #qunit-banner": "increment"};
    view.delegateEvents(events);
    $('#qunit-banner').trigger('click');
    equals(counter, 1);
    equals(counter2, 1);
    $('#qunit-banner').trigger('click');
    equals(counter, 2);
    equals(counter2, 2);
    view.delegateEvents(events);
    $('#qunit-banner').trigger('click');
    equals(counter, 3);
    equals(counter2, 3);
  });

  test("View: undelegateEvents", function() {
    var counter = counter2 = 0;
    view.el = document.body;
    view.increment = function(){ counter++; };
    $(view.el).unbind('click');
    $(view.el).bind('click', function(){ counter2++; });
    var events = {"click #qunit-userAgent": "increment"};
    view.delegateEvents(events);
    $('#qunit-userAgent').trigger('click');
    equals(counter, 1);
    equals(counter2, 1);
    view.undelegateEvents();
    $('#qunit-userAgent').trigger('click');
    equals(counter, 1);
    equals(counter2, 2);
    view.delegateEvents(events);
    $('#qunit-userAgent').trigger('click');
    equals(counter, 2);
    equals(counter2, 3);
  });

  test("View: _ensureElement with DOM node el", function() {
    var ViewClass = Backbone.View.extend({
      el: document.body
    });
    var view = new ViewClass;
    equals(view.el, document.body);
  });

  test("View: _ensureElement with string el", function() {
    var ViewClass = Backbone.View.extend({
      el: "body"
    });
    var view = new ViewClass;
    equals(view.el, document.body);

    ViewClass = Backbone.View.extend({
      el: "body > h2"
    });
    view = new ViewClass;
    equals(view.el, $("#qunit-banner").get(0));

    ViewClass = Backbone.View.extend({
      el: "#nonexistent"
    });
    view = new ViewClass;
    ok(!view.el);
  });

  test("View: with attributes", function() {
    var view = new Backbone.View({attributes : {'class': 'one', id: 'two'}});
    equals(view.el.className, 'one');
    equals(view.el.id, 'two');
  });

  test("View: multiple views per element", function() {
    var count = 0, ViewClass = Backbone.View.extend({
      el: $("body"),
      events: {
        "click": "click"
      },
      click: function() {
        count++;
      }
    });

    var view1 = new ViewClass;
    $("body").trigger("click");
    equals(1, count);

    var view2 = new ViewClass;
    $("body").trigger("click");
    equals(3, count);

    view1.delegateEvents();
    $("body").trigger("click");
    equals(5, count);
  });

  test("View: custom events, with namespaces", function() {
    var count = 0;
    var ViewClass = Backbone.View.extend({
      el: $('body'),
      events: function() {
        return {"fake$event.namespaced": "run"};
      },
      run: function() {
        count++;
      }
    });

    var view = new ViewClass;
    $('body').trigger('fake$event').trigger('fake$event');
    equals(count, 2);
    $('body').unbind('.namespaced');
    $('body').trigger('fake$event');
    equals(count, 2);
  });

  test("View: setLocalElements", function() {
    var ViewClass = Backbone.View.extend({
        el: '<div><span class="title"></span> by <em class="author"></em>',
        elements: {
          '.title': 'title',
          '.author': 'author'
        }
    });

    var view = new ViewClass;

    equals(view.title.selector, '.title');
    equals(view.author.selector, '.author');

  });

});
