$(document).ready(function() {

  module("Backbone.Events");

  test("Events: on and trigger", function() {
    var obj = { counter: 0 };
    _.extend(obj,Backbone.Events);
    obj.on('event', function() { obj.counter += 1; });
    obj.trigger('event');
    equal(obj.counter,1,'counter should be incremented.');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    equal(obj.counter, 5, 'counter should be incremented five times.');
  });

  test("Events: binding and triggering multiple events", function() {
    var obj = { counter: 0 };
    _.extend(obj,Backbone.Events);

    obj.on('a b c', function() { obj.counter += 1; });

    obj.trigger('a');
    equal(obj.counter, 1);

    obj.trigger('a b');
    equal(obj.counter, 3);

    obj.trigger('c');
    equal(obj.counter, 4);

    obj.off('a c');
    obj.trigger('a b c');
    equal(obj.counter, 5);
  });

  test("Events: trigger all for each event", function() {
    var a, b, obj = { counter: 0 };
    _.extend(obj, Backbone.Events);
    obj.on('all', function(event) {
      obj.counter++;
      if (event == 'a') a = true;
      if (event == 'b') b = true;
    })
    .trigger('a b');
    ok(a);
    ok(b);
    equal(obj.counter, 2);
  });

  test("Events: on, then unbind all functions", function() {
    var obj = { counter: 0 };
    _.extend(obj,Backbone.Events);
    var callback = function() { obj.counter += 1; };
    obj.on('event', callback);
    obj.trigger('event');
    obj.off('event');
    obj.trigger('event');
    equal(obj.counter, 1, 'counter should have only been incremented once.');
  });

  test("Events: bind two callbacks, unbind only one", function() {
    var obj = { counterA: 0, counterB: 0 };
    _.extend(obj,Backbone.Events);
    var callback = function() { obj.counterA += 1; };
    obj.on('event', callback);
    obj.on('event', function() { obj.counterB += 1; });
    obj.trigger('event');
    obj.off('event', callback);
    obj.trigger('event');
    equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    equal(obj.counterB, 2, 'counterB should have been incremented twice.');
  });

  test("Events: unbind a callback in the midst of it firing", function() {
    var obj = {counter: 0};
    _.extend(obj, Backbone.Events);
    var callback = function() {
      obj.counter += 1;
      obj.unbind('event', callback);
    };
    obj.bind('event', callback);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    equal(obj.counter, 1, 'the callback should have been unbound.');
  });

  test("Events: two binds that unbind themeselves", function() {
    var obj = { counterA: 0, counterB: 0 };
    _.extend(obj,Backbone.Events);
    var incrA = function(){ obj.counterA += 1; obj.unbind('event', incrA); };
    var incrB = function(){ obj.counterB += 1; obj.unbind('event', incrB); };
    obj.bind('event', incrA);
    obj.bind('event', incrB);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    equal(obj.counterB, 1, 'counterB should have only been incremented once.');
  });

  test("Events: bind a callback with a supplied context", function () {
    expect(1);

    var TestClass = function () {
      return this;
    };
    TestClass.prototype.assertTrue = function () {
      ok(true, '`this` was bound to the callback');
    };

    var obj = _.extend({},Backbone.Events);

    obj.bind('event', function () { this.assertTrue(); }, (new TestClass));

    obj.trigger('event');

  });

  test("Events: nested trigger with unbind", function () {
    expect(1);
    var obj = { counter: 0 };
    _.extend(obj, Backbone.Events);
    var incr1 = function(){ obj.counter += 1; obj.unbind('event', incr1); obj.trigger('event'); };
    var incr2 = function(){ obj.counter += 1; };
    obj.bind('event', incr1);
    obj.bind('event', incr2);
    obj.trigger('event');
    equal(obj.counter, 3, 'counter should have been incremented three times');
  });

  test("Events: callback list is not altered during trigger", function () {
    var counter = 0, obj = _.extend({}, Backbone.Events);
    var incr = function(){ counter++; };
    obj.bind('event', function(){ obj.bind('event', incr).bind('all', incr); })
    .trigger('event');
    equal(counter, 0, 'bind does not alter callback list');
    obj.unbind()
    .bind('event', function(){ obj.unbind('event', incr).unbind('all', incr); })
    .bind('event', incr)
    .bind('all', incr)
    .trigger('event');
    equal(counter, 2, 'unbind does not alter callback list');
  });

  test("if no callback is provided, `on` is a noop", function() {
    _.extend({}, Backbone.Events).bind('test').trigger('test');
  });

  test("remove all events for a specific context", 4, function() {
    var obj = _.extend({}, Backbone.Events);
    obj.on('x y all', function() { ok(true); });
    obj.on('x y all', function() { ok(false); }, obj);
    obj.off(null, null, obj);
    obj.trigger('x y');
  });

  test("remove all events for a specific callback", 4, function() {
    var obj = _.extend({}, Backbone.Events);
    var success = function() { ok(true); };
    var fail = function() { ok(false); };
    obj.on('x y all', success);
    obj.on('x y all', fail);
    obj.off(null, fail);
    obj.trigger('x y');
  });

});
