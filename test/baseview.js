(function() {

  var view;

  var addEventListener = function(obj, eventName, listener, useCapture) {
    if (obj.addEventListener) return obj.addEventListener(eventName, listener, useCapture);
    else return obj.attachEvent('on' + eventName, listener);
  };

  function click(element) {
    var event = SyntheticEvent('click', {
      bubbles: true,
      cancelable: false
    });
    if (element.dispatchEvent) {
      return element.dispatchEvent(event);
    }
    element.fireEvent('onclick', event);
  }

  module("Backbone.BaseView", {

    setup: function() {
      view = new Backbone.BaseView({
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

  test("querySelectorAll", 1, function() {
    var view = new Backbone.BaseView;
    view.setElement('<p><a><b>test</b></a></p>');
    strictEqual(view.$('a b')[0].innerHTML, 'test');
  });

  test("initialize", 1, function() {
    var View = Backbone.BaseView.extend({
      initialize: function() {
        this.one = 1;
      }
    });

    strictEqual(new View().one, 1);
  });

  test("delegateEvents", 6, function() {
    var counter1 = 0, counter2 = 0;

    var view = new Backbone.BaseView({el: '#testElement'});
    view.increment = function(){ counter1++; };
    addEventListener(view.el, 'click', function(){ counter2++; });

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

  test("delegateEvents allows functions for callbacks", 3, function() {
    var view = new Backbone.BaseView({el: '<p></p>'});
    view.counter = 0;

    var events = {
      click: function() {
        this.counter++;
      }
    };

    view.delegateEvents(events);
    click(view.el);
    equal(view.counter, 1);

    click(view.el);
    equal(view.counter, 2);

    view.delegateEvents(events);
    click(view.el);
    equal(view.counter, 3);
  });


  test("delegateEvents ignore undefined methods", 0, function() {
    var view = new Backbone.BaseView({el: '<p></p>'});
    view.delegateEvents({'click': 'undefinedMethod'});
    click(view.el);
  });

  test("undelegateEvents", 6, function() {
    var counter1 = 0, counter2 = 0;

    var view = new Backbone.BaseView({el: '#testElement'});
    view.increment = function(){ counter1++; };
    addEventListener(view.el, 'click', function(){ counter2++; });

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

  test("_ensureElement with DOM node el", 1, function() {
    var View = Backbone.BaseView.extend({
      el: document.body
    });

    equal(new View().el, document.body);
  });

  test("_ensureElement with string el", 3, function() {
    var View = Backbone.BaseView.extend({
      el: "body"
    });
    strictEqual(new View().el, document.body);

    View = Backbone.BaseView.extend({
      el: "#testElement > h1"
    });
    strictEqual(new View().el, $("#testElement > h1").get(0));

    View = Backbone.BaseView.extend({
      el: "#nonexistent"
    });
    ok(!new View().el);
  });

  test("with className and id functions", 2, function() {
    var View = Backbone.BaseView.extend({
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
    var View = Backbone.BaseView.extend({
      attributes: {
        id: 'id',
        'class': 'class'
      }
    });

    strictEqual(new View().el.className, 'class');
    strictEqual(new View().el.id, 'id');
  });

  test("with attributes as a function", 1, function() {
    var View = Backbone.BaseView.extend({
      attributes: function() {
        return {'class': 'dynamic'};
      }
    });

    strictEqual(new View().el.className, 'dynamic');
  });

  test("multiple views per element", 3, function() {
    var count = 0;
    var el = document.createElement('p');

    var View = Backbone.BaseView.extend({
      el: el,
      events: {
        click: function() {
          count++;
        }
      }
    });

    // Firing click event on a detached node with throw an unspecified error on
    // IE8
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

  test("#1048 - setElement uses provided object.", 2, function() {
    var el = document.body;

    var view = new Backbone.BaseView({el: el});
    ok(view.el === el);

    view.setElement(el = document.body);
    ok(view.el === el);
  });

  test("#986 - Undelegate before changing element.", 1, function() {
    var button1 = document.createElement('button');
    var button2 = document.createElement('button');

    document.body.appendChild(button1);
    document.body.appendChild(button2);

    var View = Backbone.BaseView.extend({
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
    var View = Backbone.BaseView.extend({
      attributes: {foo: 'bar'}
    });

    var view1 = new View({id: 'foo'});
    strictEqual(view1.el.id, 'foo');

    var view2 = new View();
    ok(!view2.el.id);
  });

  test("#1228 - tagName can be provided as a function", 1, function() {
    var View = Backbone.BaseView.extend({
      tagName: function() {
        return 'p';
      }
    });

    ok(new View().el.tagName.toLowerCase() == 'p');
  });

  test("views stopListening", 0, function() {
    var View = Backbone.BaseView.extend({
      initialize: function() {
        this.listenTo(this.model, 'all x', function(){ ok(false); }, this);
        this.listenTo(this.collection, 'all x', function(){ ok(false); }, this);
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
    var View = Backbone.BaseView.extend({
      el: function() {
        return "<p><a></a></p>";
      }
    });

    var view = new View;
    ok(view.el.tagName.toLowerCase() == 'p');
    ok(view.el.querySelector('a'));
  });

  test("events passed in options", 1, function() {
    var counter = 0;

    var View = Backbone.BaseView.extend({
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

})();
