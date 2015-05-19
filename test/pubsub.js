var assert = require("assert");

describe('IsoldaJS PubSub', function() {

  var PubSub = require('..');
  var _ = require('lodash');

  var noopFn = function () {};
  var throwsFn = function(){
    throw new Error('This handler should never be called');
  }

  it("should support `on` and `trigger`", function() {
    var obj = { counter: 0 };
    _.extend(obj, PubSub);
    obj.on('event', function() { obj.counter += 1; });
    obj.trigger('event');
    assert.equal(obj.counter, 1, 'counter should be incremented.');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    assert.equal(obj.counter, 5, 'counter should be incremented five times.');
  });

  it("should support binding and triggering multiple events", function() {
    var obj = { counter: 0 };
    _.extend(obj, PubSub);

    obj.on('a b c', function() { obj.counter += 1; });

    obj.trigger('a');
    assert.equal(obj.counter, 1);

    obj.trigger('a b');
    assert.equal(obj.counter, 3);

    obj.trigger('c');
    assert.equal(obj.counter, 4);

    obj.off('a c');
    obj.trigger('a b c');
    assert.equal(obj.counter, 5);
  });

  it("should support binding and triggering with event maps", function() {
    var obj = { counter: 0 };
    _.extend(obj, PubSub);

    var increment = function() {
      this.counter += 1;
    };

    obj.on({
      a: increment,
      b: increment,
      c: increment
    }, obj);

    obj.trigger('a');
    assert.equal(obj.counter, 1);

    obj.trigger('a b');
    assert.equal(obj.counter, 3);

    obj.trigger('c');
    assert.equal(obj.counter, 4);

    obj.off({
      a: increment,
      c: increment
    }, obj);
    obj.trigger('a b c');
    assert.equal(obj.counter, 5);
  });

  it("should support `listenTo` and `stopListening`", function() {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    a.listenTo(b, 'all', noopFn);
    b.trigger('anything');
    a.listenTo(b, 'all', throwsFn);
    a.stopListening();
    b.trigger('anything');
  });

  it("should support `listenTo` and `stopListening` with event maps", function() {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    var count = 0;
    var cb = function(){ count += 1; };
    a.listenTo(b, {event: cb});
    b.trigger('event');
    a.listenTo(b, {event2: cb});
    b.on('event2', cb);
    a.stopListening(b, {event2: cb});
    b.trigger('event event2');
    a.stopListening();
    b.trigger('event event2');
    assert.equal(count, 4);
  });

  it("should support `stopListening` with omitted args", function () {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    var count = 0;
    var cb = function(){ count += 1; };
    a.listenTo(b, 'event', cb);
    b.on('event', cb);
    a.listenTo(b, 'event2', cb);
    a.stopListening(null, { event: cb });
    b.trigger('event event2');
    b.off();
    a.listenTo(b, 'event event2', cb);
    a.stopListening(null, 'event');
    a.stopListening();
    b.trigger('event2');
    assert.equal(count, 2);
  });

  it("should support `listenToOnce`", function() {
    // Same as the previous test, but we use once rather than having to explicitly unbind
    var obj = { counterA: 0, counterB: 0 };
    _.extend(obj, PubSub);
    var incrA = function(){ obj.counterA += 1; obj.trigger('event'); };
    var incrB = function(){ obj.counterB += 1; };
    obj.listenToOnce(obj, 'event', incrA);
    obj.listenToOnce(obj, 'event', incrB);
    obj.trigger('event');
    assert.equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    assert.equal(obj.counterB, 1, 'counterB should have only been incremented once.');
  });

  it("should support `listenToOnce` and `stopListening`", function() {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    a.listenToOnce(b, 'all', noopFn);
    b.trigger('anything');
    b.trigger('anything');
    a.listenToOnce(b, 'all', throwsFn);
    a.stopListening();
    b.trigger('anything');
  });

  it("should support `listenTo`, `listenToOnce` and `stopListening`", function() {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    a.listenToOnce(b, 'all', noopFn);
    b.trigger('anything');
    b.trigger('anything');
    a.listenTo(b, 'all', throwsFn);
    a.stopListening();
    b.trigger('anything');
  });

  it("should support `listenTo` and `stopListening` with event maps", function() {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    a.listenTo(b, {change: noopFn});
    b.trigger('change');
    a.listenTo(b, {change: throwsFn});
    a.stopListening();
    b.trigger('change');
  });

  it("should support `listenTo` yourself", function(){
    var e = _.extend({}, PubSub);
    var count = 0;
    e.listenTo(e, "foo", function(){ count += 1; });
    e.trigger("foo");
    assert.equal(count, 1);
  });

  it("`listenTo` yourself should clean yourself up with `stopListening`", function(){
    var e = _.extend({}, PubSub);
    var count = 0;
    e.listenTo(e, "foo", function(){ count += 1; });
    e.trigger("foo");
    e.stopListening();
    e.trigger("foo");
    assert.equal(count, 1);
  });

  it("`stopListening` should clean up references", function() {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    var fn = function() {};
    b.on('event', fn);
    a.listenTo(b, 'event', fn).stopListening();
    assert.equal(_.size(a._listeningTo), 0);
    assert.equal(_.size(b._events.event), 1);
    assert.equal(_.size(b._listeners), 0);
    a.listenTo(b, 'event', fn).stopListening(b);
    assert.equal(_.size(a._listeningTo), 0);
    assert.equal(_.size(b._events.event), 1);
    assert.equal(_.size(b._listeners), 0);
    a.listenTo(b, 'event', fn).stopListening(b, 'event');
    assert.equal(_.size(a._listeningTo), 0);
    assert.equal(_.size(b._events.event), 1);
    assert.equal(_.size(b._listeners), 0);
    a.listenTo(b, 'event', fn).stopListening(b, 'event', fn);
    assert.equal(_.size(a._listeningTo), 0);
    assert.equal(_.size(b._events.event), 1);
    assert.equal(_.size(b._listeners), 0);
  });

  it("`stopListening` should clean up references from `listenToOnce`", function() {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    var fn = function() {};
    b.on('event', fn);
    a.listenToOnce(b, 'event', fn).stopListening();
    assert.equal(_.size(a._listeningTo), 0);
    assert.equal(_.size(b._events.event), 1);
    assert.equal(_.size(b._listeners), 0);
    a.listenToOnce(b, 'event', fn).stopListening(b);
    assert.equal(_.size(a._listeningTo), 0);
    assert.equal(_.size(b._events.event), 1);
    assert.equal(_.size(b._listeners), 0);
    a.listenToOnce(b, 'event', fn).stopListening(b, 'event');
    assert.equal(_.size(a._listeningTo), 0);
    assert.equal(_.size(b._events.event), 1);
    assert.equal(_.size(b._listeners), 0);
    a.listenToOnce(b, 'event', fn).stopListening(b, 'event', fn);
    assert.equal(_.size(a._listeningTo), 0);
    assert.equal(_.size(b._events.event), 1);
    assert.equal(_.size(b._listeners), 0);
  });

  it("`listenTo` and `off` should clean up references", function() {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    var fn = noopFn;
    a.listenTo(b, 'event', fn);
    b.off();
    assert.equal(_.size(a._listeningTo), 0);
    assert.equal(_.size(b._listeners), 0);
    a.listenTo(b, 'event', fn);
    b.off('event');
    assert.equal(_.size(a._listeningTo), 0);
    assert.equal(_.size(b._listeners), 0);
    a.listenTo(b, 'event', fn);
    b.off(null, fn);
    assert.equal(_.size(a._listeningTo), 0);
    assert.equal(_.size(b._listeners), 0);
    a.listenTo(b, 'event', fn);
    b.off(null, null, a);
    assert.equal(_.size(a._listeningTo), 0);
    assert.equal(_.size(b._listeners), 0);
  });

  it("`listenTo` and `stopListening` should clean up references", function() {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    a.listenTo(b, 'all', noopFn);
    b.trigger('anything');
    a.listenTo(b, 'other', throwsFn);
    a.stopListening(b, 'other');
    a.stopListening(b, 'all');
    assert.equal(_.size(a._listeningTo), 0);
  });

  it("`listenToOnce` without context should clean up references after the event has fired", function() {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    var count = 0;
    a.listenToOnce(b, 'all', function(){ count += 1; });
    b.trigger('anything');
    assert.equal(count, 1);
    assert.equal(_.size(a._listeningTo), 0);
  });

  it("`listenToOnce` with event maps should clean up references", function() {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    a.listenToOnce(b, {
      one: noopFn,
      two: throwsFn
    });
    b.trigger('one');
    assert.equal(_.size(a._listeningTo), 1);
  });

  it("`listenToOnce` with event maps should bind the correct `this`", function() {
    var a = _.extend({}, PubSub);
    var b = _.extend({}, PubSub);
    a.listenToOnce(b, {
      one: function() { assert.ok(this === a); },
      two: throwsFn
    });
    b.trigger('one');
  });

  it("`listenTo` with empty callback sholdn't throw an error", function(){
    var e = _.extend({}, PubSub);
    e.listenTo(e, "foo", null);
    e.trigger("foo");
  });

  it("should trigger all for each event",function() {
    var a, b, obj = { counter: 0 };
    _.extend(obj, PubSub);
    obj.on('all', function(event) {
      obj.counter++;
      if (event == 'a') a = true;
      if (event == 'b') b = true;
    })
    .trigger('a b');
    assert.ok(a);
    assert.ok(b);
    assert.equal(obj.counter, 2);
  });

  it("`off` should unbind all functions", function() {
    var obj = { counter: 0 };
    _.extend(obj, PubSub);
    var callback = function() { obj.counter += 1; };
    obj.on('event', callback);
    obj.trigger('event');
    obj.off('event');
    obj.trigger('event');
    assert.equal(obj.counter, 1, 'counter should have only been incremented once.');
  });

  it("should only unbind passed callback", function() {
    var obj = { counterA: 0, counterB: 0 };
    _.extend(obj,PubSub);
    var callback = function() { obj.counterA += 1; };
    obj.on('event', callback);
    obj.on('event', function() { obj.counterB += 1; });
    obj.trigger('event');
    obj.off('event', callback);
    obj.trigger('event');
    assert.equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    assert.equal(obj.counterB, 2, 'counterB should have been incremented twice.');
  });

  it("should allow unbinding a callback in the midst of it firing", function() {
    var obj = {counter: 0};
    _.extend(obj, PubSub);
    var callback = function() {
      obj.counter += 1;
      obj.off('event', callback);
    };
    obj.on('event', callback);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    assert.equal(obj.counter, 1, 'the callback should have been unbound.');
  });

  it("should allow two binds that unbind themeselves", function() {
    var obj = { counterA: 0, counterB: 0 };
    _.extend(obj,PubSub);
    var incrA = function(){ obj.counterA += 1; obj.off('event', incrA); };
    var incrB = function(){ obj.counterB += 1; obj.off('event', incrB); };
    obj.on('event', incrA);
    obj.on('event', incrB);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    assert.equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    assert.equal(obj.counterB, 1, 'counterB should have only been incremented once.');
  });

  it("should bind a callback with a supplied context", function () {
    var TestClass = function () {
      return this;
    };
    TestClass.prototype.assertTrue = function () {
      assert.ok(true, '`this` was bound to the callback');
    };

    var obj = _.extend({}, PubSub);
    obj.on('event', function () { this.assertTrue(); }, (new TestClass()));
    obj.trigger('event');
  });

  it("should support nested trigger with unbind", function () {
    var obj = { counter: 0 };
    _.extend(obj, PubSub);
    var incr1 = function(){ obj.counter += 1; obj.off('event', incr1); obj.trigger('event'); };
    var incr2 = function(){ obj.counter += 1; };
    obj.on('event', incr1);
    obj.on('event', incr2);
    obj.trigger('event');
    assert.equal(obj.counter, 3, 'counter should have been incremented three times');
  });

  it("should ensure that callback list is not altered during trigger", function () {
    var counter = 0, obj = _.extend({}, PubSub);
    var incr = function(){ counter++; };
    var incrOn = function(){ obj.on('event all', incr); };
    var incrOff = function(){ obj.off('event all', incr); };

    obj.on('event all', incrOn).trigger('event');
    assert.equal(counter, 0, '`on` does not alter callback list');

    obj.off().on('event', incrOff).on('event all', incr).trigger('event');
    assert.equal(counter, 2, '`off` does not alter callback list');
  });

  it("should fix jashkenas/backbone#1282 - `all` callback list is retrieved after each event.", function() {
    var counter = 0;
    var obj = _.extend({}, PubSub);
    var incr = function(){ counter++; };
    obj.on('x', function() {
      obj.on('y', incr).on('all', incr);
    })
    .trigger('x y');
    assert.equal(counter, 2);
  });

  it("if no callback is provided, `on` should be a noop", function() {
    _.extend({}, PubSub).on('test').trigger('test');
  });

  it("if callback is truthy but not a function, `on` should throw an error", function() {
    var view = _.extend({}, PubSub).on('test', 'noop');
    assert.throws(function() {
      view.trigger('test');
    });
  });

  it("should remove all events for a specific context", function() {
    var obj = _.extend({}, PubSub);
    obj.on('x y all', noopFn);
    obj.on('x y all', throwsFn, obj);
    obj.off(null, null, obj);
    obj.trigger('x y');
  });

  it("should remove all events for a specific callback", function() {
    var obj = _.extend({}, PubSub);
    var success = noopFn;
    var fail = throwsFn;
    obj.on('x y all', success);
    obj.on('x y all', fail);
    obj.off(null, fail);
    obj.trigger('x y');
  });

  it("should fix jashkenas/backbone#1310 - `off` does not skip consecutive events", function() {
    var obj = _.extend({}, PubSub);
    obj.on('event', throwsFn, obj);
    obj.on('event', throwsFn, obj);
    obj.off(null, null, obj);
    obj.trigger('event');
  });

  it("should support `once`", function() {
    // Same as the previous test, but we use once rather than having to explicitly unbind
    var obj = { counterA: 0, counterB: 0 };
    _.extend(obj, PubSub);
    var incrA = function(){ obj.counterA += 1; obj.trigger('event'); };
    var incrB = function(){ obj.counterB += 1; };
    obj.once('event', incrA);
    obj.once('event', incrB);
    obj.trigger('event');
    assert.equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    assert.equal(obj.counterB, 1, 'counterB should have only been incremented once.');
  });

  it("should support `once` (variant one)", function() {
    var count = 0;
    var f = function(){ count += 1; };

    var a = _.extend({}, PubSub).once('event', f);
    var b = _.extend({}, PubSub).on('event', f);

    a.trigger('event');

    b.trigger('event');
    b.trigger('event');

    assert.equal(count, 3);
  });

  it("should support `once` (variant two)", function() {
    var count = 0;
    var f = function(){ count += 1; };
    var obj = _.extend({}, PubSub);

    obj
      .once('event', f)
      .on('event', f)
      .trigger('event')
      .trigger('event');

    assert.equal(count, 3);
  });

  it("should support `once` with `off`", function() {
    var count = 0;
    var f = function(){ count += 1; };
    var obj = _.extend({}, PubSub);

    obj.once('event', f);
    obj.off('event', f);
    obj.trigger('event');

    assert.equal(count, 0);
  });

  it("should support `once` with event maps", function() {
    var obj = { counter: 0 };
    _.extend(obj, PubSub);

    var increment = function() {
      this.counter += 1;
    };

    obj.once({
      a: increment,
      b: increment,
      c: increment
    }, obj);

    obj.trigger('a');
    assert.equal(obj.counter, 1);

    obj.trigger('a b');
    assert.equal(obj.counter, 2);

    obj.trigger('c');
    assert.equal(obj.counter, 3);

    obj.trigger('a b c');
    assert.equal(obj.counter, 3);
  });

  it("should support `once` with `off` only by context", function() {
    var context = {};
    var obj = _.extend({}, PubSub);
    obj.once('event', throwsFn, context);
    obj.off(null, null, context);
    obj.trigger('event');
  });

  it("should support `once` with asynchronous events", function(done) {
    var func = _.debounce(function() {
      done();
    }, 50);
    var obj = _.extend({}, PubSub).once('async', func);

    obj.trigger('async');
    obj.trigger('async');
  });

  it("should support `once` with multiple events.", function() {
    var obj = _.extend({}, PubSub);
    var count = 0;
    obj.once('x y', function() { count += 1; });
    obj.trigger('x y');
    assert.equal(count, 2);
  });

  it("should support `off` during iteration with `once`.", function() {
    var obj = _.extend({}, PubSub);
    var f = function(){ this.off('event', f); };
    obj.on('event', f);
    obj.once('event', noopFn);
    obj.on('event', noopFn);

    obj.trigger('event');
    obj.trigger('event');
  });

  it("`once` on `all` should work as expected", function() {
    var obj = _.extend({}, PubSub);
    var count = 0;
    obj.once('all', function() {
      count += 1;
      obj.trigger('all');
    });
    obj.trigger('all');
    assert.equal(count, 1);
  });

  it("once without a callback should be a noop", function() {
    _.extend({}, PubSub).once('event').trigger('event');
  });

  it("listenToOnce without a callback should be a noop", function() {
    var obj = _.extend({}, PubSub);
    obj.listenToOnce(obj, 'event').trigger('event');
  });

  it("event functions should be chainable", function() {
    var obj = _.extend({}, PubSub);
    var obj2 = _.extend({}, PubSub);
    var fn = function() {};
    assert.equal(obj, obj.trigger('noeventssetyet'));
    assert.equal(obj, obj.off('noeventssetyet'));
    assert.equal(obj, obj.stopListening('noeventssetyet'));
    assert.equal(obj, obj.on('a', fn));
    assert.equal(obj, obj.once('c', fn));
    assert.equal(obj, obj.trigger('a'));
    assert.equal(obj, obj.listenTo(obj2, 'a', fn));
    assert.equal(obj, obj.listenToOnce(obj2, 'b', fn));
    assert.equal(obj, obj.off('a c'));
    assert.equal(obj, obj.stopListening(obj2, 'a'));
    assert.equal(obj, obj.stopListening());
  });

  it("should fix jashkenas/backbone#3448 - `listenToOnce` with space-separated events", function() {
    var one = _.extend({}, PubSub);
    var two = _.extend({}, PubSub);
    var count = 1;
    one.listenToOnce(two, 'x y', function(n) { assert.ok(n === count++); });
    two.trigger('x', 1);
    two.trigger('x', 1);
    two.trigger('y', 2);
    two.trigger('y', 2);
  });

});
