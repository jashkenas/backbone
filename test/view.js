(function() {

  var view;

  module("Backbone.View", {

    setup: function() {
      view = new Backbone.View({
        id        : 'test-view',
        className : 'test-view',
        other     : 'non-special-option'
      });
    }

  });

  test("constructor", 3, function() {
    equal(view.el.id, 'test-view');
    equal(view.el.className, 'test-view');
    equal(view.el.other, void 0);
  });

  test("$", 2, function() {
    var view = new Backbone.View;
    view.setElement('<p><a><b>test</b></a></p>');
    var result = view.$('a b');

    strictEqual(result[0].innerHTML, 'test');
    ok(result.length === +result.length);
  });

  test("$el", 3, function() {
    var view = new Backbone.View;
    view.setElement('<p><a><b>test</b></a></p>');
    strictEqual(view.el.nodeType, 1);

    ok(view.$el instanceof Backbone.$);
    strictEqual(view.$el[0], view.el);
  });

  test("initialize", 1, function() {
    var View = Backbone.View.extend({
      initialize: function() {
        this.one = 1;
      }
    });

    strictEqual(new View().one, 1);
  });

  test("delegateEvents", 4, function() {
    var view = new Backbone.View;
    view.handler = function(){ ok(this === view); };
    view.undelegateEvents = function(){ ok(true); };
    view.delegate = function(eventName, selector, handler) {
      strictEqual(eventName, 'click');
      strictEqual(selector, 'h1');
      handler();
    };
    view.delegateEvents({'click h1': 'handler'});
  });

  test("delegate", 3, function() {
    var view = new Backbone.View;
    view.handler = function(){};
    view.$el = {
      on: function(eventName, selector, handler) {
        strictEqual(eventName, 'click.delegateEvents' + view.cid);
        strictEqual(selector, 'h1');
        ok(handler === view.handler);
      }
    };
    view.delegate('click', 'h1', view.handler);
  });

  test("delegateEvents allows functions for callbacks", 4, function() {
    var view = new Backbone.View;
    view.undelegateEvents = function(){ ok(true); };
    view.delegate = function(eventName, selector, handler) {
      strictEqual(eventName, 'click');
      strictEqual(selector, '');
      handler();
    };
    view.delegateEvents({
      click: function() {
        ok(this === view);
      }
    });
  });

  test("delegateEvents ignore undefined methods", 0, function() {
    var view = new Backbone.View;
    view.delegate = function(){ ok(false); };
    view.delegateEvents({click: 'undefinedMethod'});
  });

  test("undelegateEvents", 1, function() {
    var view = new Backbone.View;
    view.$el = {
      off: function(eventName) {
        strictEqual(eventName, '.delegateEvents' + view.cid);
      }
    };
    view.undelegateEvents();
  });

  test("undelegate", 3, function() {
    var view = new Backbone.View;
    view.$el = {
      off: function(eventName, selector, handler) {
        strictEqual(eventName, 'click.delegateEvents' + view.cid);
        ok(!selector);
        ok(!handler);
      }
    };
    view.undelegate('click');
  });

  test("undelegate with passed handler", 3, function() {
    var view = new Backbone.View;
    view.handler = function(){};
    view.$el = {
      off: function(eventName, selector, handler) {
        strictEqual(eventName, 'click.delegateEvents' + view.cid);
        strictEqual(selector, view.handler);
        ok(!handler);
      }
    };
    view.undelegate('click', view.handler);
  });

  test("undelegate with selector", 3, function() {
    var view = new Backbone.View;
    view.$el = {
      off: function(eventName, selector, handler) {
        strictEqual(eventName, 'click.delegateEvents' + view.cid);
        strictEqual(selector, 'button');
        ok(!handler);
      }
    };
    view.undelegate('click', 'button');
  });

  test("undelegate with handler and selector", 3, function() {
    var view = new Backbone.View;
    view.handler = function(){};
    view.$el = {
      off: function(eventName, selector, handler) {
        strictEqual(eventName, 'click.delegateEvents' + view.cid);
        strictEqual(selector, 'button');
        strictEqual(handler, view.handler);
      }
    };
    view.undelegate('click', 'button', view.handler);
  });

  test("tagName can be provided as a string", 1, function() {
    var View = Backbone.View.extend({
      tagName: 'span'
    });

    equal(new View().el.tagName, 'SPAN');
  });

  test("tagName can be provided as a function", 1, function() {
    var View = Backbone.View.extend({
      tagName: function() {
        return 'p';
      }
    });

    ok(new View().$el.is('p'));
  });

  test("_ensureElement with DOM node el", 1, function() {
    var View = Backbone.View.extend({
      el: document.body
    });

    equal(new View().el, document.body);
  });

  test("_ensureElement with string el", 3, function() {
    var View = Backbone.View.extend({
      el: "body"
    });
    strictEqual(new View().el, document.body);

    View = Backbone.View.extend({
      el: "#testElement > h1"
    });
    strictEqual(new View().el, $("#testElement > h1").get(0));

    View = Backbone.View.extend({
      el: "#nonexistent"
    });
    ok(!new View().el);
  });

  test("with className and id functions", 2, function() {
    var View = Backbone.View.extend({
      className: function() {
        return 'className';
      },
      id: function() {
        return 'id';
      }
    });

    strictEqual(new View().el.className, 'className');
    strictEqual(new View().el.id, 'id');
  });

  test("with attributes", 2, function() {
    var View = Backbone.View.extend({
      attributes: {
        id: 'id',
        'class': 'class'
      }
    });

    strictEqual(new View().el.className, 'class');
    strictEqual(new View().el.id, 'id');
  });

  test("with attributes as a function", 1, function() {
    var View = Backbone.View.extend({
      attributes: function() {
        return {'class': 'dynamic'};
      }
    });

    strictEqual(new View().el.className, 'dynamic');
  });

  test("custom events", 3, function() {
    var view = new Backbone.View;
    view.delegate = function(eventName, selector, handler) {
      strictEqual(eventName, 'fake$event');
      strictEqual(selector, '');
      handler();
    };
    view.delegateEvents({
      fake$event: function() {
        strictEqual(this, view);
      }
    });
  });

  test("#1048 - setElement uses provided object.", 2, function() {
    var $el = $('body');

    var view = new Backbone.View({el: $el});
    ok(view.$el === $el);

    view.setElement($el = $($el));
    ok(view.$el === $el);
  });

  test("#986 - Undelegate before changing element.", 1, function() {
    var el = document.createElement('p');
    var view = new Backbone.View({el: el});
    view.undelegateEvents = function() {
      strictEqual(this.el, el);
    };
    view.setElement(document.createElement('p'));
  });

  test("#1172 - Clone attributes object", 2, function() {
    var View = Backbone.View.extend({
      attributes: {foo: 'bar'}
    });

    var view1 = new View({id: 'foo'});
    strictEqual(view1.el.id, 'foo');

    var view2 = new View();
    ok(!view2.el.id);
  });

  test("views stopListening", 0, function() {
    var View = Backbone.View.extend({
      initialize: function() {
        this.listenTo(this.model, 'all x', function(){ ok(false); });
        this.listenTo(this.collection, 'all x', function(){ ok(false); });
      }
    });

    var view = new View({
      model: new Backbone.Model,
      collection: new Backbone.Collection
    });

    view.stopListening();
    view.model.trigger('x');
    view.collection.trigger('x');
  });

  test("Provide function for el.", 2, function() {
    var View = Backbone.View.extend({
      el: function() {
        return "<p><a></a></p>";
      }
    });

    var view = new View;
    ok(view.$el.is('p'));
    ok(view.$el.has('a'));
  });

  test("events passed in options", 1, function() {
    var events = {};
    var View = Backbone.View.extend({
      delegateEvents: function() {
        ok(this.events === events);
      }
    });
    new View({events: events});
  });

  test("remove", 1, function() {
    var view = new Backbone.View;

    view.listenTo(view, 'all x', function() {
      ok(false);
    });
    view.$el = {
      remove: function() {
        ok(true);
      }
    };

    view.remove();
    view.trigger('x');
  });

})();
