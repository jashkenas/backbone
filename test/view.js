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


  test("$el", function() {
    var view = new Backbone.View;
    view.setElement('<p><a><b>test</b></a></p>');
    strictEqual(view.el.nodeType, 1);

    if (Backbone.$) {
      ok(view.$el instanceof Backbone.$);
      strictEqual(view.$el[0], view.el);
    }
  });

  test("initialize", 1, function() {
    var View = Backbone.View.extend({
      initialize: function() {
        this.one = 1;
      }
    });

    strictEqual(new View().one, 1);
  });

  test("delegateEvents", 6, function() {
    var counter1 = 0, counter2 = 0;

    var view = new Backbone.View({el: '#testElement'});
    view.increment = function(){ counter1++; };
    addEventListener.call(view.el, 'click', function(){ counter2++; });

    var events = {'click h1': 'increment'};

    view.delegateEvents(events);
    click(view.$('h1')[0]);
    equal(counter1, 1);
    equal(counter2, 1);

    click(view.$('h1')[0]);
    equal(counter1, 2);
    equal(counter2, 2);

    view.delegateEvents(events);
    click(view.$('h1')[0]);
    equal(counter1, 3);
    equal(counter2, 3);
  });


  test("delegate", 2, function() {
    var view = new Backbone.View({el: '#testElement'});
    view.delegate('click', 'h1', function() {
      ok(true);
    });
    view.delegate('click', function() {
      ok(true);
    });
    click(view.$('h1')[0]);
  });


  test("delegateEvents allows functions for callbacks", 3, function() {
    var view = new Backbone.View({el: '<p></p>'});
    view.counter = 0;

    var events = {
      click: function() {
        this.counter++;
      }
    };

    document.body.appendChild(view.el);

    view.delegateEvents(events);
    click(view.el);
    equal(view.counter, 1);

    click(view.el);
    equal(view.counter, 2);

    view.delegateEvents(events);
    click(view.el);
    equal(view.counter, 3);

    document.body.removeChild(view.el);
  });


  test("delegateEvents ignore undefined methods", 0, function() {
    var view = new Backbone.View({el: '<p></p>'});

    document.body.appendChild(view.el);

    view.delegateEvents({'click': 'undefinedMethod'});
    click(view.el);

    document.body.removeChild(view.el);
  });

  test("undelegateEvents", 6, function() {
    var counter1 = 0, counter2 = 0;

    var view = new Backbone.View({el: '#testElement'});
    view.increment = function(){ counter1++; };
    addEventListener.call(view.el, 'click', function(){ counter2++; });

    var events = {'click h1': 'increment'};

    view.delegateEvents(events);
    click(view.$('h1')[0]);
    equal(counter1, 1);
    equal(counter2, 1);

    view.undelegateEvents();
    click(view.$('h1')[0]);
    equal(counter1, 1);
    equal(counter2, 2);

    view.delegateEvents(events);
    click(view.$('h1')[0]);
    equal(counter1, 2);
    equal(counter2, 3);
  });


  test("undelegate", 0, function() {
    var view = new Backbone.View({el: '#testElement'});
    view.delegate('click', function() { ok(false); });
    view.delegate('click', 'h1', function() { ok(false); });

    view.undelegate('click');

    click(view.$('h1')[0]);
    click(view.el);
  });

  test("undelegate with passed handler", 1, function() {
    var view = new Backbone.View({el: '#testElement'});
    var listener = function() { ok(false); };
    view.delegate('click', listener);
    view.delegate('click', function() { ok(true); });
    view.undelegate('click', listener);
    click(view.el);
  });

  test("undelegate with selector", 2, function() {
    var view = new Backbone.View({el: '#testElement'});
    view.delegate('click', function() { ok(true); });
    view.delegate('click', 'h1', function() { ok(false); });
    view.undelegate('click', 'h1');
    click(view.$('h1')[0]);
    click(view.el);
  });

  test("undelegate with handler and selector", 2, function() {
    var view = new Backbone.View({el: '#testElement'});
    view.delegate('click', function() { ok(true); });
    var handler = function(){ ok(false); };
    view.delegate('click', 'h1', handler);
    view.undelegate('click', 'h1', handler);
    click(view.$('h1')[0]);
    click(view.el);
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

    equal(new View().el.tagName, 'P');
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

    View = View.extend({
      el: "#testElement > h1"
    });
    var children = document.getElementById('testElement').childNodes;
    var h1 = _.findWhere(children, {nodeType: 1});
    strictEqual(new View().el, h1);

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

  test("multiple views per element", 3, function() {
    var count = 0;
    var el = document.createElement('p');

    var View = Backbone.View.extend({
      el: el,
      events: {
        click: function() {
          count++;
        }
      }
    });

    document.body.appendChild(el);

    var view1 = new View;
    click(el);
    equal(1, count);

    var view2 = new View;
    click(el);
    equal(3, count);

    view1.delegateEvents();
    click(el);
    equal(5, count);

    document.body.removeChild(el);
  });

  test("custom events", 2, function() {
    var count = 0;

    var View = Backbone.View.extend({
      el: 'body',
      events: function() {
        return {"fake$event": "run"};
      },
      run: function() {
        count++;
      }
    });

    var view = new View;
    var event = new CustomEvent("fake$event");
    trigger(document.body, event, 'fake$event');
    trigger(document.body, event, 'fake$event');
    equal(count, 2);

    view.undelegate("fake$event");
    trigger(document.body, event, 'fake$event');
    equal(count, 2);
  });

  test("#1048 - setElement uses provided object.", 2, function() {
    var el = document.body;

    var view = new Backbone.View({el: el});
    ok(view.el === el);

    view.setElement(el = document.body);
    ok(view.el === el);
  });

  test("#986 - Undelegate before changing element.", 1, function() {
    var button1 = document.createElement('button');
    var button2 = document.createElement('button');

    document.body.appendChild(button1);
    document.body.appendChild(button2);

    var View = Backbone.View.extend({
      events: {
        click: function(e) {
          ok(view.el === e.target || e.srcElement);
        }
      }
    });

    var view = new View({el: button1});
    view.setElement(button2);

    click(button1);
    click(button2);

    document.body.removeChild(button1);
    document.body.removeChild(button2);
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
    ok(view.el.tagName == 'P');
    ok(view.$('a').length != 0);
  });

  test("remove", 1, function() {
    var view = new Backbone.View;
    document.body.appendChild(view.el);

    view.delegate('click', function() { ok(false); });
    view.listenTo(view, 'all x', function() { ok(false); });

    view.remove();
    click(view.el);
    view.trigger('x');

    // In IE8 and below, parentNode still exists but is not document.body.
    notEqual(view.el.parentNode, document.body);
  });

  test("events passed in options", 1, function() {
    var counter = 0;

    var View = Backbone.View.extend({
      el: '#testElement',
      increment: function() {
        counter++;
      }
    });

    var view = new View({
      events: {
        'click h1': 'increment'
      }
    });

    click(view.$('h1')[0]);
    click(view.$('h1')[0]);
    equal(counter, 2);
  });

  // Cross-browser helpers
  var ElementProto = (typeof Element != 'undefined' && Element.prototype) || {};

  var addEventListener = ElementProto.addEventListener || function(eventName, listener) {
    return this.attachEvent('on' + eventName, listener);
  };

  function trigger(element, event, eventName) {
    if (element.dispatchEvent) {
      element.dispatchEvent(event);
    } else {
      element.fireEvent(eventName, event);
    }
  }

  function click(element) {
    var event;
    if (document.createEvent) {
      event = document.createEvent('MouseEvent');
      var args = [
        'click', true, true,
        // IE 10+ and Firefox require these
        event.view, event.detail, event.screenX, event.screenY, event.clientX,
        event.clientY, event.ctrlKey, event.altKey, event.shiftKey,
        event.metaKey, event.button, event.relatedTarget
      ];
      (event.initMouseEvent || event.initEvent).apply(event, args);
    } else {
      event = document.createEventObject();
      event.type = 'click';
      event.bubbles = true;
      event.cancelable = true;
    }
    trigger(element, event, 'onclick');
  }

})();
