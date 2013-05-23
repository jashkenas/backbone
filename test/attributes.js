$(document).ready(function() {

  var doc;

  module("Backbone.Attributes", _.extend(new Environment, {

    setup: function() {
      Environment.prototype.setup.apply(this, arguments);
      doc = {
        attributes: {
          id     : '1-the-tempest',
          title  : "The Tempest",
          author : "Bill Shakespeare",
          length : 123
        }
      };
      _.extend(doc, Backbone.Attributes);
    }

  }));

  test("get", 2, function() {
    equal(doc.get('title'), 'The Tempest');
    equal(doc.get('author'), 'Bill Shakespeare');
  });

  test("has", 10, function() {
    var obj = _.extend({}, Backbone.Attributes);

    strictEqual(obj.has('name'), false);

    obj.set({
      '0': 0,
      '1': 1,
      'true': true,
      'false': false,
      'empty': '',
      'name': 'name',
      'null': null,
      'undefined': undefined
    });

    strictEqual(obj.has('0'), true);
    strictEqual(obj.has('1'), true);
    strictEqual(obj.has('true'), true);
    strictEqual(obj.has('false'), true);
    strictEqual(obj.has('empty'), true);
    strictEqual(obj.has('name'), true);

    obj.unset('name');

    strictEqual(obj.has('name'), false);
    strictEqual(obj.has('null'), false);
    strictEqual(obj.has('undefined'), false);
  });

  test("set and unset", 5, function() {
    var a = _.extend({attributes: {id: 'id', foo: 1, bar: 2, baz: 3}}, Backbone.Attributes);
    var changeCount = 0;
    a.on("change:foo", function() { changeCount += 1; });
    a.set({'foo': 2});
    ok(a.get('foo') == 2, "Foo should have changed.");
    ok(changeCount == 1, "Change count should have incremented.");
    a.set({'foo': 2}); // set with value that is not new shouldn't fire change event
    ok(a.get('foo') == 2, "Foo should NOT have changed, still 2");
    ok(changeCount == 1, "Change count should NOT have incremented.");

    a.unset('id');
    equal(a.id, undefined, "Unsetting the id should remove the id property.");
  });

  test("set triggers changes in the correct order", function() {
    var value = null;
    var obj = _.extend({}, Backbone.Attributes);
    obj.on('last', function(){ value = 'last'; });
    obj.on('first', function(){ value = 'first'; });
    obj.trigger('first');
    obj.trigger('last');
    equal(value, 'last');
  });

  test("set falsy values in the correct order", 2, function() {
    var obj = _.extend({attributes: {result: 'result'}}, Backbone.Attributes);
    obj.on('change', function() {
      equal(obj.changed.result, void 0);
      equal(obj.previous('result'), false);
    });
    obj.set({result: void 0}, {silent: true});
    obj.set({result: null}, {silent: true});
    obj.set({result: false}, {silent: true});
    obj.set({result: void 0});
  });

  test("multiple unsets", 1, function() {
    var i = 0;
    var counter = function(){ i++; };
    var obj = _.extend({attributes: {a: 1}}, Backbone.Attributes);
    obj.on("change:a", counter);
    obj.set({a: 2});
    obj.unset('a');
    obj.unset('a');
    equal(i, 2, 'Unset does not fire an event for missing attributes.');
  });

  test("unset and changedAttributes", 1, function() {
    var obj = _.extend({attributes: {a: 1}}, Backbone.Attributes);
    obj.on('change', function() {
      ok('a' in obj.changedAttributes(), 'changedAttributes should contain unset properties');
    });
    obj.unset('a');
  });

  test("set an empty string", 1, function() {
    var obj = _.extend({attributes: {name : "Model"}}, Backbone.Attributes);
    obj.set({name : ''});
    equal(obj.get('name'), '');
  });

  test("setting an object", 1, function() {
    var obj = _.extend({attributes: {custom: { foo: 1 }}}, Backbone.Attributes);
    obj.on('change', function() {
      ok(1);
    });
    obj.set({
      custom: { foo: 1 } // no change should be fired
    });
    obj.set({
      custom: { foo: 2 } // change event should be fired
    });
  });

  test("clear", 3, function() {
    var changed;
    var obj = _.extend({attributes: {id: 1, name : "Model"}}, Backbone.Attributes);
    obj.on("change:name", function(){ changed = true; });
    obj.on("change", function() {
      var changedAttrs = obj.changedAttributes();
      ok('name' in changedAttrs);
    });
    obj.clear();
    equal(changed, true);
    equal(obj.get('name'), undefined);
  });

  test("change, hasChanged, changedAttributes, previous, previousAttributes", 9, function() {
    var obj = _.extend({attributes: {name: "Tim", age: 10}}, Backbone.Attributes);
    deepEqual(obj.changedAttributes(), false);
    obj.on('change', function() {
      ok(obj.hasChanged('name'), 'name changed');
      ok(!obj.hasChanged('age'), 'age did not');
      ok(_.isEqual(obj.changedAttributes(), {name : 'Rob'}), 'changedAttributes returns the changed attrs');
      equal(obj.previous('name'), 'Tim');
      ok(_.isEqual(obj.previousAttributes(), {name : "Tim", age : 10}), 'previousAttributes is correct');
    });
    equal(obj.hasChanged(), false);
    equal(obj.hasChanged(undefined), false);
    obj.set({name : 'Rob'});
    equal(obj.get('name'), 'Rob');
  });

  test("changedAttributes", 3, function() {
    var obj = _.extend({attributes: {a: 'a', b: 'b'}}, Backbone.Attributes);
    deepEqual(obj.changedAttributes(), false);
    equal(obj.changedAttributes({a: 'a'}), false);
    equal(obj.changedAttributes({a: 'b'}).a, 'b');
  });

  test("change with options", 2, function() {
    var value;
    var obj = _.extend({attributes: {name: 'Rob'}}, Backbone.Attributes);
    obj.on('change', function(obj, options) {
      value = options.prefix + obj.get('name');
    });
    obj.set({name: 'Bob'}, {prefix: 'Mr. '});
    equal(value, 'Mr. Bob');
    obj.set({name: 'Sue'}, {prefix: 'Ms. '});
    equal(value, 'Ms. Sue');
  });

  test("Nested change events don't clobber previous attributes", 4, function() {
    _.extend({}, Backbone.Attributes)
    .on('change:state', function(obj, newState) {
      equal(obj.previous('state'), undefined);
      equal(newState, 'hello');
      // Fire a nested change event.
      obj.set({other: 'whatever'});
    })
    .on('change:state', function(obj, newState) {
      equal(obj.previous('state'), undefined);
      equal(newState, 'hello');
    })
    .set({state: 'hello'});
  });

  test("hasChanged/set should use same comparison", 2, function() {
    var changed = 0, obj = _.extend({attributes: {a: null}}, Backbone.Attributes);
    obj.on('change', function() {
      ok(this.hasChanged('a'));
    })
    .on('change:a', function() {
      changed++;
    })
    .set({a: undefined});
    equal(changed, 1);
  });

  test("#582, #425, change:attribute callbacks should fire after all changes have occurred", 9, function() {
    var obj = _.extend({}, Backbone.Attributes);

    var assertion = function() {
      equal(obj.get('a'), 'a');
      equal(obj.get('b'), 'b');
      equal(obj.get('c'), 'c');
    };

    obj.on('change:a', assertion);
    obj.on('change:b', assertion);
    obj.on('change:c', assertion);

    obj.set({a: 'a', b: 'b', c: 'c'});
  });

  test("#871, set with attributes property", 1, function() {
    var obj = _.extend({}, Backbone.Attributes);
    obj.set({attributes: true});
    ok(obj.has('attributes'));
  });

  test("set value regardless of equality/change", 1, function() {
    var obj = _.extend({attributes: {x: []}}, Backbone.Attributes);
    var a = [];
    obj.set({x: a});
    ok(obj.get('x') === a);
  });

  test("set same value does not trigger change", 0, function() {
    var obj = _.extend({attributes: {x: 1}}, Backbone.Attributes);
    obj.on('change change:x', function() { ok(false); });
    obj.set({x: 1});
    obj.set({x: 1});
  });

  test("unset does not fire a change for undefined attributes", 0, function() {
    var obj = _.extend({attributes: {x: undefined}}, Backbone.Attributes);
    obj.on('change:x', function(){ ok(false); });
    obj.unset('x');
  });

  test("set: undefined values", 1, function() {
    var obj = _.extend({attributes: {x: undefined}}, Backbone.Attributes);
    ok('x' in obj.attributes);
  });

  test("hasChanged works outside of change events, and true within", 6, function() {
    var obj = _.extend({attributes: {x: 1}}, Backbone.Attributes);
    obj.on('change:x', function() {
      ok(obj.hasChanged('x'));
      equal(obj.get('x'), 1);
    });
    obj.set({x: 2}, {silent: true});
    ok(obj.hasChanged());
    equal(obj.hasChanged('x'), true);
    obj.set({x: 1});
    ok(obj.hasChanged());
    equal(obj.hasChanged('x'), true);
  });

  test("hasChanged gets cleared on the following set", 4, function() {
    var obj = _.extend({}, Backbone.Attributes)
    obj.set({x: 1});
    ok(obj.hasChanged());
    obj.set({x: 1});
    ok(!obj.hasChanged());
    obj.set({x: 2});
    ok(obj.hasChanged());
    obj.set({});
    ok(!obj.hasChanged());
  });

  test("`hasChanged` for falsey keys", 2, function() {
    var obj = _.extend({}, Backbone.Attributes);
    obj.set({x: true}, {silent: true});
    ok(!obj.hasChanged(0));
    ok(!obj.hasChanged(''));
  });

  test("`previous` for falsey keys", 2, function() {
    var obj = _.extend({attributes: {0: true, '': true}}, Backbone.Attributes);
    obj.set({0: false, '': false}, {silent: true});
    equal(obj.previous(0), true);
    equal(obj.previous(''), true);
  });

  test("nested `set` during `'change:attr'`", 2, function() {
    var events = [];
    var obj = _.extend({}, Backbone.Attributes);
    obj.on('all', function(event) { events.push(event); });
    obj.on('change', function() {
      obj.set({z: true}, {silent:true});
    });
    obj.on('change:x', function() {
      obj.set({y: true});
    });
    obj.set({x: true});
    deepEqual(events, ['change:y', 'change:x', 'change']);
    events = [];
    obj.set({z: true});
    deepEqual(events, []);
  });

  test("nested `change` only fires once", 1, function() {
    var obj = _.extend({}, Backbone.Attributes)
    obj.on('change', function() {
      ok(true);
      obj.set({x: true});
    });
    obj.set({x: true});
  });

  test("nested `set` during `'change'`", 6, function() {
    var count = 0;
    var obj = _.extend({}, Backbone.Attributes);
    obj.on('change', function() {
      switch(count++) {
        case 0:
          deepEqual(this.changedAttributes(), {x: true});
          equal(obj.previous('x'), undefined);
          obj.set({y: true});
          break;
        case 1:
          deepEqual(this.changedAttributes(), {x: true, y: true});
          equal(obj.previous('x'), undefined);
          obj.set({z: true});
          break;
        case 2:
          deepEqual(this.changedAttributes(), {x: true, y: true, z: true});
          equal(obj.previous('y'), undefined);
          break;
        default:
          ok(false);
      }
    });
    obj.set({x: true});
  });

  test("nested `change` with silent", 3, function() {
    var count = 0;
    var obj = _.extend({}, Backbone.Attributes);
    obj.on('change:y', function() { ok(false); });
    obj.on('change', function() {
      switch(count++) {
        case 0:
          deepEqual(this.changedAttributes(), {x: true});
          obj.set({y: true}, {silent: true});
          obj.set({z: true});
          break;
        case 1:
          deepEqual(this.changedAttributes(), {x: true, y: true, z: true});
          break;
        case 2:
          deepEqual(this.changedAttributes(), {z: false});
          break;
        default:
          ok(false);
      }
    });
    obj.set({x: true});
    obj.set({z: false});
  });

  test("nested `change:attr` with silent", 0, function() {
    var obj = _.extend({}, Backbone.Attributes);
    obj.on('change:y', function(){ ok(false); });
    obj.on('change', function() {
      obj.set({y: true}, {silent: true});
      obj.set({z: true});
    });
    obj.set({x: true});
  });

  test("multiple nested changes with silent", 1, function() {
    var obj = _.extend({}, Backbone.Attributes);
    obj.on('change:x', function() {
      obj.set({y: 1}, {silent: true});
      obj.set({y: 2});
    });
    obj.on('change:y', function(obj, val) {
      equal(val, 2);
    });
    obj.set({x: true});
  });

  test("multiple nested changes with silent", 1, function() {
    var changes = [];
    var obj = _.extend({}, Backbone.Attributes);
    obj.on('change:b', function(obj, val) { changes.push(val); });
    obj.on('change', function() {
      obj.set({b: 1});
    });
    obj.set({b: 0});
    deepEqual(changes, [0, 1]);
  });

  test("basic silent change semantics", 1, function() {
    var obj = _.extend({}, Backbone.Attributes);
    obj.set({x: 1});
    obj.on('change', function(){ ok(true); });
    obj.set({x: 2}, {silent: true});
    obj.set({x: 1});
  });

  test("nested set multiple times", 1, function() {
    var obj = _.extend({}, Backbone.Attributes);
    obj.on('change:b', function() {
      ok(true);
    });
    obj.on('change:a', function() {
      obj.set({b: true});
      obj.set({b: true});
    });
    obj.set({a: true});
  });

  test("#1122 - clear does not alter options.", 1, function() {
    var obj = _.extend({}, Backbone.Attributes);
    var options = {};
    obj.clear(options);
    ok(!options.unset);
  });

  test("#1122 - unset does not alter options.", 1, function() {
    var obj = _.extend({}, Backbone.Attributes);
    var options = {};
    obj.unset('x', options);
    ok(!options.unset);
  });

  test("#1664 - Changing from one value, silently to another, back to original triggers a change.", 1, function() {
    var obj = _.extend({attributes: {x:1}}, Backbone.Attributes);
    obj.on('change:x', function() { ok(true); });
    obj.set({x:2},{silent:true});
    obj.set({x:3},{silent:true});
    obj.set({x:1});
  });

  test("#1664 - multiple silent changes nested inside a change event", 2, function() {
    var changes = [];
    var obj = _.extend({}, Backbone.Attributes);
    obj.on('change', function() {
      obj.set({a:'c'}, {silent:true});
      obj.set({b:2}, {silent:true});
      obj.unset('c', {silent:true});
    });
    obj.on('change:a change:b change:c', function(obj, val) { changes.push(val); });
    obj.set({a:'a', b:1, c:'item'});
    deepEqual(changes, ['a',1,'item']);
    deepEqual(obj.attributes, {a: 'c', b: 2});
  });

  test("silent changes in last `change` event back to original triggers change", 2, function() {
    var changes = [];
    var obj = _.extend({}, Backbone.Attributes);
    obj.on('change:a change:b change:c', function(obj, val) { changes.push(val); });
    obj.on('change', function() {
      obj.set({a:'c'}, {silent:true});
    });
    obj.set({a:'a'});
    deepEqual(changes, ['a']);
    obj.set({a:'a'});
    deepEqual(changes, ['a', 'a']);
  });

  test("#1943 change calculations should use _.isEqual", function() {
    var obj = _.extend({attributes: {a: {key: 'value'}}}, Backbone.Attributes);
    obj.set('a', {key:'value'}, {silent:true});
    equal(obj.changedAttributes(), false);
  });

  test("#1964 - final `change` event is always fired, regardless of interim changes", 1, function () {
    var obj = _.extend({}, Backbone.Attributes);
    obj.on('change:property', function() {
      obj.set('property', 'bar');
    });
    obj.on('change', function() {
      ok(true);
    });
    obj.set('property', 'foo');
  });

  test("#2034 - nested set with silent only triggers one change", 1, function() {
    var obj = _.extend({}, Backbone.Attributes);
    obj.on('change', function() {
      obj.set({b: true}, {silent: true});
      ok(true);
    });
    obj.set({a: true});
  });

});
