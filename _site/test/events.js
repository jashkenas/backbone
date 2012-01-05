$(document).ready(function() {

  module("Backbone.Events");

  test("Events: bind and trigger", function() {
    var obj = { counter: 0 };
    _.extend(obj,Backbone.Events);
    obj.bind('event', function() { obj.counter += 1; });
    obj.trigger('event');
    equals(obj.counter,1,'counter should be incremented.');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    equals(obj.counter, 5, 'counter should be incremented five times.');
  });

  test("Events: bind, then unbind all functions", function() {
    var obj = { counter: 0 };
    _.extend(obj,Backbone.Events);
    var callback = function() { obj.counter += 1; };
    obj.bind('event', callback);
    obj.trigger('event');
    obj.unbind('event');
    obj.trigger('event');
    equals(obj.counter, 1, 'counter should have only been incremented once.');
  });

  test("Events: bind two callbacks, unbind only one", function() {
    var obj = { counterA: 0, counterB: 0 };
    _.extend(obj,Backbone.Events);
    var callback = function() { obj.counterA += 1; };
    obj.bind('event', callback);
    obj.bind('event', function() { obj.counterB += 1; });
    obj.trigger('event');
    obj.unbind('event', callback);
    obj.trigger('event');
    equals(obj.counterA, 1, 'counterA should have only been incremented once.');
    equals(obj.counterB, 2, 'counterB should have been incremented twice.');
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
    equals(obj.counter, 1, 'the callback should have been unbound.');
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
    equals(obj.counterA, 1, 'counterA should have only been incremented once.');
    equals(obj.counterB, 1, 'counterB should have only been incremented once.');
  });

  test("Events: bind a callback with a supplied context", function () {
    expect(1);

    var TestClass = function () { return this; }
    TestClass.prototype.assertTrue = function () {
      ok(true, '`this` was bound to the callback')
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
    equals(obj.counter, 3, 'counter should have been incremented three times');
  });

});
