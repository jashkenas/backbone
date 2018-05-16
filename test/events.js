(function(QUnit) {
  QUnit.module('Backbone.Events');

  QUnit.test('on and trigger', (assert) => {
    assert.expect(2);
    const obj = {counter: 0};
    _.extend(obj, Backbone.Events);
    obj.on('event', () => { obj.counter += 1; });
    obj.trigger('event');
    assert.equal(obj.counter, 1, 'counter should be incremented.');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    assert.equal(obj.counter, 5, 'counter should be incremented five times.');
  });

  QUnit.test('binding and triggering multiple events', (assert) => {
    assert.expect(4);
    const obj = {counter: 0};
    _.extend(obj, Backbone.Events);

    obj.on('a b c', () => { obj.counter += 1; });

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

  QUnit.test('binding and triggering with event maps', (assert) => {
    const obj = {counter: 0};
    _.extend(obj, Backbone.Events);

    const increment = function() {
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

  QUnit.test('binding and triggering multiple event names with event maps', (assert) => {
    const obj = {counter: 0};
    _.extend(obj, Backbone.Events);

    const increment = function() {
      this.counter += 1;
    };

    obj.on({
      'a b c': increment
    });

    obj.trigger('a');
    assert.equal(obj.counter, 1);

    obj.trigger('a b');
    assert.equal(obj.counter, 3);

    obj.trigger('c');
    assert.equal(obj.counter, 4);

    obj.off({
      'a c': increment
    });
    obj.trigger('a b c');
    assert.equal(obj.counter, 5);
  });

  QUnit.test('binding and trigger with event maps context', function(assert) {
    assert.expect(2);
    const obj = {counter: 0};
    const context = {};
    _.extend(obj, Backbone.Events);

    obj.on({
      a() {
        assert.strictEqual(this, context, 'defaults `context` to `callback` param');
      }
    }, context).trigger('a');

    obj.off().on({
      a() {
        assert.strictEqual(this, context, 'will not override explicit `context` param');
      }
    }, this, context).trigger('a');
  });

  QUnit.test('listenTo and stopListening', (assert) => {
    assert.expect(1);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    a.listenTo(b, 'all', () => { assert.ok(true); });
    b.trigger('anything');
    a.listenTo(b, 'all', () => { assert.ok(false); });
    a.stopListening();
    b.trigger('anything');
  });

  QUnit.test('listenTo and stopListening with event maps', (assert) => {
    assert.expect(4);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    const cb = function() { assert.ok(true); };
    a.listenTo(b, {event: cb});
    b.trigger('event');
    a.listenTo(b, {event2: cb});
    b.on('event2', cb);
    a.stopListening(b, {event2: cb});
    b.trigger('event event2');
    a.stopListening();
    b.trigger('event event2');
  });

  QUnit.test('stopListening with omitted args', (assert) => {
    assert.expect(2);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    const cb = function() { assert.ok(true); };
    a.listenTo(b, 'event', cb);
    b.on('event', cb);
    a.listenTo(b, 'event2', cb);
    a.stopListening(null, {event: cb});
    b.trigger('event event2');
    b.off();
    a.listenTo(b, 'event event2', cb);
    a.stopListening(null, 'event');
    a.stopListening();
    b.trigger('event2');
  });

  QUnit.test('listenToOnce', (assert) => {
    assert.expect(2);
    // Same as the previous test, but we use once rather than having to explicitly unbind
    const obj = {counterA: 0, counterB: 0};
    _.extend(obj, Backbone.Events);
    const incrA = function() { obj.counterA += 1; obj.trigger('event'); };
    const incrB = function() { obj.counterB += 1; };
    obj.listenToOnce(obj, 'event', incrA);
    obj.listenToOnce(obj, 'event', incrB);
    obj.trigger('event');
    assert.equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    assert.equal(obj.counterB, 1, 'counterB should have only been incremented once.');
  });

  QUnit.test('listenToOnce and stopListening', (assert) => {
    assert.expect(1);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    a.listenToOnce(b, 'all', () => { assert.ok(true); });
    b.trigger('anything');
    b.trigger('anything');
    a.listenToOnce(b, 'all', () => { assert.ok(false); });
    a.stopListening();
    b.trigger('anything');
  });

  QUnit.test('listenTo, listenToOnce and stopListening', (assert) => {
    assert.expect(1);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    a.listenToOnce(b, 'all', () => { assert.ok(true); });
    b.trigger('anything');
    b.trigger('anything');
    a.listenTo(b, 'all', () => { assert.ok(false); });
    a.stopListening();
    b.trigger('anything');
  });

  QUnit.test('listenTo and stopListening with event maps', (assert) => {
    assert.expect(1);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    a.listenTo(b, {change() { assert.ok(true); }});
    b.trigger('change');
    a.listenTo(b, {change() { assert.ok(false); }});
    a.stopListening();
    b.trigger('change');
  });

  QUnit.test('listenTo yourself', (assert) => {
    assert.expect(1);
    const e = _.extend({}, Backbone.Events);
    e.listenTo(e, 'foo', () => { assert.ok(true); });
    e.trigger('foo');
  });

  QUnit.test('listenTo yourself cleans yourself up with stopListening', (assert) => {
    assert.expect(1);
    const e = _.extend({}, Backbone.Events);
    e.listenTo(e, 'foo', () => { assert.ok(true); });
    e.trigger('foo');
    e.stopListening();
    e.trigger('foo');
  });

  QUnit.test('stopListening cleans up references', (assert) => {
    assert.expect(12);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    const fn = function() {};
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

  QUnit.test('stopListening cleans up references from listenToOnce', (assert) => {
    assert.expect(12);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    const fn = function() {};
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

  QUnit.test('listenTo and off cleaning up references', (assert) => {
    assert.expect(8);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    const fn = function() {};
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

  QUnit.test('listenTo and stopListening cleaning up references', (assert) => {
    assert.expect(2);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    a.listenTo(b, 'all', () => { assert.ok(true); });
    b.trigger('anything');
    a.listenTo(b, 'other', () => { assert.ok(false); });
    a.stopListening(b, 'other');
    a.stopListening(b, 'all');
    assert.equal(_.size(a._listeningTo), 0);
  });

  QUnit.test('listenToOnce without context cleans up references after the event has fired', (assert) => {
    assert.expect(2);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    a.listenToOnce(b, 'all', () => { assert.ok(true); });
    b.trigger('anything');
    assert.equal(_.size(a._listeningTo), 0);
  });

  QUnit.test('listenToOnce with event maps cleans up references', (assert) => {
    assert.expect(2);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    a.listenToOnce(b, {
      one() { assert.ok(true); },
      two() { assert.ok(false); }
    });
    b.trigger('one');
    assert.equal(_.size(a._listeningTo), 1);
  });

  QUnit.test('listenToOnce with event maps binds the correct `this`', (assert) => {
    assert.expect(1);
    const a = _.extend({}, Backbone.Events);
    const b = _.extend({}, Backbone.Events);
    a.listenToOnce(b, {
      one() { assert.ok(this === a); },
      two() { assert.ok(false); }
    });
    b.trigger('one');
  });

  QUnit.test("listenTo with empty callback doesn't throw an error", (assert) => {
    assert.expect(1);
    const e = _.extend({}, Backbone.Events);
    e.listenTo(e, 'foo', null);
    e.trigger('foo');
    assert.ok(true);
  });

  QUnit.test('trigger all for each event', (assert) => {
    assert.expect(3);
    let a;
    let b;
    const obj = {counter: 0};
    _.extend(obj, Backbone.Events);
    obj.on('all', (event) => {
      obj.counter++;
      if (event === 'a') a = true;
      if (event === 'b') b = true;
    })
      .trigger('a b');
    assert.ok(a);
    assert.ok(b);
    assert.equal(obj.counter, 2);
  });

  QUnit.test('on, then unbind all functions', (assert) => {
    assert.expect(1);
    const obj = {counter: 0};
    _.extend(obj, Backbone.Events);
    const callback = function() { obj.counter += 1; };
    obj.on('event', callback);
    obj.trigger('event');
    obj.off('event');
    obj.trigger('event');
    assert.equal(obj.counter, 1, 'counter should have only been incremented once.');
  });

  QUnit.test('bind two callbacks, unbind only one', (assert) => {
    assert.expect(2);
    const obj = {counterA: 0, counterB: 0};
    _.extend(obj, Backbone.Events);
    const callback = function() { obj.counterA += 1; };
    obj.on('event', callback);
    obj.on('event', () => { obj.counterB += 1; });
    obj.trigger('event');
    obj.off('event', callback);
    obj.trigger('event');
    assert.equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    assert.equal(obj.counterB, 2, 'counterB should have been incremented twice.');
  });

  QUnit.test('unbind a callback in the midst of it firing', (assert) => {
    assert.expect(1);
    const obj = {counter: 0};
    _.extend(obj, Backbone.Events);
    const callback = function() {
      obj.counter += 1;
      obj.off('event', callback);
    };
    obj.on('event', callback);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    assert.equal(obj.counter, 1, 'the callback should have been unbound.');
  });

  QUnit.test('two binds that unbind themeselves', (assert) => {
    assert.expect(2);
    const obj = {counterA: 0, counterB: 0};
    _.extend(obj, Backbone.Events);
    const incrA = function() { obj.counterA += 1; obj.off('event', incrA); };
    const incrB = function() { obj.counterB += 1; obj.off('event', incrB); };
    obj.on('event', incrA);
    obj.on('event', incrB);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    assert.equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    assert.equal(obj.counterB, 1, 'counterB should have only been incremented once.');
  });

  QUnit.test('bind a callback with a default context when none supplied', (assert) => {
    assert.expect(1);
    const obj = _.extend({
      assertTrue() {
        assert.equal(this, obj, '`this` was bound to the callback');
      }
    }, Backbone.Events);

    obj.once('event', obj.assertTrue);
    obj.trigger('event');
  });

  QUnit.test('bind a callback with a supplied context', (assert) => {
    assert.expect(1);
    const TestClass = function() {
      return this;
    };
    TestClass.prototype.assertTrue = function() {
      assert.ok(true, '`this` was bound to the callback');
    };

    const obj = _.extend({}, Backbone.Events);
    obj.on('event', function() { this.assertTrue(); }, new TestClass());
    obj.trigger('event');
  });

  QUnit.test('nested trigger with unbind', (assert) => {
    assert.expect(1);
    const obj = {counter: 0};
    _.extend(obj, Backbone.Events);
    const incr1 = function() { obj.counter += 1; obj.off('event', incr1); obj.trigger('event'); };
    const incr2 = function() { obj.counter += 1; };
    obj.on('event', incr1);
    obj.on('event', incr2);
    obj.trigger('event');
    assert.equal(obj.counter, 3, 'counter should have been incremented three times');
  });

  QUnit.test('callback list is not altered during trigger', (assert) => {
    assert.expect(2);
    let counter = 0;
    const obj = _.extend({}, Backbone.Events);
    const incr = function() { counter++; };
    const incrOn = function() { obj.on('event all', incr); };
    const incrOff = function() { obj.off('event all', incr); };

    obj.on('event all', incrOn).trigger('event');
    assert.equal(counter, 0, 'on does not alter callback list');

    obj.off().on('event', incrOff).on('event all', incr).trigger('event');
    assert.equal(counter, 2, 'off does not alter callback list');
  });

  QUnit.test("#1282 - 'all' callback list is retrieved after each event.", (assert) => {
    assert.expect(1);
    let counter = 0;
    const obj = _.extend({}, Backbone.Events);
    const incr = function() { counter++; };
    obj.on('x', () => {
      obj.on('y', incr).on('all', incr);
    })
      .trigger('x y');
    assert.strictEqual(counter, 2);
  });

  QUnit.test('if no callback is provided, `on` is a noop', (assert) => {
    assert.expect(0);
    _.extend({}, Backbone.Events).on('test').trigger('test');
  });

  QUnit.test('if callback is truthy but not a function, `on` should throw an error just like jQuery', (assert) => {
    assert.expect(1);
    const view = _.extend({}, Backbone.Events).on('test', 'noop');
    assert.raises(() => {
      view.trigger('test');
    });
  });

  QUnit.test('remove all events for a specific context', (assert) => {
    assert.expect(4);
    const obj = _.extend({}, Backbone.Events);
    obj.on('x y all', () => { assert.ok(true); });
    obj.on('x y all', () => { assert.ok(false); }, obj);
    obj.off(null, null, obj);
    obj.trigger('x y');
  });

  QUnit.test('remove all events for a specific callback', (assert) => {
    assert.expect(4);
    const obj = _.extend({}, Backbone.Events);
    const success = function() { assert.ok(true); };
    const fail = function() { assert.ok(false); };
    obj.on('x y all', success);
    obj.on('x y all', fail);
    obj.off(null, fail);
    obj.trigger('x y');
  });

  QUnit.test('#1310 - off does not skip consecutive events', (assert) => {
    assert.expect(0);
    const obj = _.extend({}, Backbone.Events);
    obj.on('event', () => { assert.ok(false); }, obj);
    obj.on('event', () => { assert.ok(false); }, obj);
    obj.off(null, null, obj);
    obj.trigger('event');
  });

  QUnit.test('once', (assert) => {
    assert.expect(2);
    // Same as the previous test, but we use once rather than having to explicitly unbind
    const obj = {counterA: 0, counterB: 0};
    _.extend(obj, Backbone.Events);
    const incrA = function() { obj.counterA += 1; obj.trigger('event'); };
    const incrB = function() { obj.counterB += 1; };
    obj.once('event', incrA);
    obj.once('event', incrB);
    obj.trigger('event');
    assert.equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    assert.equal(obj.counterB, 1, 'counterB should have only been incremented once.');
  });

  QUnit.test('once letiant one', (assert) => {
    assert.expect(3);
    const f = function() { assert.ok(true); };

    const a = _.extend({}, Backbone.Events).once('event', f);
    const b = _.extend({}, Backbone.Events).on('event', f);

    a.trigger('event');

    b.trigger('event');
    b.trigger('event');
  });

  QUnit.test('once letiant two', (assert) => {
    assert.expect(3);
    const f = function() { assert.ok(true); };
    const obj = _.extend({}, Backbone.Events);

    obj
      .once('event', f)
      .on('event', f)
      .trigger('event')
      .trigger('event');
  });

  QUnit.test('once with off', (assert) => {
    assert.expect(0);
    const f = function() { assert.ok(true); };
    const obj = _.extend({}, Backbone.Events);

    obj.once('event', f);
    obj.off('event', f);
    obj.trigger('event');
  });

  QUnit.test('once with event maps', (assert) => {
    const obj = {counter: 0};
    _.extend(obj, Backbone.Events);

    const increment = function() {
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

  QUnit.test('bind a callback with a supplied context using once with object notation', (assert) => {
    assert.expect(1);
    const obj = {counter: 0};
    const context = {};
    _.extend(obj, Backbone.Events);

    obj.once({
      a() {
        assert.strictEqual(this, context, 'defaults `context` to `callback` param');
      }
    }, context).trigger('a');
  });

  QUnit.test('once with off only by context', (assert) => {
    assert.expect(0);
    const context = {};
    const obj = _.extend({}, Backbone.Events);
    obj.once('event', () => { assert.ok(false); }, context);
    obj.off(null, null, context);
    obj.trigger('event');
  });

  QUnit.test('Backbone object inherits Events', (assert) => {
    assert.ok(Backbone.on === Backbone.Events.on);
  });

  QUnit.test('once with asynchronous events', (assert) => {
    const done = assert.async();
    assert.expect(1);
    const func = _.debounce(() => { assert.ok(true); done(); }, 50);
    const obj = _.extend({}, Backbone.Events).once('async', func);

    obj.trigger('async');
    obj.trigger('async');
  });

  QUnit.test('once with multiple events.', (assert) => {
    assert.expect(2);
    const obj = _.extend({}, Backbone.Events);
    obj.once('x y', () => { assert.ok(true); });
    obj.trigger('x y');
  });

  QUnit.test('Off during iteration with once.', (assert) => {
    assert.expect(2);
    const obj = _.extend({}, Backbone.Events);
    const f = function() { this.off('event', f); };
    obj.on('event', f);
    obj.once('event', () => {});
    obj.on('event', () => { assert.ok(true); });

    obj.trigger('event');
    obj.trigger('event');
  });

  QUnit.test('`once` on `all` should work as expected', (assert) => {
    assert.expect(1);
    Backbone.once('all', () => {
      assert.ok(true);
      Backbone.trigger('all');
    });
    Backbone.trigger('all');
  });

  QUnit.test('once without a callback is a noop', (assert) => {
    assert.expect(0);
    _.extend({}, Backbone.Events).once('event').trigger('event');
  });

  QUnit.test('listenToOnce without a callback is a noop', (assert) => {
    assert.expect(0);
    const obj = _.extend({}, Backbone.Events);
    obj.listenToOnce(obj, 'event').trigger('event');
  });

  QUnit.test('event functions are chainable', (assert) => {
    const obj = _.extend({}, Backbone.Events);
    const obj2 = _.extend({}, Backbone.Events);
    const fn = function() {};
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

  QUnit.test('#3448 - listenToOnce with space-separated events', (assert) => {
    assert.expect(2);
    const one = _.extend({}, Backbone.Events);
    const two = _.extend({}, Backbone.Events);
    let count = 1;
    one.listenToOnce(two, 'x y', (n) => { assert.ok(n === count++); });
    two.trigger('x', 1);
    two.trigger('x', 1);
    two.trigger('y', 2);
    two.trigger('y', 2);
  });

  QUnit.test('#3611 - listenTo is compatible with non-Backbone event libraries', (assert) => {
    const obj = _.extend({}, Backbone.Events);
    const other = {
      events: {},
      on(name, callback) {
        this.events[name] = callback;
      },
      trigger(name) {
        this.events[name]();
      }
    };

    obj.listenTo(other, 'test', () => { assert.ok(true); });
    other.trigger('test');
  });

  QUnit.test('#3611 - stopListening is compatible with non-Backbone event libraries', (assert) => {
    const obj = _.extend({}, Backbone.Events);
    const other = {
      events: {},
      on(name, callback) {
        this.events[name] = callback;
      },
      off() {
        this.events = {};
      },
      trigger(name) {
        const fn = this.events[name];
        if (fn) fn();
      }
    };

    obj.listenTo(other, 'test', () => { assert.ok(false); });
    obj.stopListening(other);
    other.trigger('test');
    assert.equal(_.size(obj._listeningTo), 0);
  });
})(QUnit);
