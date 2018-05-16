(function(QUnit) {
  const ProxyModel = Backbone.Model.extend();
  const Klass = Backbone.Collection.extend({
    url() { return '/collection'; }
  });
  let doc, collection;

  QUnit.module('Backbone.Model', {

    beforeEach(assert) {
      doc = new ProxyModel({
        id: '1-the-tempest',
        title: 'The Tempest',
        author: 'Bill Shakespeare',
        length: 123
      });
      collection = new Klass();
      collection.add(doc);
    }

  });

  QUnit.test('initialize', (assert) => {
    assert.expect(3);
    const Model = Backbone.Model.extend({
      initialize() {
        this.one = 1;
        assert.equal(this.collection, collection);
      }
    });
    const model = new Model({}, {collection});
    assert.equal(model.one, 1);
    assert.equal(model.collection, collection);
  });

  QUnit.test('Object.prototype properties are overridden by attributes', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model({hasOwnProperty: true});
    assert.equal(model.get('hasOwnProperty'), true);
  });

  QUnit.test('initialize with attributes and options', (assert) => {
    assert.expect(1);
    const Model = Backbone.Model.extend({
      initialize(attributes, options) {
        this.one = options.one;
      }
    });
    const model = new Model({}, {one: 1});
    assert.equal(model.one, 1);
  });

  QUnit.test('initialize with parsed attributes', (assert) => {
    assert.expect(1);
    const Model = Backbone.Model.extend({
      parse(attrs) {
        attrs.value += 1;
        return attrs;
      }
    });
    const model = new Model({value: 1}, {parse: true});
    assert.equal(model.get('value'), 2);
  });

  QUnit.test('preinitialize', (assert) => {
    assert.expect(2);
    const Model = Backbone.Model.extend({

      preinitialize() {
        this.one = 1;
      }
    });
    const model = new Model({}, {collection});
    assert.equal(model.one, 1);
    assert.equal(model.collection, collection);
  });

  QUnit.test('preinitialize occurs before the model is set up', (assert) => {
    assert.expect(6);
    const Model = Backbone.Model.extend({

      preinitialize() {
        assert.equal(this.collection, undefined);
        assert.equal(this.cid, undefined);
        assert.equal(this.id, undefined);
      }
    });
    const model = new Model({id: 'foo'}, {collection});
    assert.equal(model.collection, collection);
    assert.equal(model.id, 'foo');
    assert.notEqual(model.cid, undefined);
  });

  QUnit.test('parse can return null', (assert) => {
    assert.expect(1);
    const Model = Backbone.Model.extend({
      parse(attrs) {
        attrs.value += 1;
        return null;
      }
    });
    const model = new Model({value: 1}, {parse: true});
    assert.equal(JSON.stringify(model.toJSON()), '{}');
  });

  QUnit.test('url', (assert) => {
    assert.expect(3);
    doc.urlRoot = null;
    assert.equal(doc.url(), '/collection/1-the-tempest');
    doc.collection.url = '/collection/';
    assert.equal(doc.url(), '/collection/1-the-tempest');
    doc.collection = null;
    assert.raises(() => { doc.url(); });
    doc.collection = collection;
  });

  QUnit.test('url when using urlRoot, and uri encoding', (assert) => {
    assert.expect(2);
    const Model = Backbone.Model.extend({
      urlRoot: '/collection'
    });
    const model = new Model();
    assert.equal(model.url(), '/collection');
    model.set({id: '+1+'});
    assert.equal(model.url(), '/collection/%2B1%2B');
  });

  QUnit.test('url when using urlRoot as a function to determine urlRoot at runtime', (assert) => {
    assert.expect(2);
    const Model = Backbone.Model.extend({
      urlRoot() {
        return `/nested/${this.get('parentId')}/collection`;
      }
    });

    const model = new Model({parentId: 1});
    assert.equal(model.url(), '/nested/1/collection');
    model.set({id: 2});
    assert.equal(model.url(), '/nested/1/collection/2');
  });

  QUnit.test('underscore methods', (assert) => {
    assert.expect(5);
    const model = new Backbone.Model({foo: 'a', bar: 'b', baz: 'c'});
    const model2 = model.clone();
    assert.deepEqual(model.keys(), ['foo', 'bar', 'baz']);
    assert.deepEqual(model.values(), ['a', 'b', 'c']);
    assert.deepEqual(model.invert(), {a: 'foo', b: 'bar', c: 'baz'});
    assert.deepEqual(model.pick('foo', 'baz'), {foo: 'a', baz: 'c'});
    assert.deepEqual(model.omit('foo', 'bar'), {baz: 'c'});
  });

  QUnit.test('chain', (assert) => {
    const model = new Backbone.Model({a: 0, b: 1, c: 2});
    assert.deepEqual(model.chain().pick('a', 'b', 'c').values().compact().value(), [1, 2]);
  });

  QUnit.test('clone', (assert) => {
    assert.expect(10);
    const a = new Backbone.Model({foo: 1, bar: 2, baz: 3});
    const b = a.clone();
    assert.equal(a.get('foo'), 1);
    assert.equal(a.get('bar'), 2);
    assert.equal(a.get('baz'), 3);
    assert.equal(b.get('foo'), a.get('foo'), 'Foo should be the same on the clone.');
    assert.equal(b.get('bar'), a.get('bar'), 'Bar should be the same on the clone.');
    assert.equal(b.get('baz'), a.get('baz'), 'Baz should be the same on the clone.');
    a.set({foo: 100});
    assert.equal(a.get('foo'), 100);
    assert.equal(b.get('foo'), 1, 'Changing a parent attribute does not change the clone.');

    const foo = new Backbone.Model({p: 1});
    const bar = new Backbone.Model({p: 2});
    bar.set(foo.clone().attributes, {unset: true});
    assert.equal(foo.get('p'), 1);
    assert.equal(bar.get('p'), undefined);
  });

  QUnit.test('isNew', (assert) => {
    assert.expect(6);
    let a = new Backbone.Model({foo: 1, bar: 2, baz: 3});
    assert.ok(a.isNew(), 'it should be new');
    a = new Backbone.Model({foo: 1, bar: 2, baz: 3, id: -5});
    assert.ok(!a.isNew(), 'any defined ID is legal, negative or positive');
    a = new Backbone.Model({foo: 1, bar: 2, baz: 3, id: 0});
    assert.ok(!a.isNew(), 'any defined ID is legal, including zero');
    assert.ok(new Backbone.Model().isNew(), 'is true when there is no id');
    assert.ok(!new Backbone.Model({id: 2}).isNew(), 'is false for a positive integer');
    assert.ok(!new Backbone.Model({id: -5}).isNew(), 'is false for a negative integer');
  });

  QUnit.test('get', (assert) => {
    assert.expect(2);
    assert.equal(doc.get('title'), 'The Tempest');
    assert.equal(doc.get('author'), 'Bill Shakespeare');
  });

  QUnit.test('escape', (assert) => {
    assert.expect(5);
    assert.equal(doc.escape('title'), 'The Tempest');
    doc.set({audience: 'Bill & Bob'});
    assert.equal(doc.escape('audience'), 'Bill &amp; Bob');
    doc.set({audience: 'Tim > Joan'});
    assert.equal(doc.escape('audience'), 'Tim &gt; Joan');
    doc.set({audience: 10101});
    assert.equal(doc.escape('audience'), '10101');
    doc.unset('audience');
    assert.equal(doc.escape('audience'), '');
  });

  QUnit.test('has', (assert) => {
    assert.expect(10);
    const model = new Backbone.Model();

    assert.strictEqual(model.has('name'), false);

    model.set({
      0: 0,
      1: 1,
      true: true,
      false: false,
      empty: '',
      name: 'name',
      null: null,
      undefined
    });

    assert.strictEqual(model.has('0'), true);
    assert.strictEqual(model.has('1'), true);
    assert.strictEqual(model.has('true'), true);
    assert.strictEqual(model.has('false'), true);
    assert.strictEqual(model.has('empty'), true);
    assert.strictEqual(model.has('name'), true);

    model.unset('name');

    assert.strictEqual(model.has('name'), false);
    assert.strictEqual(model.has('null'), false);
    assert.strictEqual(model.has('undefined'), false);
  });

  QUnit.test('matches', (assert) => {
    assert.expect(4);
    const model = new Backbone.Model();

    assert.strictEqual(model.matches({name: 'Jonas', cool: true}), false);

    model.set({name: 'Jonas', cool: true});

    assert.strictEqual(model.matches({name: 'Jonas'}), true);
    assert.strictEqual(model.matches({name: 'Jonas', cool: true}), true);
    assert.strictEqual(model.matches({name: 'Jonas', cool: false}), false);
  });

  QUnit.test('matches with predicate', (assert) => {
    const model = new Backbone.Model({a: 0});

    assert.strictEqual(model.matches((attr) => {
      return attr.a > 1 && attr.b != null;
    }), false);

    model.set({a: 3, b: true});

    assert.strictEqual(model.matches((attr) => {
      return attr.a > 1 && attr.b != null;
    }), true);
  });

  QUnit.test('set and unset', (assert) => {
    assert.expect(8);
    const a = new Backbone.Model({id: 'id', foo: 1, bar: 2, baz: 3});
    let changeCount = 0;
    a.on('change:foo', () => { changeCount += 1; });
    a.set({foo: 2});
    assert.equal(a.get('foo'), 2, 'Foo should have changed.');
    assert.equal(changeCount, 1, 'Change count should have incremented.');
    // set with value that is not new shouldn't fire change event
    a.set({foo: 2});
    assert.equal(a.get('foo'), 2, 'Foo should NOT have changed, still 2');
    assert.equal(changeCount, 1, 'Change count should NOT have incremented.');

    a.validate = function(attrs) {
      assert.equal(attrs.foo, void 0, 'validate:true passed while unsetting');
    };
    a.unset('foo', {validate: true});
    assert.equal(a.get('foo'), void 0, 'Foo should have changed');
    delete a.validate;
    assert.equal(changeCount, 2, 'Change count should have incremented for unset.');

    a.unset('id');
    assert.equal(a.id, undefined, 'Unsetting the id should remove the id property.');
  });

  QUnit.test('#2030 - set with failed validate, followed by another set triggers change', (assert) => {
    let attr = 0;
    let main = 0;
    let error = 0;
    const Model = Backbone.Model.extend({
      validate(attrs) {
        if (attrs.x > 1) {
          error++;
          return 'this is an error';
        }
      }
    });
    const model = new Model({x: 0});
    model.on('change:x', () => { attr++; });
    model.on('change', () => { main++; });
    model.set({x: 2}, {validate: true});
    model.set({x: 1}, {validate: true});
    assert.deepEqual([attr, main, error], [1, 1, 1]);
  });

  QUnit.test('set triggers changes in the correct order', (assert) => {
    let value = null;
    const model = new Backbone.Model();
    model.on('last', () => { value = 'last'; });
    model.on('first', () => { value = 'first'; });
    model.trigger('first');
    model.trigger('last');
    assert.equal(value, 'last');
  });

  QUnit.test('set falsy values in the correct order', (assert) => {
    assert.expect(2);
    const model = new Backbone.Model({result: 'result'});
    model.on('change', () => {
      assert.equal(model.changed.result, void 0);
      assert.equal(model.previous('result'), false);
    });
    model.set({result: void 0}, {silent: true});
    model.set({result: null}, {silent: true});
    model.set({result: false}, {silent: true});
    model.set({result: void 0});
  });

  QUnit.test('nested set triggers with the correct options', (assert) => {
    const model = new Backbone.Model();
    const o1 = {};
    const o2 = {};
    const o3 = {};
    model.on('change', (__, options) => {
      switch (model.get('a')) {
      case 1:
        assert.equal(options, o1);
        return model.set('a', 2, o2);
      case 2:
        assert.equal(options, o2);
        return model.set('a', 3, o3);
      case 3:
        assert.equal(options, o3);
      }
    });
    model.set('a', 1, o1);
  });

  QUnit.test('multiple unsets', (assert) => {
    assert.expect(1);
    let i = 0;
    const counter = function() { i++; };
    const model = new Backbone.Model({a: 1});
    model.on('change:a', counter);
    model.set({a: 2});
    model.unset('a');
    model.unset('a');
    assert.equal(i, 2, 'Unset does not fire an event for missing attributes.');
  });

  QUnit.test('unset and changedAttributes', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model({a: 1});
    model.on('change', () => {
      assert.ok('a' in model.changedAttributes(), 'changedAttributes should contain unset properties');
    });
    model.unset('a');
  });

  QUnit.test('using a non-default id attribute.', (assert) => {
    assert.expect(5);
    const MongoModel = Backbone.Model.extend({idAttribute: '_id'});
    const model = new MongoModel({id: 'eye-dee', _id: 25, title: 'Model'});
    assert.equal(model.get('id'), 'eye-dee');
    assert.equal(model.id, 25);
    assert.equal(model.isNew(), false);
    model.unset('_id');
    assert.equal(model.id, undefined);
    assert.equal(model.isNew(), true);
  });

  QUnit.test('setting an alternative cid prefix', (assert) => {
    assert.expect(4);
    const Model = Backbone.Model.extend({
      cidPrefix: 'm'
    });
    let model = new Model();

    assert.equal(model.cid.charAt(0), 'm');

    model = new Backbone.Model();
    assert.equal(model.cid.charAt(0), 'c');

    const Collection = Backbone.Collection.extend({
      model: Model
    });
    const col = new Collection([{id: 'c5'}, {id: 'c6'}, {id: 'c7'}]);

    assert.equal(col.get('c6').cid.charAt(0), 'm');
    col.set([{id: 'c6', value: 'test'}], {
      merge: true,
      add: true,
      remove: false
    });
    assert.ok(col.get('c6').has('value'));
  });

  QUnit.test('set an empty string', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model({name: 'Model'});
    model.set({name: ''});
    assert.equal(model.get('name'), '');
  });

  QUnit.test('setting an object', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model({
      custom: {foo: 1}
    });
    model.on('change', () => {
      assert.ok(1);
    });
    model.set({
      custom: {foo: 1} // no change should be fired
    });
    model.set({
      custom: {foo: 2} // change event should be fired
    });
  });

  QUnit.test('clear', (assert) => {
    assert.expect(3);
    let changed;
    const model = new Backbone.Model({id: 1, name: 'Model'});
    model.on('change:name', () => { changed = true; });
    model.on('change', () => {
      const changedAttrs = model.changedAttributes();
      assert.ok('name' in changedAttrs);
    });
    model.clear();
    assert.equal(changed, true);
    assert.equal(model.get('name'), undefined);
  });

  QUnit.test('defaults', (assert) => {
    assert.expect(9);
    let Defaulted = Backbone.Model.extend({
      defaults: {
        one: 1,
        two: 2
      }
    });
    let model = new Defaulted({two: undefined});
    assert.equal(model.get('one'), 1);
    assert.equal(model.get('two'), 2);
    model = new Defaulted({two: 3});
    assert.equal(model.get('one'), 1);
    assert.equal(model.get('two'), 3);
    Defaulted = Backbone.Model.extend({
      defaults() {
        return {
          one: 3,
          two: 4
        };
      }
    });
    model = new Defaulted({two: undefined});
    assert.equal(model.get('one'), 3);
    assert.equal(model.get('two'), 4);
    Defaulted = Backbone.Model.extend({
      defaults: {hasOwnProperty: true}
    });
    model = new Defaulted();
    assert.equal(model.get('hasOwnProperty'), true);
    model = new Defaulted({hasOwnProperty: undefined});
    assert.equal(model.get('hasOwnProperty'), true);
    model = new Defaulted({hasOwnProperty: false});
    assert.equal(model.get('hasOwnProperty'), false);
  });

  QUnit.test('change, hasChanged, changedAttributes, previous, previousAttributes', (assert) => {
    assert.expect(9);
    const model = new Backbone.Model({name: 'Tim', age: 10});
    assert.deepEqual(model.changedAttributes(), false);
    model.on('change', () => {
      assert.ok(model.hasChanged('name'), 'name changed');
      assert.ok(!model.hasChanged('age'), 'age did not');
      assert.ok(_.isEqual(model.changedAttributes(), {name: 'Rob'}), 'changedAttributes returns the changed attrs');
      assert.equal(model.previous('name'), 'Tim');
      assert.ok(_.isEqual(model.previousAttributes(), {name: 'Tim', age: 10}), 'previousAttributes is correct');
    });
    assert.equal(model.hasChanged(), false);
    assert.equal(model.hasChanged(undefined), false);
    model.set({name: 'Rob'});
    assert.equal(model.get('name'), 'Rob');
  });

  QUnit.test('changedAttributes', (assert) => {
    assert.expect(3);
    const model = new Backbone.Model({a: 'a', b: 'b'});
    assert.deepEqual(model.changedAttributes(), false);
    assert.equal(model.changedAttributes({a: 'a'}), false);
    assert.equal(model.changedAttributes({a: 'b'}).a, 'b');
  });

  QUnit.test('change with options', (assert) => {
    assert.expect(2);
    let value;
    const model = new Backbone.Model({name: 'Rob'});
    model.on('change', (m, options) => {
      value = options.prefix + m.get('name');
    });
    model.set({name: 'Bob'}, {prefix: 'Mr. '});
    assert.equal(value, 'Mr. Bob');
    model.set({name: 'Sue'}, {prefix: 'Ms. '});
    assert.equal(value, 'Ms. Sue');
  });

  QUnit.test('change after initialize', (assert) => {
    assert.expect(1);
    let changed = 0;
    const attrs = {id: 1, label: 'c'};
    const obj = new Backbone.Model(attrs);
    obj.on('change', () => { changed += 1; });
    obj.set(attrs);
    assert.equal(changed, 0);
  });

  QUnit.test('save within change event', function(assert) {
    assert.expect(1);
    const env = this;
    const model = new Backbone.Model({firstName: 'Taylor', lastName: 'Swift'});
    model.url = '/test';
    model.on('change', () => {
      model.save();
      assert.ok(_.isEqual(env.syncArgs.model, model));
    });
    model.set({lastName: 'Hicks'});
  });

  QUnit.test('validate after save', (assert) => {
    assert.expect(2);
    let lastError;
    const model = new Backbone.Model();
    model.validate = function(attrs) {
      if (attrs.admin) return "Can't change admin status.";
    };
    model.sync = function(method, m, options) {
      options.success.call(this, {admin: true});
    };
    model.on('invalid', (m, error) => {
      lastError = error;
    });
    model.save(null);

    assert.equal(lastError, "Can't change admin status.");
    assert.equal(model.validationError, "Can't change admin status.");
  });

  QUnit.test('save', function(assert) {
    assert.expect(2);
    doc.save({title: 'Henry V'});
    assert.equal(this.syncArgs.method, 'update');
    assert.ok(_.isEqual(this.syncArgs.model, doc));
  });

  QUnit.test('save, fetch, destroy triggers error event when an error occurs', (assert) => {
    assert.expect(3);
    const model = new Backbone.Model();
    model.on('error', () => {
      assert.ok(true);
    });
    model.sync = function(method, m, options) {
      options.error();
    };
    model.save({data: 2, id: 1});
    model.fetch();
    model.destroy();
  });

  QUnit.test('#3283 - save, fetch, destroy calls success with context', (assert) => {
    assert.expect(3);
    const model = new Backbone.Model();
    const obj = {};
    const options = {
      context: obj,
      success() {
        assert.equal(this, obj);
      }
    };
    model.sync = function(method, m, opts) {
      opts.success.call(opts.context);
    };
    model.save({data: 2, id: 1}, options);
    model.fetch(options);
    model.destroy(options);
  });

  QUnit.test('#3283 - save, fetch, destroy calls error with context', (assert) => {
    assert.expect(3);
    const model = new Backbone.Model();
    const obj = {};
    const options = {
      context: obj,
      error() {
        assert.equal(this, obj);
      }
    };
    model.sync = function(method, m, opts) {
      opts.error.call(opts.context);
    };
    model.save({data: 2, id: 1}, options);
    model.fetch(options);
    model.destroy(options);
  });

  QUnit.test('#3470 - save and fetch with parse false', (assert) => {
    assert.expect(2);
    let i = 0;
    const model = new Backbone.Model();
    model.parse = function() {
      assert.ok(false);
    };
    model.sync = function(method, m, options) {
      options.success({i: ++i});
    };
    model.fetch({parse: false});
    assert.equal(model.get('i'), i);
    model.save(null, {parse: false});
    assert.equal(model.get('i'), i);
  });

  QUnit.test('save with PATCH', function(assert) {
    doc.clear().set({id: 1, a: 1, b: 2, c: 3, d: 4});
    doc.save();
    assert.equal(this.syncArgs.method, 'update');
    assert.equal(this.syncArgs.options.attrs, undefined);

    doc.save({b: 2, d: 4}, {patch: true});
    assert.equal(this.syncArgs.method, 'patch');
    assert.equal(_.size(this.syncArgs.options.attrs), 2);
    assert.equal(this.syncArgs.options.attrs.d, 4);
    assert.equal(this.syncArgs.options.attrs.a, undefined);
    assert.equal(this.ajaxSettings.data, '{"b":2,"d":4}');
  });

  QUnit.test('save with PATCH and different attrs', function(assert) {
    doc.clear().save({b: 2, d: 4}, {patch: true, attrs: {B: 1, D: 3}});
    assert.equal(this.syncArgs.options.attrs.D, 3);
    assert.equal(this.syncArgs.options.attrs.d, undefined);
    assert.equal(this.ajaxSettings.data, '{"B":1,"D":3}');
    assert.deepEqual(doc.attributes, {b: 2, d: 4});
  });

  QUnit.test('save in positional style', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    model.sync = function(method, m, options) {
      options.success();
    };
    model.save('title', 'Twelfth Night');
    assert.equal(model.get('title'), 'Twelfth Night');
  });

  QUnit.test('save with non-object success response', (assert) => {
    assert.expect(2);
    const model = new Backbone.Model();
    model.sync = function(method, m, options) {
      options.success('', options);
      options.success(null, options);
    };
    model.save({testing: 'empty'}, {
      success(m) {
        assert.deepEqual(m.attributes, {testing: 'empty'});
      }
    });
  });

  QUnit.test('save with wait and supplied id', function(assert) {
    const Model = Backbone.Model.extend({
      urlRoot: '/collection'
    });
    const model = new Model();
    model.save({id: 42}, {wait: true});
    assert.equal(this.ajaxSettings.url, '/collection/42');
  });

  QUnit.test('save will pass extra options to success callback', function(assert) {
    assert.expect(1);
    const SpecialSyncModel = Backbone.Model.extend({
      sync(method, m, options) {
        _.extend(options, {specialSync: true});
        return Backbone.Model.prototype.sync.call(this, method, m, options);
      },
      urlRoot: '/test'
    });

    const model = new SpecialSyncModel();

    const onSuccess = function(m, response, options) {
      assert.ok(options.specialSync, 'Options were passed correctly to callback');
    };

    model.save(null, {success: onSuccess});
    this.ajaxSettings.success();
  });

  QUnit.test('fetch', function(assert) {
    assert.expect(2);
    doc.fetch();
    assert.equal(this.syncArgs.method, 'read');
    assert.ok(_.isEqual(this.syncArgs.model, doc));
  });

  QUnit.test('fetch will pass extra options to success callback', function(assert) {
    assert.expect(1);
    const SpecialSyncModel = Backbone.Model.extend({
      sync(method, m, options) {
        _.extend(options, {specialSync: true});
        return Backbone.Model.prototype.sync.call(this, method, m, options);
      },
      urlRoot: '/test'
    });

    const model = new SpecialSyncModel();

    const onSuccess = function(m, response, options) {
      assert.ok(options.specialSync, 'Options were passed correctly to callback');
    };

    model.fetch({success: onSuccess});
    this.ajaxSettings.success();
  });

  QUnit.test('destroy', function(assert) {
    assert.expect(3);
    doc.destroy();
    assert.equal(this.syncArgs.method, 'delete');
    assert.ok(_.isEqual(this.syncArgs.model, doc));

    const newModel = new Backbone.Model();
    assert.equal(newModel.destroy(), false);
  });

  QUnit.test('destroy will pass extra options to success callback', function(assert) {
    assert.expect(1);
    const SpecialSyncModel = Backbone.Model.extend({
      sync(method, m, options) {
        _.extend(options, {specialSync: true});
        return Backbone.Model.prototype.sync.call(this, method, m, options);
      },
      urlRoot: '/test'
    });

    const model = new SpecialSyncModel({id: 'id'});

    const onSuccess = function(m, response, options) {
      assert.ok(options.specialSync, 'Options were passed correctly to callback');
    };

    model.destroy({success: onSuccess});
    this.ajaxSettings.success();
  });

  QUnit.test('non-persisted destroy', (assert) => {
    assert.expect(1);
    const a = new Backbone.Model({foo: 1, bar: 2, baz: 3});
    a.sync = function() { throw 'should not be called'; };
    a.destroy();
    assert.ok(true, 'non-persisted model should not call sync');
  });

  QUnit.test('validate', (assert) => {
    let lastError;
    const model = new Backbone.Model();
    model.validate = function(attrs) {
      if (attrs.admin !== this.get('admin')) return "Can't change admin status.";
    };
    model.on('invalid', (m, error) => {
      lastError = error;
    });
    let result = model.set({a: 100});
    assert.equal(result, model);
    assert.equal(model.get('a'), 100);
    assert.equal(lastError, undefined);
    result = model.set({admin: true});
    assert.equal(model.get('admin'), true);
    result = model.set({a: 200, admin: false}, {validate: true});
    assert.equal(lastError, "Can't change admin status.");
    assert.equal(result, false);
    assert.equal(model.get('a'), 100);
  });

  QUnit.test('validate on unset and clear', (assert) => {
    assert.expect(6);
    let error;
    const model = new Backbone.Model({name: 'One'});
    model.validate = function(attrs) {
      if (!attrs.name) {
        error = true;
        return 'No thanks.';
      }
    };
    model.set({name: 'Two'});
    assert.equal(model.get('name'), 'Two');
    assert.equal(error, undefined);
    model.unset('name', {validate: true});
    assert.equal(error, true);
    assert.equal(model.get('name'), 'Two');
    model.clear({validate: true});
    assert.equal(model.get('name'), 'Two');
    delete model.validate;
    model.clear();
    assert.equal(model.get('name'), undefined);
  });

  QUnit.test('validate with error callback', (assert) => {
    assert.expect(8);
    let lastError, boundError;
    const model = new Backbone.Model();
    model.validate = function(attrs) {
      if (attrs.admin) return "Can't change admin status.";
    };
    model.on('invalid', (m, error) => {
      boundError = true;
    });
    let result = model.set({a: 100}, {validate: true});
    assert.equal(result, model);
    assert.equal(model.get('a'), 100);
    assert.equal(model.validationError, null);
    assert.equal(boundError, undefined);
    result = model.set({a: 200, admin: true}, {validate: true});
    assert.equal(result, false);
    assert.equal(model.get('a'), 100);
    assert.equal(model.validationError, "Can't change admin status.");
    assert.equal(boundError, true);
  });

  QUnit.test('defaults always extend attrs (#459)', (assert) => {
    assert.expect(2);
    const Defaulted = Backbone.Model.extend({
      defaults: {one: 1},
      initialize(attrs, opts) {
        assert.equal(this.attributes.one, 1);
      }
    });
    const providedattrs = new Defaulted({});
    const emptyattrs = new Defaulted();
  });

  QUnit.test('Inherit class properties', (assert) => {
    assert.expect(6);
    const Parent = Backbone.Model.extend({
      instancePropSame() {},
      instancePropDiff() {}
    }, {
      classProp() {}
    });
    const Child = Parent.extend({
      instancePropDiff() {}
    });

    const adult = new Parent();
    const kid = new Child();

    assert.equal(Child.classProp, Parent.classProp);
    assert.notEqual(Child.classProp, undefined);

    assert.equal(kid.instancePropSame, adult.instancePropSame);
    assert.notEqual(kid.instancePropSame, undefined);

    assert.notEqual(Child.prototype.instancePropDiff, Parent.prototype.instancePropDiff);
    assert.notEqual(Child.prototype.instancePropDiff, undefined);
  });

  QUnit.test("Nested change events don't clobber previous attributes", (assert) => {
    assert.expect(4);
    new Backbone.Model()
      .on('change:state', (m, newState) => {
        assert.equal(m.previous('state'), undefined);
        assert.equal(newState, 'hello');
        // Fire a nested change event.
        m.set({other: 'whatever'});
      })
      .on('change:state', (m, newState) => {
        assert.equal(m.previous('state'), undefined);
        assert.equal(newState, 'hello');
      })
      .set({state: 'hello'});
  });

  QUnit.test('hasChanged/set should use same comparison', (assert) => {
    assert.expect(2);
    let changed = 0;
    const model = new Backbone.Model({a: null});
    model.on('change', function() {
      assert.ok(this.hasChanged('a'));
    })
      .on('change:a', () => {
        changed++;
      })
      .set({a: undefined});
    assert.equal(changed, 1);
  });

  QUnit.test('#582, #425, change:attribute callbacks should fire after all changes have occurred', (assert) => {
    assert.expect(9);
    const model = new Backbone.Model();

    const assertion = function() {
      assert.equal(model.get('a'), 'a');
      assert.equal(model.get('b'), 'b');
      assert.equal(model.get('c'), 'c');
    };

    model.on('change:a', assertion);
    model.on('change:b', assertion);
    model.on('change:c', assertion);

    model.set({a: 'a', b: 'b', c: 'c'});
  });

  QUnit.test('#871, set with attributes property', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    model.set({attributes: true});
    assert.ok(model.has('attributes'));
  });

  QUnit.test('set value regardless of equality/change', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model({x: []});
    const a = [];
    model.set({x: a});
    assert.ok(model.get('x') === a);
  });

  QUnit.test('set same value does not trigger change', (assert) => {
    assert.expect(0);
    const model = new Backbone.Model({x: 1});
    model.on('change change:x', () => { assert.ok(false); });
    model.set({x: 1});
    model.set({x: 1});
  });

  QUnit.test('unset does not fire a change for undefined attributes', (assert) => {
    assert.expect(0);
    const model = new Backbone.Model({x: undefined});
    model.on('change:x', () => { assert.ok(false); });
    model.unset('x');
  });

  QUnit.test('set: undefined values', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model({x: undefined});
    assert.ok('x' in model.attributes);
  });

  QUnit.test('hasChanged works outside of change events, and true within', (assert) => {
    assert.expect(6);
    const model = new Backbone.Model({x: 1});
    model.on('change:x', () => {
      assert.ok(model.hasChanged('x'));
      assert.equal(model.get('x'), 1);
    });
    model.set({x: 2}, {silent: true});
    assert.ok(model.hasChanged());
    assert.equal(model.hasChanged('x'), true);
    model.set({x: 1});
    assert.ok(model.hasChanged());
    assert.equal(model.hasChanged('x'), true);
  });

  QUnit.test('hasChanged gets cleared on the following set', (assert) => {
    assert.expect(4);
    const model = new Backbone.Model();
    model.set({x: 1});
    assert.ok(model.hasChanged());
    model.set({x: 1});
    assert.ok(!model.hasChanged());
    model.set({x: 2});
    assert.ok(model.hasChanged());
    model.set({});
    assert.ok(!model.hasChanged());
  });

  QUnit.test('save with `wait` succeeds without `validate`', function(assert) {
    assert.expect(1);
    const model = new Backbone.Model();
    model.url = '/test';
    model.save({x: 1}, {wait: true});
    assert.ok(this.syncArgs.model === model);
  });

  QUnit.test("save without `wait` doesn't set invalid attributes", (assert) => {
    const model = new Backbone.Model();
    model.validate = function() { return 1; };
    model.save({a: 1});
    assert.equal(model.get('a'), void 0);
  });

  QUnit.test("save doesn't validate twice", (assert) => {
    const model = new Backbone.Model();
    let times = 0;
    model.sync = function() {};
    model.validate = function() { ++times; };
    model.save({});
    assert.equal(times, 1);
  });

  QUnit.test('`hasChanged` for falsey keys', (assert) => {
    assert.expect(2);
    const model = new Backbone.Model();
    model.set({x: true}, {silent: true});
    assert.ok(!model.hasChanged(0));
    assert.ok(!model.hasChanged(''));
  });

  QUnit.test('`previous` for falsey keys', (assert) => {
    assert.expect(2);
    const model = new Backbone.Model({'0': true, '': true});
    model.set({'0': false, '': false}, {silent: true});
    assert.equal(model.previous(0), true);
    assert.equal(model.previous(''), true);
  });

  QUnit.test('`save` with `wait` sends correct attributes', function(assert) {
    assert.expect(5);
    let changed = 0;
    const model = new Backbone.Model({x: 1, y: 2});
    model.url = '/test';
    model.on('change:x', () => { changed++; });
    model.save({x: 3}, {wait: true});
    assert.deepEqual(JSON.parse(this.ajaxSettings.data), {x: 3, y: 2});
    assert.equal(model.get('x'), 1);
    assert.equal(changed, 0);
    this.syncArgs.options.success({});
    assert.equal(model.get('x'), 3);
    assert.equal(changed, 1);
  });

  QUnit.test("a failed `save` with `wait` doesn't leave attributes behind", (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    model.url = '/test';
    model.save({x: 1}, {wait: true});
    assert.equal(model.get('x'), void 0);
  });

  QUnit.test('#1030 - `save` with `wait` results in correct attributes if success is called during sync', (assert) => {
    assert.expect(2);
    const model = new Backbone.Model({x: 1, y: 2});
    model.sync = function(method, m, options) {
      options.success();
    };
    model.on('change:x', () => { assert.ok(true); });
    model.save({x: 3}, {wait: true});
    assert.equal(model.get('x'), 3);
  });

  QUnit.test('save with wait validates attributes', (assert) => {
    const model = new Backbone.Model();
    model.url = '/test';
    model.validate = function() { assert.ok(true); };
    model.save({x: 1}, {wait: true});
  });

  QUnit.test('save turns on parse flag', (assert) => {
    const Model = Backbone.Model.extend({
      sync(method, m, options) { assert.ok(options.parse); }
    });
    new Model().save();
  });

  QUnit.test("nested `set` during `'change:attr'`", (assert) => {
    assert.expect(2);
    let events = [];
    const model = new Backbone.Model();
    model.on('all', (event) => { events.push(event); });
    model.on('change', () => {
      model.set({z: true}, {silent: true});
    });
    model.on('change:x', () => {
      model.set({y: true});
    });
    model.set({x: true});
    assert.deepEqual(events, ['change:y', 'change:x', 'change']);
    events = [];
    model.set({z: true});
    assert.deepEqual(events, []);
  });

  QUnit.test('nested `change` only fires once', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    model.on('change', () => {
      assert.ok(true);
      model.set({x: true});
    });
    model.set({x: true});
  });

  QUnit.test("nested `set` during `'change'`", (assert) => {
    assert.expect(6);
    let count = 0;
    const model = new Backbone.Model();
    model.on('change', function() {
      switch (count++) {
      case 0:
        assert.deepEqual(this.changedAttributes(), {x: true});
        assert.equal(model.previous('x'), undefined);
        model.set({y: true});
        break;
      case 1:
        assert.deepEqual(this.changedAttributes(), {x: true, y: true});
        assert.equal(model.previous('x'), undefined);
        model.set({z: true});
        break;
      case 2:
        assert.deepEqual(this.changedAttributes(), {x: true, y: true, z: true});
        assert.equal(model.previous('y'), undefined);
        break;
      default:
        assert.ok(false);
      }
    });
    model.set({x: true});
  });

  QUnit.test('nested `change` with silent', (assert) => {
    assert.expect(3);
    let count = 0;
    const model = new Backbone.Model();
    model.on('change:y', () => { assert.ok(false); });
    model.on('change', function() {
      switch (count++) {
      case 0:
        assert.deepEqual(this.changedAttributes(), {x: true});
        model.set({y: true}, {silent: true});
        model.set({z: true});
        break;
      case 1:
        assert.deepEqual(this.changedAttributes(), {x: true, y: true, z: true});
        break;
      case 2:
        assert.deepEqual(this.changedAttributes(), {z: false});
        break;
      default:
        assert.ok(false);
      }
    });
    model.set({x: true});
    model.set({z: false});
  });

  QUnit.test('nested `change:attr` with silent', (assert) => {
    assert.expect(0);
    const model = new Backbone.Model();
    model.on('change:y', () => { assert.ok(false); });
    model.on('change', () => {
      model.set({y: true}, {silent: true});
      model.set({z: true});
    });
    model.set({x: true});
  });

  QUnit.test('multiple nested changes with silent', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    model.on('change:x', () => {
      model.set({y: 1}, {silent: true});
      model.set({y: 2});
    });
    model.on('change:y', (m, val) => {
      assert.equal(val, 2);
    });
    model.set({x: true});
  });

  QUnit.test('multiple nested changes with silent', (assert) => {
    assert.expect(1);
    const changes = [];
    const model = new Backbone.Model();
    model.on('change:b', (m, val) => { changes.push(val); });
    model.on('change', () => {
      model.set({b: 1});
    });
    model.set({b: 0});
    assert.deepEqual(changes, [0, 1]);
  });

  QUnit.test('basic silent change semantics', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    model.set({x: 1});
    model.on('change', () => { assert.ok(true); });
    model.set({x: 2}, {silent: true});
    model.set({x: 1});
  });

  QUnit.test('nested set multiple times', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    model.on('change:b', () => {
      assert.ok(true);
    });
    model.on('change:a', () => {
      model.set({b: true});
      model.set({b: true});
    });
    model.set({a: true});
  });

  QUnit.test('#1122 - clear does not alter options.', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    const options = {};
    model.clear(options);
    assert.ok(!options.unset);
  });

  QUnit.test('#1122 - unset does not alter options.', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    const options = {};
    model.unset('x', options);
    assert.ok(!options.unset);
  });

  QUnit.test('#1355 - `options` is passed to success callbacks', (assert) => {
    assert.expect(3);
    const model = new Backbone.Model();
    const opts = {
      success(m, resp, options) {
        assert.ok(options);
      }
    };
    model.sync = function(method, m, options) {
      options.success();
    };
    model.save({id: 1}, opts);
    model.fetch(opts);
    model.destroy(opts);
  });

  QUnit.test("#1412 - Trigger 'sync' event.", (assert) => {
    assert.expect(3);
    const model = new Backbone.Model({id: 1});
    model.sync = function(method, m, options) { options.success(); };
    model.on('sync', () => { assert.ok(true); });
    model.fetch();
    model.save();
    model.destroy();
  });

  QUnit.test('#1365 - Destroy: New models execute success callback.', (assert) => {
    const done = assert.async();
    assert.expect(2);
    new Backbone.Model()
      .on('sync', () => { assert.ok(false); })
      .on('destroy', () => { assert.ok(true); })
      .destroy({success() {
        assert.ok(true);
        done();
      }});
  });

  QUnit.test('#1433 - Save: An invalid model cannot be persisted.', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    model.validate = function() { return 'invalid'; };
    model.sync = function() { assert.ok(false); };
    assert.strictEqual(model.save(), false);
  });

  QUnit.test("#1377 - Save without attrs triggers 'error'.", (assert) => {
    assert.expect(1);
    const Model = Backbone.Model.extend({
      url: '/test/',
      sync(method, m, options) { options.success(); },
      validate() { return 'invalid'; }
    });
    const model = new Model({id: 1});
    model.on('invalid', () => { assert.ok(true); });
    model.save();
  });

  QUnit.test('#1545 - `undefined` can be passed to a model constructor without coersion', (assert) => {
    const Model = Backbone.Model.extend({
      defaults: {one: 1},
      initialize(attrs, opts) {
        assert.equal(attrs, undefined);
      }
    });
    const emptyattrs = new Model();
    const undefinedattrs = new Model(undefined);
  });

  QUnit.test('#1478 - Model `save` does not trigger change on unchanged attributes', (assert) => {
    const done = assert.async();
    assert.expect(0);
    const Model = Backbone.Model.extend({
      sync(method, m, options) {
        setTimeout(() => {
          options.success();
          done();
        }, 0);
      }
    });
    new Model({x: true})
      .on('change:x', () => { assert.ok(false); })
      .save(null, {wait: true});
  });

  QUnit.test('#1664 - Changing from one value, silently to another, back to original triggers a change.', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model({x: 1});
    model.on('change:x', () => { assert.ok(true); });
    model.set({x: 2}, {silent: true});
    model.set({x: 3}, {silent: true});
    model.set({x: 1});
  });

  QUnit.test('#1664 - multiple silent changes nested inside a change event', (assert) => {
    assert.expect(2);
    const changes = [];
    const model = new Backbone.Model();
    model.on('change', () => {
      model.set({a: 'c'}, {silent: true});
      model.set({b: 2}, {silent: true});
      model.unset('c', {silent: true});
    });
    model.on('change:a change:b change:c', (m, val) => { changes.push(val); });
    model.set({a: 'a', b: 1, c: 'item'});
    assert.deepEqual(changes, ['a', 1, 'item']);
    assert.deepEqual(model.attributes, {a: 'c', b: 2});
  });

  QUnit.test('#1791 - `attributes` is available for `parse`', (assert) => {
    const Model = Backbone.Model.extend({
      parse() { this.has('a'); } // shouldn't throw an error
    });
    const model = new Model(null, {parse: true});
    assert.expect(0);
  });

  QUnit.test('silent changes in last `change` event back to original triggers change', (assert) => {
    assert.expect(2);
    const changes = [];
    const model = new Backbone.Model();
    model.on('change:a change:b change:c', (m, val) => { changes.push(val); });
    model.on('change', () => {
      model.set({a: 'c'}, {silent: true});
    });
    model.set({a: 'a'});
    assert.deepEqual(changes, ['a']);
    model.set({a: 'a'});
    assert.deepEqual(changes, ['a', 'a']);
  });

  QUnit.test('#1943 change calculations should use _.isEqual', (assert) => {
    const model = new Backbone.Model({a: {key: 'value'}});
    model.set('a', {key: 'value'}, {silent: true});
    assert.equal(model.changedAttributes(), false);
  });

  QUnit.test('#1964 - final `change` event is always fired, regardless of interim changes', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    model.on('change:property', () => {
      model.set('property', 'bar');
    });
    model.on('change', () => {
      assert.ok(true);
    });
    model.set('property', 'foo');
  });

  QUnit.test('isValid', (assert) => {
    const model = new Backbone.Model({valid: true});
    model.validate = function(attrs) {
      if (!attrs.valid) return 'invalid';
    };
    assert.equal(model.isValid(), true);
    assert.equal(model.set({valid: false}, {validate: true}), false);
    assert.equal(model.isValid(), true);
    model.set({valid: false});
    assert.equal(model.isValid(), false);
    assert.ok(!model.set('valid', false, {validate: true}));
  });

  QUnit.test('mixin', (assert) => {
    Backbone.Model.mixin({
      isEqual(model1, model2) {
        return _.isEqual(model1, model2.attributes);
      }
    });

    const model1 = new Backbone.Model({
      a: {b: 2}, c: 3
    });
    const model2 = new Backbone.Model({
      a: {b: 2}, c: 3
    });
    const model3 = new Backbone.Model({
      a: {b: 4}, c: 3
    });

    assert.equal(model1.isEqual(model2), true);
    assert.equal(model1.isEqual(model3), false);
  });

  QUnit.test('#1179 - isValid returns true in the absence of validate.', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    model.validate = null;
    assert.ok(model.isValid());
  });

  QUnit.test('#1961 - Creating a model with {validate:true} will call validate and use the error callback', (assert) => {
    const Model = Backbone.Model.extend({
      validate(attrs) {
        if (attrs.id === 1) return "This shouldn't happen";
      }
    });
    const model = new Model({id: 1}, {validate: true});
    assert.equal(model.validationError, "This shouldn't happen");
  });

  QUnit.test('toJSON receives attrs during save(..., {wait: true})', (assert) => {
    assert.expect(1);
    const Model = Backbone.Model.extend({
      url: '/test',
      toJSON() {
        assert.strictEqual(this.attributes.x, 1);
        return _.clone(this.attributes);
      }
    });
    const model = new Model();
    model.save({x: 1}, {wait: true});
  });

  QUnit.test('#2034 - nested set with silent only triggers one change', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    model.on('change', () => {
      model.set({b: true}, {silent: true});
      assert.ok(true);
    });
    model.set({a: true});
  });

  QUnit.test('#3778 - id will only be updated if it is set', (assert) => {
    assert.expect(2);
    const model = new Backbone.Model({id: 1});
    model.id = 2;
    model.set({foo: 'bar'});
    assert.equal(model.id, 2);
    model.set({id: 3});
    assert.equal(model.id, 3);
  });
})(QUnit);
