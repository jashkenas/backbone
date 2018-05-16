(function(QUnit) {
  let a, b, c, d, e, col, otherCol;

  QUnit.module('Backbone.Collection', {

    beforeEach(assert) {
      a = new Backbone.Model({id: 3, label: 'a'});
      b = new Backbone.Model({id: 2, label: 'b'});
      c = new Backbone.Model({id: 1, label: 'c'});
      d = new Backbone.Model({id: 0, label: 'd'});
      e = null;
      col = new Backbone.Collection([a, b, c, d]);
      otherCol = new Backbone.Collection();
    }

  });

  QUnit.test('new and sort', (assert) => {
    assert.expect(6);
    let counter = 0;
    col.on('sort', () => { counter++; });
    assert.deepEqual(col.pluck('label'), ['a', 'b', 'c', 'd']);
    col.comparator = function(m1, m2) {
      return m1.id > m2.id ? -1 : 1;
    };
    col.sort();
    assert.equal(counter, 1);
    assert.deepEqual(col.pluck('label'), ['a', 'b', 'c', 'd']);
    col.comparator = function(model) { return model.id; };
    col.sort();
    assert.equal(counter, 2);
    assert.deepEqual(col.pluck('label'), ['d', 'c', 'b', 'a']);
    assert.equal(col.length, 4);
  });

  QUnit.test('String comparator.', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection([
      {id: 3},
      {id: 1},
      {id: 2}
    ], {comparator: 'id'});
    assert.deepEqual(collection.pluck('id'), [1, 2, 3]);
  });

  QUnit.test('new and parse', (assert) => {
    assert.expect(3);
    const Collection = Backbone.Collection.extend({
      parse(data) {
        return _.filter(data, (datum) => {
          return datum.a % 2 === 0;
        });
      }
    });
    const models = [{a: 1}, {a: 2}, {a: 3}, {a: 4}];
    const collection = new Collection(models, {parse: true});
    assert.strictEqual(collection.length, 2);
    assert.strictEqual(collection.first().get('a'), 2);
    assert.strictEqual(collection.last().get('a'), 4);
  });

  QUnit.test('clone preserves model and comparator', (assert) => {
    assert.expect(3);
    const Model = Backbone.Model.extend();
    const comparator = function(model) { return model.id; };

    const collection = new Backbone.Collection([{id: 1}], {
      model: Model,
      comparator
    }).clone();
    collection.add({id: 2});
    assert.ok(collection.at(0) instanceof Model);
    assert.ok(collection.at(1) instanceof Model);
    assert.strictEqual(collection.comparator, comparator);
  });

  QUnit.test('get', (assert) => {
    assert.expect(6);
    assert.equal(col.get(0), d);
    assert.equal(col.get(d.clone()), d);
    assert.equal(col.get(2), b);
    assert.equal(col.get({id: 1}), c);
    assert.equal(col.get(c.clone()), c);
    assert.equal(col.get(col.first().cid), col.first());
  });

  QUnit.test('get with non-default ids', (assert) => {
    assert.expect(5);
    const MongoModel = Backbone.Model.extend({idAttribute: '_id'});
    const model = new MongoModel({_id: 100});
    const collection = new Backbone.Collection([model], {model: MongoModel});
    assert.equal(collection.get(100), model);
    assert.equal(collection.get(model.cid), model);
    assert.equal(collection.get(model), model);
    assert.equal(collection.get(101), void 0);

    const collection2 = new Backbone.Collection();
    collection2.model = MongoModel;
    collection2.add(model.attributes);
    assert.equal(collection2.get(model.clone()), collection2.first());
  });

  QUnit.test('has', (assert) => {
    assert.expect(15);
    assert.ok(col.has(a));
    assert.ok(col.has(b));
    assert.ok(col.has(c));
    assert.ok(col.has(d));
    assert.ok(col.has(a.id));
    assert.ok(col.has(b.id));
    assert.ok(col.has(c.id));
    assert.ok(col.has(d.id));
    assert.ok(col.has(a.cid));
    assert.ok(col.has(b.cid));
    assert.ok(col.has(c.cid));
    assert.ok(col.has(d.cid));
    const outsider = new Backbone.Model({id: 4});
    assert.notOk(col.has(outsider));
    assert.notOk(col.has(outsider.id));
    assert.notOk(col.has(outsider.cid));
  });

  QUnit.test('update index when id changes', (assert) => {
    assert.expect(4);
    const collection = new Backbone.Collection();
    collection.add([
      {id: 0, name: 'one'},
      {id: 1, name: 'two'}
    ]);
    const one = collection.get(0);
    assert.equal(one.get('name'), 'one');
    collection.on('change:name', function(model) { assert.ok(this.get(model)); });
    one.set({name: 'dalmatians', id: 101});
    assert.equal(collection.get(0), null);
    assert.equal(collection.get(101).get('name'), 'dalmatians');
  });

  QUnit.test('at', (assert) => {
    assert.expect(2);
    assert.equal(col.at(2), c);
    assert.equal(col.at(-2), c);
  });

  QUnit.test('pluck', (assert) => {
    assert.expect(1);
    assert.equal(col.pluck('label').join(' '), 'a b c d');
  });

  QUnit.test('add', (assert) => {
    assert.expect(14);
    let added, opts, secondAdded;
    added = opts = secondAdded = null;
    e = new Backbone.Model({id: 10, label: 'e'});
    otherCol.add(e);
    otherCol.on('add', () => {
      secondAdded = true;
    });
    col.on('add', (model, collection, options) => {
      added = model.get('label');
      opts = options;
    });
    col.add(e, {amazing: true});
    assert.equal(added, 'e');
    assert.equal(col.length, 5);
    assert.equal(col.last(), e);
    assert.equal(otherCol.length, 1);
    assert.equal(secondAdded, null);
    assert.ok(opts.amazing);

    const f = new Backbone.Model({id: 20, label: 'f'});
    const g = new Backbone.Model({id: 21, label: 'g'});
    const h = new Backbone.Model({id: 22, label: 'h'});
    const atCol = new Backbone.Collection([f, g, h]);
    assert.equal(atCol.length, 3);
    atCol.add(e, {at: 1});
    assert.equal(atCol.length, 4);
    assert.equal(atCol.at(1), e);
    assert.equal(atCol.last(), h);

    const coll = new Backbone.Collection(new Array(2));
    let addCount = 0;
    coll.on('add', () => {
      addCount += 1;
    });
    coll.add([undefined, f, g]);
    assert.equal(coll.length, 5);
    assert.equal(addCount, 3);
    coll.add(new Array(4));
    assert.equal(coll.length, 9);
    assert.equal(addCount, 7);
  });

  QUnit.test('add multiple models', (assert) => {
    assert.expect(6);
    const collection = new Backbone.Collection([{at: 0}, {at: 1}, {at: 9}]);
    collection.add([{at: 2}, {at: 3}, {at: 4}, {at: 5}, {at: 6}, {at: 7}, {at: 8}], {at: 2});
    for (let i = 0; i <= 5; i++) {
      assert.equal(collection.at(i).get('at'), i);
    }
  });

  QUnit.test('add; at should have preference over comparator', (assert) => {
    assert.expect(1);
    const Col = Backbone.Collection.extend({
      comparator(m1, m2) {
        return m1.id > m2.id ? -1 : 1;
      }
    });

    const collection = new Col([{id: 2}, {id: 3}]);
    collection.add(new Backbone.Model({id: 1}), {at: 1});

    assert.equal(collection.pluck('id').join(' '), '3 1 2');
  });

  QUnit.test('add; at should add to the end if the index is out of bounds', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection([{id: 2}, {id: 3}]);
    collection.add(new Backbone.Model({id: 1}), {at: 5});

    assert.equal(collection.pluck('id').join(' '), '2 3 1');
  });

  QUnit.test("can't add model to collection twice", (assert) => {
    const collection = new Backbone.Collection([{id: 1}, {id: 2}, {id: 1}, {id: 2}, {id: 3}]);
    assert.equal(collection.pluck('id').join(' '), '1 2 3');
  });

  QUnit.test("can't add different model with same id to collection twice", (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection();
    collection.unshift({id: 101});
    collection.add({id: 101});
    assert.equal(collection.length, 1);
  });

  QUnit.test('merge in duplicate models with {merge: true}', (assert) => {
    assert.expect(3);
    const collection = new Backbone.Collection();
    collection.add([{id: 1, name: 'Moe'}, {id: 2, name: 'Curly'}, {id: 3, name: 'Larry'}]);
    collection.add({id: 1, name: 'Moses'});
    assert.equal(collection.first().get('name'), 'Moe');
    collection.add({id: 1, name: 'Moses'}, {merge: true});
    assert.equal(collection.first().get('name'), 'Moses');
    collection.add({id: 1, name: 'Tim'}, {merge: true, silent: true});
    assert.equal(collection.first().get('name'), 'Tim');
  });

  QUnit.test('add model to multiple collections', (assert) => {
    assert.expect(10);
    let counter = 0;
    const m = new Backbone.Model({id: 10, label: 'm'});
    m.on('add', (model, collection) => {
      counter++;
      assert.equal(m, model);
      if (counter > 1) {
        assert.equal(collection, col2);
      } else {
        assert.equal(collection, col1);
      }
    });
    const col1 = new Backbone.Collection([]);
    col1.on('add', (model, collection) => {
      assert.equal(m, model);
      assert.equal(col1, collection);
    });
    const col2 = new Backbone.Collection([]);
    col2.on('add', (model, collection) => {
      assert.equal(m, model);
      assert.equal(col2, collection);
    });
    col1.add(m);
    assert.equal(m.collection, col1);
    col2.add(m);
    assert.equal(m.collection, col1);
  });

  QUnit.test('add model with parse', (assert) => {
    assert.expect(1);
    const Model = Backbone.Model.extend({
      parse(obj) {
        obj.value += 1;
        return obj;
      }
    });

    const Col = Backbone.Collection.extend({model: Model});
    const collection = new Col();
    collection.add({value: 1}, {parse: true});
    assert.equal(collection.at(0).get('value'), 2);
  });

  QUnit.test('add with parse and merge', (assert) => {
    const collection = new Backbone.Collection();
    collection.parse = function(attrs) {
      return _.map(attrs, (model) => {
        if (model.model) return model.model;
        return model;
      });
    };
    collection.add({id: 1});
    collection.add({model: {id: 1, name: 'Alf'}}, {parse: true, merge: true});
    assert.equal(collection.first().get('name'), 'Alf');
  });

  QUnit.test('add model to collection with sort()-style comparator', (assert) => {
    assert.expect(3);
    const collection = new Backbone.Collection();
    collection.comparator = function(m1, m2) {
      return m1.get('name') < m2.get('name') ? -1 : 1;
    };
    const tom = new Backbone.Model({name: 'Tom'});
    const rob = new Backbone.Model({name: 'Rob'});
    const tim = new Backbone.Model({name: 'Tim'});
    collection.add(tom);
    collection.add(rob);
    collection.add(tim);
    assert.equal(collection.indexOf(rob), 0);
    assert.equal(collection.indexOf(tim), 1);
    assert.equal(collection.indexOf(tom), 2);
  });

  QUnit.test('comparator that depends on `this`', (assert) => {
    assert.expect(2);
    const collection = new Backbone.Collection();
    collection.negative = function(num) {
      return -num;
    };
    collection.comparator = function(model) {
      return this.negative(model.id);
    };
    collection.add([{id: 1}, {id: 2}, {id: 3}]);
    assert.deepEqual(collection.pluck('id'), [3, 2, 1]);
    collection.comparator = function(m1, m2) {
      return this.negative(m2.id) - this.negative(m1.id);
    };
    collection.sort();
    assert.deepEqual(collection.pluck('id'), [1, 2, 3]);
  });

  QUnit.test('remove', (assert) => {
    assert.expect(12);
    let removed = null;
    let result = null;
    col.on('remove', (model, collection, options) => {
      removed = model.get('label');
      assert.equal(options.index, 3);
      assert.equal(collection.get(model), undefined, '#3693: model cannot be fetched from collection');
    });
    result = col.remove(d);
    assert.equal(removed, 'd');
    assert.strictEqual(result, d);
    // if we try to remove d again, it's not going to actually get removed
    result = col.remove(d);
    assert.strictEqual(result, undefined);
    assert.equal(col.length, 3);
    assert.equal(col.first(), a);
    col.off();
    result = col.remove([c, d]);
    assert.equal(result.length, 1, 'only returns removed models');
    assert.equal(result[0], c, 'only returns removed models');
    result = col.remove([c, b]);
    assert.equal(result.length, 1, 'only returns removed models');
    assert.equal(result[0], b, 'only returns removed models');
    result = col.remove([]);
    assert.deepEqual(result, [], 'returns empty array when nothing removed');
  });

  QUnit.test('add and remove return values', (assert) => {
    assert.expect(13);
    const Even = Backbone.Model.extend({
      validate(attrs) {
        if (attrs.id % 2 !== 0) return 'odd';
      }
    });
    const collection = new Backbone.Collection();
    collection.model = Even;

    let list = collection.add([{id: 2}, {id: 4}], {validate: true});
    assert.equal(list.length, 2);
    assert.ok(list[0] instanceof Backbone.Model);
    assert.equal(list[1], collection.last());
    assert.equal(list[1].get('id'), 4);

    list = collection.add([{id: 3}, {id: 6}], {validate: true});
    assert.equal(collection.length, 3);
    assert.equal(list[0], false);
    assert.equal(list[1].get('id'), 6);

    let result = collection.add({id: 6});
    assert.equal(result.cid, list[1].cid);

    result = collection.remove({id: 6});
    assert.equal(collection.length, 2);
    assert.equal(result.id, 6);

    list = collection.remove([{id: 2}, {id: 8}]);
    assert.equal(collection.length, 1);
    assert.equal(list[0].get('id'), 2);
    assert.equal(list[1], null);
  });

  QUnit.test('shift and pop', (assert) => {
    assert.expect(2);
    const collection = new Backbone.Collection([{a: 'a'}, {b: 'b'}, {c: 'c'}]);
    assert.equal(collection.shift().get('a'), 'a');
    assert.equal(collection.pop().get('c'), 'c');
  });

  QUnit.test('slice', (assert) => {
    assert.expect(2);
    const collection = new Backbone.Collection([{a: 'a'}, {b: 'b'}, {c: 'c'}]);
    const array = collection.slice(1, 3);
    assert.equal(array.length, 2);
    assert.equal(array[0].get('b'), 'b');
  });

  QUnit.test('events are unbound on remove', (assert) => {
    assert.expect(3);
    let counter = 0;
    const dj = new Backbone.Model();
    const emcees = new Backbone.Collection([dj]);
    emcees.on('change', () => { counter++; });
    dj.set({name: 'Kool'});
    assert.equal(counter, 1);
    emcees.reset([]);
    assert.equal(dj.collection, undefined);
    dj.set({name: 'Shadow'});
    assert.equal(counter, 1);
  });

  QUnit.test('remove in multiple collections', (assert) => {
    assert.expect(7);
    const modelData = {
      id: 5,
      title: 'Othello'
    };
    let passed = false;
    const m1 = new Backbone.Model(modelData);
    const m2 = new Backbone.Model(modelData);
    m2.on('remove', () => {
      passed = true;
    });
    const col1 = new Backbone.Collection([m1]);
    const col2 = new Backbone.Collection([m2]);
    assert.notEqual(m1, m2);
    assert.ok(col1.length === 1);
    assert.ok(col2.length === 1);
    col1.remove(m1);
    assert.equal(passed, false);
    assert.ok(col1.length === 0);
    col2.remove(m1);
    assert.ok(col2.length === 0);
    assert.equal(passed, true);
  });

  QUnit.test('remove same model in multiple collection', (assert) => {
    assert.expect(16);
    let counter = 0;
    const m = new Backbone.Model({id: 5, title: 'Othello'});
    m.on('remove', (model, collection) => {
      counter++;
      assert.equal(m, model);
      if (counter > 1) {
        assert.equal(collection, col1);
      } else {
        assert.equal(collection, col2);
      }
    });
    const col1 = new Backbone.Collection([m]);
    col1.on('remove', (model, collection) => {
      assert.equal(m, model);
      assert.equal(col1, collection);
    });
    const col2 = new Backbone.Collection([m]);
    col2.on('remove', (model, collection) => {
      assert.equal(m, model);
      assert.equal(col2, collection);
    });
    assert.equal(col1, m.collection);
    col2.remove(m);
    assert.ok(col2.length === 0);
    assert.ok(col1.length === 1);
    assert.equal(counter, 1);
    assert.equal(col1, m.collection);
    col1.remove(m);
    assert.equal(null, m.collection);
    assert.ok(col1.length === 0);
    assert.equal(counter, 2);
  });

  QUnit.test('model destroy removes from all collections', (assert) => {
    assert.expect(3);
    const m = new Backbone.Model({id: 5, title: 'Othello'});
    m.sync = function(method, model, options) { options.success(); };
    const col1 = new Backbone.Collection([m]);
    const col2 = new Backbone.Collection([m]);
    m.destroy();
    assert.ok(col1.length === 0);
    assert.ok(col2.length === 0);
    assert.equal(undefined, m.collection);
  });

  QUnit.test('Collection: non-persisted model destroy removes from all collections', (assert) => {
    assert.expect(3);
    const m = new Backbone.Model({title: 'Othello'});
    m.sync = function(method, model, options) { throw 'should not be called'; };
    const col1 = new Backbone.Collection([m]);
    const col2 = new Backbone.Collection([m]);
    m.destroy();
    assert.ok(col1.length === 0);
    assert.ok(col2.length === 0);
    assert.equal(undefined, m.collection);
  });

  QUnit.test('fetch', function(assert) {
    assert.expect(4);
    const collection = new Backbone.Collection();
    collection.url = '/test';
    collection.fetch();
    assert.equal(this.syncArgs.method, 'read');
    assert.equal(this.syncArgs.model, collection);
    assert.equal(this.syncArgs.options.parse, true);

    collection.fetch({parse: false});
    assert.equal(this.syncArgs.options.parse, false);
  });

  QUnit.test('fetch with an error response triggers an error event', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection();
    collection.on('error', () => {
      assert.ok(true);
    });
    collection.sync = function(method, model, options) { options.error(); };
    collection.fetch();
  });

  QUnit.test('#3283 - fetch with an error response calls error with context', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection();
    const obj = {};
    const options = {
      context: obj,
      error() {
        assert.equal(this, obj);
      }
    };
    collection.sync = function(method, model, opts) {
      opts.error.call(opts.context);
    };
    collection.fetch(options);
  });

  QUnit.test('ensure fetch only parses once', function(assert) {
    assert.expect(1);
    const collection = new Backbone.Collection();
    let counter = 0;
    collection.parse = function(models) {
      counter++;
      return models;
    };
    collection.url = '/test';
    collection.fetch();
    this.syncArgs.options.success([]);
    assert.equal(counter, 1);
  });

  QUnit.test('create', function(assert) {
    assert.expect(4);
    const collection = new Backbone.Collection();
    collection.url = '/test';
    const model = collection.create({label: 'f'}, {wait: true});
    assert.equal(this.syncArgs.method, 'create');
    assert.equal(this.syncArgs.model, model);
    assert.equal(model.get('label'), 'f');
    assert.equal(model.collection, collection);
  });

  QUnit.test('create with validate:true enforces validation', (assert) => {
    assert.expect(3);
    const ValidatingModel = Backbone.Model.extend({
      validate(attrs) {
        return 'fail';
      }
    });
    const ValidatingCollection = Backbone.Collection.extend({
      model: ValidatingModel
    });
    const collection = new ValidatingCollection();
    collection.on('invalid', (coll, error, options) => {
      assert.equal(error, 'fail');
      assert.equal(options.validationError, 'fail');
    });
    assert.equal(collection.create({foo: 'bar'}, {validate: true}), false);
  });

  QUnit.test('create will pass extra options to success callback', function(assert) {
    assert.expect(1);
    const Model = Backbone.Model.extend({
      sync(method, model, options) {
        _.extend(options, {specialSync: true});
        return Backbone.Model.prototype.sync.call(this, method, model, options);
      }
    });

    const Collection = Backbone.Collection.extend({
      model: Model,
      url: '/test'
    });

    const collection = new Collection();

    const success = function(model, response, options) {
      assert.ok(options.specialSync, 'Options were passed correctly to callback');
    };

    collection.create({}, {success});
    this.ajaxSettings.success();
  });

  QUnit.test('create with wait:true should not call collection.parse', function(assert) {
    assert.expect(0);
    const Collection = Backbone.Collection.extend({
      url: '/test',
      parse() {
        assert.ok(false);
      }
    });

    const collection = new Collection();

    collection.create({}, {wait: true});
    this.ajaxSettings.success();
  });

  QUnit.test('a failing create returns model with errors', (assert) => {
    const ValidatingModel = Backbone.Model.extend({
      validate(attrs) {
        return 'fail';
      }
    });
    const ValidatingCollection = Backbone.Collection.extend({
      model: ValidatingModel
    });
    const collection = new ValidatingCollection();
    const m = collection.create({foo: 'bar'});
    assert.equal(m.validationError, 'fail');
    assert.equal(collection.length, 1);
  });

  QUnit.test('initialize', (assert) => {
    assert.expect(1);
    const Collection = Backbone.Collection.extend({
      initialize() {
        this.one = 1;
      }
    });
    const coll = new Collection();
    assert.equal(coll.one, 1);
  });

  QUnit.test('preinitialize', (assert) => {
    assert.expect(1);
    const Collection = Backbone.Collection.extend({
      preinitialize() {
        this.one = 1;
      }
    });
    const coll = new Collection();
    assert.equal(coll.one, 1);
  });

  QUnit.test('preinitialize occurs before the collection is set up', (assert) => {
    assert.expect(2);
    const Collection = Backbone.Collection.extend({
      preinitialize() {
        assert.notEqual(this.model, FooModel);
      }
    });
    const FooModel = Backbone.Model.extend({id: 'foo'});
    const coll = new Collection({}, {
      model: FooModel
    });
    assert.equal(coll.model, FooModel);
  });

  QUnit.test('toJSON', (assert) => {
    assert.expect(1);
    assert.equal(JSON.stringify(col), '[{"id":3,"label":"a"},{"id":2,"label":"b"},{"id":1,"label":"c"},{"id":0,"label":"d"}]');
  });

  QUnit.test('where and findWhere', (assert) => {
    assert.expect(8);
    const model = new Backbone.Model({a: 1});
    const coll = new Backbone.Collection([
      model,
      {a: 1},
      {a: 1, b: 2},
      {a: 2, b: 2},
      {a: 3}
    ]);
    assert.equal(coll.where({a: 1}).length, 3);
    assert.equal(coll.where({a: 2}).length, 1);
    assert.equal(coll.where({a: 3}).length, 1);
    assert.equal(coll.where({b: 1}).length, 0);
    assert.equal(coll.where({b: 2}).length, 2);
    assert.equal(coll.where({a: 1, b: 2}).length, 1);
    assert.equal(coll.findWhere({a: 1}), model);
    assert.equal(coll.findWhere({a: 4}), void 0);
  });

  QUnit.test('mixin', (assert) => {
    Backbone.Collection.mixin({
      sum(models, iteratee) {
        return _.reduce(models, (s, m) => {
          return s + iteratee(m);
        }, 0);
      }
    });

    const coll = new Backbone.Collection([
      {a: 1},
      {a: 1, b: 2},
      {a: 2, b: 2},
      {a: 3}
    ]);

    assert.equal(coll.sum((m) => {
      return m.get('a');
    }), 7);
  });

  QUnit.test('Underscore methods', (assert) => {
    assert.expect(21);
    assert.equal(col.map((model) => { return model.get('label'); }).join(' '), 'a b c d');
    assert.equal(col.some((model) => { return model.id === 100; }), false);
    assert.equal(col.some((model) => { return model.id === 0; }), true);
    assert.equal(col.reduce((m1, m2) => { return m1.id > m2.id ? m1 : m2; }).id, 3);
    assert.equal(col.reduceRight((m1, m2) => { return m1.id > m2.id ? m1 : m2; }).id, 3);
    assert.equal(col.indexOf(b), 1);
    assert.equal(col.size(), 4);
    assert.equal(col.rest().length, 3);
    assert.ok(!_.includes(col.rest(), a));
    assert.ok(_.includes(col.rest(), d));
    assert.ok(!col.isEmpty());
    assert.ok(!_.includes(col.without(d), d));

    const wrapped = col.chain();
    assert.equal(wrapped.map('id').max().value(), 3);
    assert.equal(wrapped.map('id').min().value(), 0);
    assert.deepEqual(wrapped
      .filter((o) => { return o.id % 2 === 0; })
      .map((o) => { return o.id * 2; })
      .value(),
    [4, 0]);
    assert.deepEqual(col.difference([c, d]), [a, b]);
    assert.ok(col.includes(col.sample()));

    const first = col.first();
    assert.deepEqual(col.groupBy((model) => { return model.id; })[first.id], [first]);
    assert.deepEqual(col.countBy((model) => { return model.id; }), {0: 1, 1: 1, 2: 1, 3: 1});
    assert.deepEqual(col.sortBy((model) => { return model.id; })[0], col.at(3));
    assert.ok(col.indexBy('id')[first.id] === first);
  });

  QUnit.test('Underscore methods with object-style and property-style iteratee', (assert) => {
    assert.expect(26);
    const model = new Backbone.Model({a: 4, b: 1, e: 3});
    const coll = new Backbone.Collection([
      {a: 1, b: 1},
      {a: 2, b: 1, c: 1},
      {a: 3, b: 1},
      model
    ]);
    assert.equal(coll.find({a: 0}), undefined);
    assert.deepEqual(coll.find({a: 4}), model);
    assert.equal(coll.find('d'), undefined);
    assert.deepEqual(coll.find('e'), model);
    assert.equal(coll.filter({a: 0}), false);
    assert.deepEqual(coll.filter({a: 4}), [model]);
    assert.equal(coll.some({a: 0}), false);
    assert.equal(coll.some({a: 1}), true);
    assert.equal(coll.reject({a: 0}).length, 4);
    assert.deepEqual(coll.reject({a: 4}), _.without(coll.models, model));
    assert.equal(coll.every({a: 0}), false);
    assert.equal(coll.every({b: 1}), true);
    assert.deepEqual(coll.partition({a: 0})[0], []);
    assert.deepEqual(coll.partition({a: 0})[1], coll.models);
    assert.deepEqual(coll.partition({a: 4})[0], [model]);
    assert.deepEqual(coll.partition({a: 4})[1], _.without(coll.models, model));
    assert.deepEqual(coll.map({a: 2}), [false, true, false, false]);
    assert.deepEqual(coll.map('a'), [1, 2, 3, 4]);
    assert.deepEqual(coll.sortBy('a')[3], model);
    assert.deepEqual(coll.sortBy('e')[0], model);
    assert.deepEqual(coll.countBy({a: 4}), {false: 3, true: 1});
    assert.deepEqual(coll.countBy('d'), {undefined: 4});
    assert.equal(coll.findIndex({b: 1}), 0);
    assert.equal(coll.findIndex({b: 9}), -1);
    assert.equal(coll.findLastIndex({b: 1}), 3);
    assert.equal(coll.findLastIndex({b: 9}), -1);
  });

  QUnit.test('reset', (assert) => {
    assert.expect(16);

    let resetCount = 0;
    const models = col.models;
    col.on('reset', () => { resetCount += 1; });
    col.reset([]);
    assert.equal(resetCount, 1);
    assert.equal(col.length, 0);
    assert.equal(col.last(), null);
    col.reset(models);
    assert.equal(resetCount, 2);
    assert.equal(col.length, 4);
    assert.equal(col.last(), d);
    col.reset(_.map(models, (m) => { return m.attributes; }));
    assert.equal(resetCount, 3);
    assert.equal(col.length, 4);
    assert.ok(col.last() !== d);
    assert.ok(_.isEqual(col.last().attributes, d.attributes));
    col.reset();
    assert.equal(col.length, 0);
    assert.equal(resetCount, 4);

    const f = new Backbone.Model({id: 20, label: 'f'});
    col.reset([undefined, f]);
    assert.equal(col.length, 2);
    assert.equal(resetCount, 5);

    col.reset(new Array(4));
    assert.equal(col.length, 4);
    assert.equal(resetCount, 6);
  });

  QUnit.test('reset with different values', (assert) => {
    const collection = new Backbone.Collection({id: 1});
    collection.reset({id: 1, a: 1});
    assert.equal(collection.get(1).get('a'), 1);
  });

  QUnit.test('same references in reset', (assert) => {
    const model = new Backbone.Model({id: 1});
    const collection = new Backbone.Collection({id: 1});
    collection.reset(model);
    assert.equal(collection.get(1), model);
  });

  QUnit.test('reset passes caller options', (assert) => {
    assert.expect(3);
    const Model = Backbone.Model.extend({
      initialize(attrs, options) {
        this.modelParameter = options.modelParameter;
      }
    });
    const collection = new (Backbone.Collection.extend({model: Model}))();
    collection.reset([{astring: 'green', anumber: 1}, {astring: 'blue', anumber: 2}], {modelParameter: 'model parameter'});
    assert.equal(collection.length, 2);
    collection.each((model) => {
      assert.equal(model.modelParameter, 'model parameter');
    });
  });

  QUnit.test('reset does not alter options by reference', (assert) => {
    assert.expect(2);
    const collection = new Backbone.Collection([{id: 1}]);
    const origOpts = {};
    collection.on('reset', (coll, opts) => {
      assert.equal(origOpts.previousModels, undefined);
      assert.equal(opts.previousModels[0].id, 1);
    });
    collection.reset([], origOpts);
  });

  QUnit.test('trigger custom events on models', (assert) => {
    assert.expect(1);
    let fired = null;
    a.on('custom', () => { fired = true; });
    a.trigger('custom');
    assert.equal(fired, true);
  });

  QUnit.test('add does not alter arguments', (assert) => {
    assert.expect(2);
    const attrs = {};
    const models = [attrs];
    new Backbone.Collection().add(models);
    assert.equal(models.length, 1);
    assert.ok(attrs === models[0]);
  });

  QUnit.test('#714: access `model.collection` in a brand new model.', (assert) => {
    assert.expect(2);
    const collection = new Backbone.Collection();
    collection.url = '/test';
    const Model = Backbone.Model.extend({
      set(attrs) {
        assert.equal(attrs.prop, 'value');
        assert.equal(this.collection, collection);
        return this;
      }
    });
    collection.model = Model;
    collection.create({prop: 'value'});
  });

  QUnit.test('#574, remove its own reference to the .models array.', (assert) => {
    assert.expect(2);
    const collection = new Backbone.Collection([
      {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}
    ]);
    assert.equal(collection.length, 6);
    collection.remove(collection.models);
    assert.equal(collection.length, 0);
  });

  QUnit.test('#861, adding models to a collection which do not pass validation, with validate:true', (assert) => {
    assert.expect(2);
    const Model = Backbone.Model.extend({
      validate(attrs) {
        if (attrs.id === 3) return "id can't be 3";
      }
    });

    const Collection = Backbone.Collection.extend({
      model: Model
    });

    const collection = new Collection();
    collection.on('invalid', () => { assert.ok(true); });

    collection.add([{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}], {validate: true});
    assert.deepEqual(collection.pluck('id'), [1, 2, 4, 5, 6]);
  });

  QUnit.test('Invalid models are discarded with validate:true.', (assert) => {
    assert.expect(5);
    const collection = new Backbone.Collection();
    collection.on('test', () => { assert.ok(true); });
    collection.model = Backbone.Model.extend({
      validate(attrs) { if (!attrs.valid) return 'invalid'; }
    });
    const model = new collection.model({id: 1, valid: true});
    collection.add([model, {id: 2}], {validate: true});
    model.trigger('test');
    assert.ok(collection.get(model.cid));
    assert.ok(collection.get(1));
    assert.ok(!collection.get(2));
    assert.equal(collection.length, 1);
  });

  QUnit.test('multiple copies of the same model', (assert) => {
    assert.expect(3);
    const collection = new Backbone.Collection();
    const model = new Backbone.Model();
    collection.add([model, model]);
    assert.equal(collection.length, 1);
    collection.add([{id: 1}, {id: 1}]);
    assert.equal(collection.length, 2);
    assert.equal(collection.last().id, 1);
  });

  QUnit.test('#964 - collection.get return inconsistent', (assert) => {
    assert.expect(2);
    const collection = new Backbone.Collection();
    assert.ok(collection.get(null) === undefined);
    assert.ok(collection.get() === undefined);
  });

  QUnit.test('#1112 - passing options.model sets collection.model', (assert) => {
    assert.expect(2);
    const Model = Backbone.Model.extend({});
    const collection = new Backbone.Collection([{id: 1}], {model: Model});
    assert.ok(collection.model === Model);
    assert.ok(collection.at(0) instanceof Model);
  });

  QUnit.test('null and undefined are invalid ids.', (assert) => {
    assert.expect(2);
    const model = new Backbone.Model({id: 1});
    const collection = new Backbone.Collection([model]);
    model.set({id: null});
    assert.ok(!collection.get('null'));
    model.set({id: 1});
    model.set({id: undefined});
    assert.ok(!collection.get('undefined'));
  });

  QUnit.test('falsy comparator', (assert) => {
    assert.expect(4);
    const Col = Backbone.Collection.extend({
      comparator(model) { return model.id; }
    });
    const collection = new Col();
    const colFalse = new Col(null, {comparator: false});
    const colNull = new Col(null, {comparator: null});
    const colUndefined = new Col(null, {comparator: undefined});
    assert.ok(collection.comparator);
    assert.ok(!colFalse.comparator);
    assert.ok(!colNull.comparator);
    assert.ok(colUndefined.comparator);
  });

  QUnit.test('#1355 - `options` is passed to success callbacks', (assert) => {
    assert.expect(2);
    const m = new Backbone.Model({x: 1});
    const collection = new Backbone.Collection();
    const opts = {
      opts: true,
      success(coll, resp, options) {
        assert.ok(options.opts);
      }
    };
    collection.sync = m.sync = function(method, coll, options) {
      options.success({});
    };
    collection.fetch(opts);
    collection.create(m, opts);
  });

  QUnit.test("#1412 - Trigger 'request' and 'sync' events.", (assert) => {
    assert.expect(4);
    const collection = new Backbone.Collection();
    collection.url = '/test';
    Backbone.ajax = function(settings) { settings.success(); };

    collection.on('request', (obj, xhr, options) => {
      assert.ok(obj === collection, "collection has correct 'request' event after fetching");
    });
    collection.on('sync', (obj, response, options) => {
      assert.ok(obj === collection, "collection has correct 'sync' event after fetching");
    });
    collection.fetch();
    collection.off();

    collection.on('request', (obj, xhr, options) => {
      assert.ok(obj === collection.get(1), "collection has correct 'request' event after one of its models save");
    });
    collection.on('sync', (obj, response, options) => {
      assert.ok(obj === collection.get(1), "collection has correct 'sync' event after one of its models save");
    });
    collection.create({id: 1});
    collection.off();
  });

  QUnit.test('#3283 - fetch, create calls success with context', (assert) => {
    assert.expect(2);
    const collection = new Backbone.Collection();
    collection.url = '/test';
    Backbone.ajax = function(settings) {
      settings.success.call(settings.context);
    };
    const obj = {};
    const options = {
      context: obj,
      success() {
        assert.equal(this, obj);
      }
    };

    collection.fetch(options);
    collection.create({id: 1}, options);
  });

  QUnit.test('#1447 - create with wait adds model.', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection();
    const model = new Backbone.Model();
    model.sync = function(method, m, options) { options.success(); };
    collection.on('add', () => { assert.ok(true); });
    collection.create(model, {wait: true});
  });

  QUnit.test('#1448 - add sorts collection after merge.', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection([
      {id: 1, x: 1},
      {id: 2, x: 2}
    ]);
    collection.comparator = function(model) { return model.get('x'); };
    collection.add({id: 1, x: 3}, {merge: true});
    assert.deepEqual(collection.pluck('id'), [2, 1]);
  });

  QUnit.test('#1655 - groupBy can be used with a string argument.', (assert) => {
    assert.expect(3);
    const collection = new Backbone.Collection([{x: 1}, {x: 2}]);
    const grouped = collection.groupBy('x');
    assert.strictEqual(_.keys(grouped).length, 2);
    assert.strictEqual(grouped[1][0].get('x'), 1);
    assert.strictEqual(grouped[2][0].get('x'), 2);
  });

  QUnit.test('#1655 - sortBy can be used with a string argument.', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection([{x: 3}, {x: 1}, {x: 2}]);
    const values = _.map(collection.sortBy('x'), (model) => {
      return model.get('x');
    });
    assert.deepEqual(values, [1, 2, 3]);
  });

  QUnit.test('#1604 - Removal during iteration.', (assert) => {
    assert.expect(0);
    const collection = new Backbone.Collection([{}, {}]);
    collection.on('add', () => {
      collection.at(0).destroy();
    });
    collection.add({}, {at: 0});
  });

  QUnit.test('#1638 - `sort` during `add` triggers correctly.', (assert) => {
    const collection = new Backbone.Collection();
    collection.comparator = function(model) { return model.get('x'); };
    const added = [];
    collection.on('add', (model) => {
      model.set({x: 3});
      collection.sort();
      added.push(model.id);
    });
    collection.add([{id: 1, x: 1}, {id: 2, x: 2}]);
    assert.deepEqual(added, [1, 2]);
  });

  QUnit.test('fetch parses models by default', function(assert) {
    assert.expect(1);
    const model = {};
    const Collection = Backbone.Collection.extend({
      url: 'test',
      model: Backbone.Model.extend({
        parse(resp) {
          assert.strictEqual(resp, model);
        }
      })
    });
    new Collection().fetch();
    this.ajaxSettings.success([model]);
  });

  QUnit.test("`sort` shouldn't always fire on `add`", (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection([{id: 1}, {id: 2}, {id: 3}], {
      comparator: 'id'
    });
    collection.sort = function() { assert.ok(true); };
    collection.add([]);
    collection.add({id: 1});
    collection.add([{id: 2}, {id: 3}]);
    collection.add({id: 4});
  });

  QUnit.test('#1407 parse option on constructor parses collection and models', (assert) => {
    assert.expect(2);
    const model = {
      namespace: [{id: 1}, {id: 2}]
    };
    const Collection = Backbone.Collection.extend({
      model: Backbone.Model.extend({
        parse(m) {
          m.name = 'test';
          return m;
        }
      }),
      parse(m) {
        return m.namespace;
      }
    });
    const collection = new Collection(model, {parse: true});

    assert.equal(collection.length, 2);
    assert.equal(collection.at(0).get('name'), 'test');
  });

  QUnit.test('#1407 parse option on reset parses collection and models', (assert) => {
    assert.expect(2);
    const model = {
      namespace: [{id: 1}, {id: 2}]
    };
    const Collection = Backbone.Collection.extend({
      model: Backbone.Model.extend({
        parse(m) {
          m.name = 'test';
          return m;
        }
      }),
      parse(m) {
        return m.namespace;
      }
    });
    const collection = new Collection();
    collection.reset(model, {parse: true});

    assert.equal(collection.length, 2);
    assert.equal(collection.at(0).get('name'), 'test');
  });

  QUnit.test('Reset includes previous models in triggered event.', (assert) => {
    assert.expect(1);
    const model = new Backbone.Model();
    const collection = new Backbone.Collection([model]);
    collection.on('reset', (coll, options) => {
      assert.deepEqual(options.previousModels, [model]);
    });
    collection.reset([]);
  });

  QUnit.test('set', (assert) => {
    const m1 = new Backbone.Model();
    const m2 = new Backbone.Model({id: 2});
    const m3 = new Backbone.Model();
    const collection = new Backbone.Collection([m1, m2]);

    // Test add/change/remove events
    collection.on('add', (model) => {
      assert.strictEqual(model, m3);
    });
    collection.on('change', (model) => {
      assert.strictEqual(model, m2);
    });
    collection.on('remove', (model) => {
      assert.strictEqual(model, m1);
    });

    // remove: false doesn't remove any models
    collection.set([], {remove: false});
    assert.strictEqual(collection.length, 2);

    // add: false doesn't add any models
    collection.set([m1, m2, m3], {add: false});
    assert.strictEqual(collection.length, 2);

    // merge: false doesn't change any models
    collection.set([m1, {id: 2, a: 1}], {merge: false});
    assert.strictEqual(m2.get('a'), void 0);

    // add: false, remove: false only merges existing models
    collection.set([m1, {id: 2, a: 0}, m3, {id: 4}], {add: false, remove: false});
    assert.strictEqual(collection.length, 2);
    assert.strictEqual(m2.get('a'), 0);

    // default options add/remove/merge as appropriate
    collection.set([{id: 2, a: 1}, m3]);
    assert.strictEqual(collection.length, 2);
    assert.strictEqual(m2.get('a'), 1);

    // Test removing models not passing an argument
    collection.off('remove').on('remove', (model) => {
      assert.ok(model === m2 || model === m3);
    });
    collection.set([]);
    assert.strictEqual(collection.length, 0);

    // Test null models on set doesn't clear collection
    collection.off();
    collection.set([{id: 1}]);
    collection.set();
    assert.strictEqual(collection.length, 1);
  });

  QUnit.test('set with only cids', (assert) => {
    assert.expect(3);
    const m1 = new Backbone.Model();
    const m2 = new Backbone.Model();
    const collection = new Backbone.Collection();
    collection.set([m1, m2]);
    assert.equal(collection.length, 2);
    collection.set([m1]);
    assert.equal(collection.length, 1);
    collection.set([m1, m1, m1, m2, m2], {remove: false});
    assert.equal(collection.length, 2);
  });

  QUnit.test('set with only idAttribute', (assert) => {
    assert.expect(3);
    const m1 = {_id: 1};
    const m2 = {_id: 2};
    const Col = Backbone.Collection.extend({
      model: Backbone.Model.extend({
        idAttribute: '_id'
      })
    });
    const collection = new Col();
    collection.set([m1, m2]);
    assert.equal(collection.length, 2);
    collection.set([m1]);
    assert.equal(collection.length, 1);
    collection.set([m1, m1, m1, m2, m2], {remove: false});
    assert.equal(collection.length, 2);
  });

  QUnit.test('set + merge with default values defined', (assert) => {
    const Model = Backbone.Model.extend({
      defaults: {
        key: 'value'
      }
    });
    const m = new Model({id: 1});
    const collection = new Backbone.Collection([m], {model: Model});
    assert.equal(collection.first().get('key'), 'value');

    collection.set({id: 1, key: 'other'});
    assert.equal(collection.first().get('key'), 'other');

    collection.set({id: 1, other: 'value'});
    assert.equal(collection.first().get('key'), 'other');
    assert.equal(collection.length, 1);
  });

  QUnit.test('merge without mutation', (assert) => {
    const Model = Backbone.Model.extend({
      initialize(attrs, options) {
        if (attrs.child) {
          this.set('child', new Model(attrs.child, options), options);
        }
      }
    });
    const Collection = Backbone.Collection.extend({model: Model});
    const data = [{id: 1, child: {id: 2}}];
    const collection = new Collection(data);
    assert.equal(collection.first().id, 1);
    collection.set(data);
    assert.equal(collection.first().id, 1);
    collection.set([{id: 2, child: {id: 2}}].concat(data));
    assert.deepEqual(collection.pluck('id'), [2, 1]);
  });

  QUnit.test('`set` and model level `parse`', (assert) => {
    const Model = Backbone.Model.extend({});
    const Collection = Backbone.Collection.extend({
      model: Model,
      parse(res) { return _.map(res.models, 'model'); }
    });
    const model = new Model({id: 1});
    const collection = new Collection(model);
    collection.set({models: [
      {model: {id: 1}},
      {model: {id: 2}}
    ]}, {parse: true});
    assert.equal(collection.first(), model);
  });

  QUnit.test('`set` data is only parsed once', (assert) => {
    const collection = new Backbone.Collection();
    collection.model = Backbone.Model.extend({
      parse(data) {
        assert.equal(data.parsed, void 0);
        data.parsed = true;
        return data;
      }
    });
    collection.set({}, {parse: true});
  });

  QUnit.test('`set` matches input order in the absence of a comparator', (assert) => {
    const one = new Backbone.Model({id: 1});
    const two = new Backbone.Model({id: 2});
    const three = new Backbone.Model({id: 3});
    const collection = new Backbone.Collection([one, two, three]);
    collection.set([{id: 3}, {id: 2}, {id: 1}]);
    assert.deepEqual(collection.models, [three, two, one]);
    collection.set([{id: 1}, {id: 2}]);
    assert.deepEqual(collection.models, [one, two]);
    collection.set([two, three, one]);
    assert.deepEqual(collection.models, [two, three, one]);
    collection.set([{id: 1}, {id: 2}], {remove: false});
    assert.deepEqual(collection.models, [two, three, one]);
    collection.set([{id: 1}, {id: 2}, {id: 3}], {merge: false});
    assert.deepEqual(collection.models, [one, two, three]);
    collection.set([three, two, one, {id: 4}], {add: false});
    assert.deepEqual(collection.models, [one, two, three]);
  });

  QUnit.test('#1894 - Push should not trigger a sort', (assert) => {
    assert.expect(0);
    const Collection = Backbone.Collection.extend({
      comparator: 'id',
      sort() { assert.ok(false); }
    });
    new Collection().push({id: 1});
  });

  QUnit.test('#2428 - push duplicate models, return the correct one', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection();
    const model1 = collection.push({id: 101});
    const model2 = collection.push({id: 101});
    assert.ok(model2.cid === model1.cid);
  });

  QUnit.test('`set` with non-normal id', (assert) => {
    const Collection = Backbone.Collection.extend({
      model: Backbone.Model.extend({idAttribute: '_id'})
    });
    const collection = new Collection({_id: 1});
    collection.set([{_id: 1, a: 1}], {add: false});
    assert.equal(collection.first().get('a'), 1);
  });

  QUnit.test('#1894 - `sort` can optionally be turned off', (assert) => {
    assert.expect(0);
    const Collection = Backbone.Collection.extend({
      comparator: 'id',
      sort() { assert.ok(false); }
    });
    new Collection().add({id: 1}, {sort: false});
  });

  QUnit.test('#1915 - `parse` data in the right order in `set`', (assert) => {
    const collection = new (Backbone.Collection.extend({
      parse(data) {
        assert.strictEqual(data.status, 'ok');
        return data.data;
      }
    }))();
    const res = {status: 'ok', data: [{id: 1}]};
    collection.set(res, {parse: true});
  });

  QUnit.test('#1939 - `parse` is passed `options`', (assert) => {
    const done = assert.async();
    assert.expect(1);
    const collection = new (Backbone.Collection.extend({
      url: '/',
      parse(data, options) {
        assert.strictEqual(options.xhr.someHeader, 'headerValue');
        return data;
      }
    }))();
    const ajax = Backbone.ajax;
    Backbone.ajax = function(params) {
      _.defer(params.success, []);
      return {someHeader: 'headerValue'};
    };
    collection.fetch({
      success() { done(); }
    });
    Backbone.ajax = ajax;
  });

  QUnit.test('fetch will pass extra options to success callback', function(assert) {
    assert.expect(1);
    const SpecialSyncCollection = Backbone.Collection.extend({
      url: '/test',
      sync(method, collection, options) {
        _.extend(options, {specialSync: true});
        return Backbone.Collection.prototype.sync.call(this, method, collection, options);
      }
    });

    const collection = new SpecialSyncCollection();

    const onSuccess = function(coll, resp, options) {
      assert.ok(options.specialSync, 'Options were passed correctly to callback');
    };

    collection.fetch({success: onSuccess});
    this.ajaxSettings.success();
  });

  QUnit.test('`add` only `sort`s when necessary', (assert) => {
    assert.expect(2);
    const collection = new (Backbone.Collection.extend({
      comparator: 'a'
    }))([{id: 1}, {id: 2}, {id: 3}]);
    collection.on('sort', () => { assert.ok(true); });
    collection.add({id: 4}); // do sort, new model
    collection.add({id: 1, a: 1}, {merge: true}); // do sort, comparator change
    collection.add({id: 1, b: 1}, {merge: true}); // don't sort, no comparator change
    collection.add({id: 1, a: 1}, {merge: true}); // don't sort, no comparator change
    collection.add(collection.models); // don't sort, nothing new
    collection.add(collection.models, {merge: true}); // don't sort
  });

  QUnit.test('`add` only `sort`s when necessary with comparator function', (assert) => {
    assert.expect(3);
    const collection = new (Backbone.Collection.extend({
      comparator(m1, m2) {
        return m1.get('a') > m2.get('a') ? 1 : (m1.get('a') < m2.get('a') ? -1 : 0);
      }
    }))([{id: 1}, {id: 2}, {id: 3}]);
    collection.on('sort', () => { assert.ok(true); });
    collection.add({id: 4}); // do sort, new model
    collection.add({id: 1, a: 1}, {merge: true}); // do sort, model change
    collection.add({id: 1, b: 1}, {merge: true}); // do sort, model change
    collection.add({id: 1, a: 1}, {merge: true}); // don't sort, no model change
    collection.add(collection.models); // don't sort, nothing new
    collection.add(collection.models, {merge: true}); // don't sort
  });

  QUnit.test('Attach options to collection.', (assert) => {
    assert.expect(2);
    const Model = Backbone.Model;
    const comparator = function() {};

    const collection = new Backbone.Collection([], {
      model: Model,
      comparator
    });

    assert.ok(collection.model === Model);
    assert.ok(collection.comparator === comparator);
  });

  QUnit.test('Pass falsey for `models` for empty Col with `options`', (assert) => {
    assert.expect(9);
    const opts = {a: 1, b: 2};
    _.forEach([undefined, null, false], (falsey) => {
      const Collection = Backbone.Collection.extend({
        initialize(models, options) {
          assert.strictEqual(models, falsey);
          assert.strictEqual(options, opts);
        }
      });

      const collection = new Collection(falsey, opts);
      assert.strictEqual(collection.length, 0);
    });
  });

  QUnit.test('`add` overrides `set` flags', (assert) => {
    const collection = new Backbone.Collection();
    collection.once('add', (model, coll, options) => {
      coll.add({id: 2}, options);
    });
    collection.set({id: 1});
    assert.equal(collection.length, 2);
  });

  QUnit.test('#2606 - Collection#create, success arguments', function(assert) {
    assert.expect(1);
    const collection = new Backbone.Collection();
    collection.url = 'test';
    collection.create({}, {
      success(model, resp, options) {
        assert.strictEqual(resp, 'response');
      }
    });
    this.ajaxSettings.success('response');
  });

  QUnit.test('#2612 - nested `parse` works with `Collection#set`', (assert) => {
    const Job = Backbone.Model.extend({
      constructor() {
        this.items = new Items();
        Backbone.Model.apply(this, arguments);
      },
      parse(attrs) {
        this.items.set(attrs.items, {parse: true});
        return _.omit(attrs, 'items');
      }
    });

    const Item = Backbone.Model.extend({
      constructor() {
        this.subItems = new Backbone.Collection();
        Backbone.Model.apply(this, arguments);
      },
      parse(attrs) {
        this.subItems.set(attrs.subItems, {parse: true});
        return _.omit(attrs, 'subItems');
      }
    });

    const Items = Backbone.Collection.extend({
      model: Item
    });

    const data = {
      name: 'JobName',
      id: 1,
      items: [{
        id: 1,
        name: 'Sub1',
        subItems: [
          {id: 1, subName: 'One'},
          {id: 2, subName: 'Two'}
        ]
      }, {
        id: 2,
        name: 'Sub2',
        subItems: [
          {id: 3, subName: 'Three'},
          {id: 4, subName: 'Four'}
        ]
      }]
    };

    const newData = {
      name: 'NewJobName',
      id: 1,
      items: [{
        id: 1,
        name: 'NewSub1',
        subItems: [
          {id: 1, subName: 'NewOne'},
          {id: 2, subName: 'NewTwo'}
        ]
      }, {
        id: 2,
        name: 'NewSub2',
        subItems: [
          {id: 3, subName: 'NewThree'},
          {id: 4, subName: 'NewFour'}
        ]
      }]
    };

    const job = new Job(data, {parse: true});
    assert.equal(job.get('name'), 'JobName');
    assert.equal(job.items.at(0).get('name'), 'Sub1');
    assert.equal(job.items.length, 2);
    assert.equal(job.items.get(1).subItems.get(1).get('subName'), 'One');
    assert.equal(job.items.get(2).subItems.get(3).get('subName'), 'Three');
    job.set(job.parse(newData, {parse: true}));
    assert.equal(job.get('name'), 'NewJobName');
    assert.equal(job.items.at(0).get('name'), 'NewSub1');
    assert.equal(job.items.length, 2);
    assert.equal(job.items.get(1).subItems.get(1).get('subName'), 'NewOne');
    assert.equal(job.items.get(2).subItems.get(3).get('subName'), 'NewThree');
  });

  QUnit.test('_addReference binds all collection events & adds to the lookup hashes', (assert) => {
    assert.expect(8);

    const calls = {add: 0, remove: 0};

    const Collection = Backbone.Collection.extend({

      _addReference(model) {
        Backbone.Collection.prototype._addReference.apply(this, arguments);
        calls.add++;
        assert.equal(model, this._byId[model.id]);
        assert.equal(model, this._byId[model.cid]);
        assert.equal(model._events.all.length, 1);
      },

      _removeReference(model) {
        Backbone.Collection.prototype._removeReference.apply(this, arguments);
        calls.remove++;
        assert.equal(this._byId[model.id], void 0);
        assert.equal(this._byId[model.cid], void 0);
        assert.equal(model.collection, void 0);
      }

    });

    const collection = new Collection();
    const model = collection.add({id: 1});
    collection.remove(model);

    assert.equal(calls.add, 1);
    assert.equal(calls.remove, 1);
  });

  QUnit.test('Do not allow duplicate models to be `add`ed or `set`', (assert) => {
    const collection = new Backbone.Collection();

    collection.add([{id: 1}, {id: 1}]);
    assert.equal(collection.length, 1);
    assert.equal(collection.models.length, 1);

    collection.set([{id: 1}, {id: 1}]);
    assert.equal(collection.length, 1);
    assert.equal(collection.models.length, 1);
  });

  QUnit.test('#3020: #set with {add: false} should not throw.', (assert) => {
    assert.expect(2);
    const collection = new Backbone.Collection();
    collection.set([{id: 1}], {add: false});
    assert.strictEqual(collection.length, 0);
    assert.strictEqual(collection.models.length, 0);
  });

  QUnit.test('create with wait, model instance, #3028', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection();
    const model = new Backbone.Model({id: 1});
    model.sync = function() {
      assert.equal(this.collection, collection);
    };
    collection.create(model, {wait: true});
  });

  QUnit.test('modelId', (assert) => {
    const Stooge = Backbone.Model.extend();
    const StoogeCollection = Backbone.Collection.extend({model: Stooge});

    // Default to using `Collection::model::idAttribute`.
    assert.equal(StoogeCollection.prototype.modelId({id: 1}), 1);
    Stooge.prototype.idAttribute = '_id';
    assert.equal(StoogeCollection.prototype.modelId({_id: 1}), 1);
  });

  QUnit.test('Polymorphic models work with "simple" constructors', (assert) => {
    const A = Backbone.Model.extend();
    const B = Backbone.Model.extend();
    const C = Backbone.Collection.extend({
      model(attrs) {
        return attrs.type === 'a' ? new A(attrs) : new B(attrs);
      }
    });
    const collection = new C([{id: 1, type: 'a'}, {id: 2, type: 'b'}]);
    assert.equal(collection.length, 2);
    assert.ok(collection.at(0) instanceof A);
    assert.equal(collection.at(0).id, 1);
    assert.ok(collection.at(1) instanceof B);
    assert.equal(collection.at(1).id, 2);
  });

  QUnit.test('Polymorphic models work with "advanced" constructors', (assert) => {
    const A = Backbone.Model.extend({idAttribute: '_id'});
    const B = Backbone.Model.extend({idAttribute: '_id'});
    let C = Backbone.Collection.extend({
      model: Backbone.Model.extend({
        constructor(attrs) {
          return attrs.type === 'a' ? new A(attrs) : new B(attrs);
        },

        idAttribute: '_id'
      })
    });
    let collection = new C([{_id: 1, type: 'a'}, {_id: 2, type: 'b'}]);
    assert.equal(collection.length, 2);
    assert.ok(collection.at(0) instanceof A);
    assert.equal(collection.at(0), collection.get(1));
    assert.ok(collection.at(1) instanceof B);
    assert.equal(collection.at(1), collection.get(2));

    C = Backbone.Collection.extend({
      model(attrs) {
        return attrs.type === 'a' ? new A(attrs) : new B(attrs);
      },

      modelId(attrs) {
        return `${attrs.type}-${attrs.id}`;
      }
    });
    collection = new C([{id: 1, type: 'a'}, {id: 1, type: 'b'}]);
    assert.equal(collection.length, 2);
    assert.ok(collection.at(0) instanceof A);
    assert.equal(collection.at(0), collection.get('a-1'));
    assert.ok(collection.at(1) instanceof B);
    assert.equal(collection.at(1), collection.get('b-1'));
  });

  QUnit.test('Collection with polymorphic models receives default id from modelId', (assert) => {
    assert.expect(6);
    // When the polymorphic models use 'id' for the idAttribute, all is fine.
    const C1 = Backbone.Collection.extend({
      model(attrs) {
        return new Backbone.Model(attrs);
      }
    });
    const c1 = new C1({id: 1});
    assert.equal(c1.get(1).id, 1);
    assert.equal(c1.modelId({id: 1}), 1);

    // If the polymorphic models define their own idAttribute,
    // the modelId method should be overridden, for the reason below.
    const M = Backbone.Model.extend({
      idAttribute: '_id'
    });
    const C2 = Backbone.Collection.extend({
      model(attrs) {
        return new M(attrs);
      }
    });
    const c2 = new C2({_id: 1});
    assert.equal(c2.get(1), void 0);
    assert.equal(c2.modelId(c2.at(0).attributes), void 0);
    const m = new M({_id: 2});
    c2.add(m);
    assert.equal(c2.get(2), void 0);
    assert.equal(c2.modelId(m.attributes), void 0);
  });

  QUnit.test('Collection implements Iterable, values is default iterator function', (assert) => {
    /* global Symbol */
    const $$iterator = typeof Symbol === 'function' && Symbol.iterator;
    // This test only applies to environments which define Symbol.iterator.
    if (!$$iterator) {
      assert.expect(0);
      return;
    }
    assert.expect(2);
    const collection = new Backbone.Collection([]);
    assert.strictEqual(collection[$$iterator], collection.values);
    const iterator = collection[$$iterator]();
    assert.deepEqual(iterator.next(), {value: void 0, done: true});
  });

  QUnit.test('Collection.values iterates models in sorted order', (assert) => {
    assert.expect(4);
    const one = new Backbone.Model({id: 1});
    const two = new Backbone.Model({id: 2});
    const three = new Backbone.Model({id: 3});
    const collection = new Backbone.Collection([one, two, three]);
    const iterator = collection.values();
    assert.strictEqual(iterator.next().value, one);
    assert.strictEqual(iterator.next().value, two);
    assert.strictEqual(iterator.next().value, three);
    assert.strictEqual(iterator.next().value, void 0);
  });

  QUnit.test('Collection.keys iterates ids in sorted order', (assert) => {
    assert.expect(4);
    const one = new Backbone.Model({id: 1});
    const two = new Backbone.Model({id: 2});
    const three = new Backbone.Model({id: 3});
    const collection = new Backbone.Collection([one, two, three]);
    const iterator = collection.keys();
    assert.strictEqual(iterator.next().value, 1);
    assert.strictEqual(iterator.next().value, 2);
    assert.strictEqual(iterator.next().value, 3);
    assert.strictEqual(iterator.next().value, void 0);
  });

  QUnit.test('Collection.entries iterates ids and models in sorted order', (assert) => {
    assert.expect(4);
    const one = new Backbone.Model({id: 1});
    const two = new Backbone.Model({id: 2});
    const three = new Backbone.Model({id: 3});
    const collection = new Backbone.Collection([one, two, three]);
    const iterator = collection.entries();
    assert.deepEqual(iterator.next().value, [1, one]);
    assert.deepEqual(iterator.next().value, [2, two]);
    assert.deepEqual(iterator.next().value, [3, three]);
    assert.strictEqual(iterator.next().value, void 0);
  });

  QUnit.test('#3039 #3951: adding at index fires with correct at', (assert) => {
    assert.expect(4);
    const collection = new Backbone.Collection([{val: 0}, {val: 4}]);
    collection.on('add', (model, coll, options) => {
      assert.equal(model.get('val'), options.index);
    });
    collection.add([{val: 1}, {val: 2}, {val: 3}], {at: 1});
    collection.add({val: 5}, {at: 10});
  });

  QUnit.test('#3039: index is not sent when at is not specified', (assert) => {
    assert.expect(2);
    const collection = new Backbone.Collection([{at: 0}]);
    collection.on('add', (model, coll, options) => {
      assert.equal(undefined, options.index);
    });
    collection.add([{at: 1}, {at: 2}]);
  });

  QUnit.test('#3199 - Order changing should trigger a sort', (assert) => {
    assert.expect(1);
    const one = new Backbone.Model({id: 1});
    const two = new Backbone.Model({id: 2});
    const three = new Backbone.Model({id: 3});
    const collection = new Backbone.Collection([one, two, three]);
    collection.on('sort', () => {
      assert.ok(true);
    });
    collection.set([{id: 3}, {id: 2}, {id: 1}]);
  });

  QUnit.test('#3199 - Adding a model should trigger a sort', (assert) => {
    assert.expect(1);
    const one = new Backbone.Model({id: 1});
    const two = new Backbone.Model({id: 2});
    const three = new Backbone.Model({id: 3});
    const collection = new Backbone.Collection([one, two, three]);
    collection.on('sort', () => {
      assert.ok(true);
    });
    collection.set([{id: 1}, {id: 2}, {id: 3}, {id: 0}]);
  });

  QUnit.test('#3199 - Order not changing should not trigger a sort', (assert) => {
    assert.expect(0);
    const one = new Backbone.Model({id: 1});
    const two = new Backbone.Model({id: 2});
    const three = new Backbone.Model({id: 3});
    const collection = new Backbone.Collection([one, two, three]);
    collection.on('sort', () => {
      assert.ok(false);
    });
    collection.set([{id: 1}, {id: 2}, {id: 3}]);
  });

  QUnit.test('add supports negative indexes', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection([{id: 1}]);
    collection.add([{id: 2}, {id: 3}], {at: -1});
    collection.add([{id: 2.5}], {at: -2});
    collection.add([{id: 0.5}], {at: -6});
    assert.equal(collection.pluck('id').join(','), '0.5,1,2,2.5,3');
  });

  QUnit.test('#set accepts options.at as a string', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection([{id: 1}, {id: 2}]);
    collection.add([{id: 3}], {at: '1'});
    assert.deepEqual(collection.pluck('id'), [1, 3, 2]);
  });

  QUnit.test('adding multiple models triggers `update` event once', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection();
    collection.on('update', () => { assert.ok(true); });
    collection.add([{id: 1}, {id: 2}, {id: 3}]);
  });

  QUnit.test('removing models triggers `update` event once', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection([{id: 1}, {id: 2}, {id: 3}]);
    collection.on('update', () => { assert.ok(true); });
    collection.remove([{id: 1}, {id: 2}]);
  });

  QUnit.test('remove does not trigger `update` when nothing removed', (assert) => {
    assert.expect(0);
    const collection = new Backbone.Collection([{id: 1}, {id: 2}]);
    collection.on('update', () => { assert.ok(false); });
    collection.remove([{id: 3}]);
  });

  QUnit.test('set triggers `set` event once', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection([{id: 1}, {id: 2}]);
    collection.on('update', () => { assert.ok(true); });
    collection.set([{id: 1}, {id: 3}]);
  });

  QUnit.test('set does not trigger `update` event when nothing added nor removed', (assert) => {
    const collection = new Backbone.Collection([{id: 1}, {id: 2}]);
    collection.on('update', (coll, options) => {
      assert.equal(options.changes.added.length, 0);
      assert.equal(options.changes.removed.length, 0);
      assert.equal(options.changes.merged.length, 2);
    });
    collection.set([{id: 1}, {id: 2}]);
  });

  QUnit.test('#3610 - invoke collects arguments', (assert) => {
    assert.expect(3);
    const Model = Backbone.Model.extend({
      method(x, y, z) {
        assert.equal(x, 1);
        assert.equal(y, 2);
        assert.equal(z, 3);
      }
    });
    const Collection = Backbone.Collection.extend({
      model: Model
    });
    const collection = new Collection([{id: 1}]);
    collection.invoke('method', 1, 2, 3);
  });

  QUnit.test('#3662 - triggering change without model will not error', (assert) => {
    assert.expect(1);
    const collection = new Backbone.Collection([{id: 1}]);
    const model = collection.first();
    collection.on('change', (m) => {
      assert.equal(m, undefined);
    });
    model.trigger('change');
  });

  QUnit.test('#3871 - falsy parse result creates empty collection', (assert) => {
    const collection = new (Backbone.Collection.extend({
      parse(data, options) {}
    }))();
    collection.set('', {parse: true});
    assert.equal(collection.length, 0);
  });

  QUnit.test("#3711 - remove's `update` event returns one removed model", (assert) => {
    const model = new Backbone.Model({id: 1, title: 'First Post'});
    const collection = new Backbone.Collection([model]);
    collection.on('update', (context, options) => {
      const changed = options.changes;
      assert.deepEqual(changed.added, []);
      assert.deepEqual(changed.merged, []);
      assert.strictEqual(changed.removed[0], model);
    });
    collection.remove(model);
  });

  QUnit.test("#3711 - remove's `update` event returns multiple removed models", (assert) => {
    const model = new Backbone.Model({id: 1, title: 'First Post'});
    const model2 = new Backbone.Model({id: 2, title: 'Second Post'});
    const collection = new Backbone.Collection([model, model2]);
    collection.on('update', (context, options) => {
      const changed = options.changes;
      assert.deepEqual(changed.added, []);
      assert.deepEqual(changed.merged, []);
      assert.ok(changed.removed.length === 2);

      assert.ok(_.indexOf(changed.removed, model) > -1 && _.indexOf(changed.removed, model2) > -1);
    });
    collection.remove([model, model2]);
  });

  QUnit.test("#3711 - set's `update` event returns one added model", (assert) => {
    const model = new Backbone.Model({id: 1, title: 'First Post'});
    const collection = new Backbone.Collection();
    collection.on('update', (context, options) => {
      const addedModels = options.changes.added;
      assert.ok(addedModels.length === 1);
      assert.strictEqual(addedModels[0], model);
    });
    collection.set(model);
  });

  QUnit.test("#3711 - set's `update` event returns multiple added models", (assert) => {
    const model = new Backbone.Model({id: 1, title: 'First Post'});
    const model2 = new Backbone.Model({id: 2, title: 'Second Post'});
    const collection = new Backbone.Collection();
    collection.on('update', (context, options) => {
      const addedModels = options.changes.added;
      assert.ok(addedModels.length === 2);
      assert.strictEqual(addedModels[0], model);
      assert.strictEqual(addedModels[1], model2);
    });
    collection.set([model, model2]);
  });

  QUnit.test("#3711 - set's `update` event returns one removed model", (assert) => {
    const model = new Backbone.Model({id: 1, title: 'First Post'});
    const model2 = new Backbone.Model({id: 2, title: 'Second Post'});
    const model3 = new Backbone.Model({id: 3, title: 'My Last Post'});
    const collection = new Backbone.Collection([model]);
    collection.on('update', (context, options) => {
      const changed = options.changes;
      assert.equal(changed.added.length, 2);
      assert.equal(changed.merged.length, 0);
      assert.ok(changed.removed.length === 1);
      assert.strictEqual(changed.removed[0], model);
    });
    collection.set([model2, model3]);
  });

  QUnit.test("#3711 - set's `update` event returns multiple removed models", (assert) => {
    const model = new Backbone.Model({id: 1, title: 'First Post'});
    const model2 = new Backbone.Model({id: 2, title: 'Second Post'});
    const model3 = new Backbone.Model({id: 3, title: 'My Last Post'});
    const collection = new Backbone.Collection([model, model2]);
    collection.on('update', (context, options) => {
      const removedModels = options.changes.removed;
      assert.ok(removedModels.length === 2);
      assert.strictEqual(removedModels[0], model);
      assert.strictEqual(removedModels[1], model2);
    });
    collection.set([model3]);
  });

  QUnit.test("#3711 - set's `update` event returns one merged model", (assert) => {
    const model = new Backbone.Model({id: 1, title: 'First Post'});
    const model2 = new Backbone.Model({id: 2, title: 'Second Post'});
    const model2Update = new Backbone.Model({id: 2, title: 'Second Post V2'});
    const collection = new Backbone.Collection([model, model2]);
    collection.on('update', (context, options) => {
      const mergedModels = options.changes.merged;
      assert.ok(mergedModels.length === 1);
      assert.strictEqual(mergedModels[0].get('title'), model2Update.get('title'));
    });
    collection.set([model2Update]);
  });

  QUnit.test("#3711 - set's `update` event returns multiple merged models", (assert) => {
    const model = new Backbone.Model({id: 1, title: 'First Post'});
    const modelUpdate = new Backbone.Model({id: 1, title: 'First Post V2'});
    const model2 = new Backbone.Model({id: 2, title: 'Second Post'});
    const model2Update = new Backbone.Model({id: 2, title: 'Second Post V2'});
    const collection = new Backbone.Collection([model, model2]);
    collection.on('update', (context, options) => {
      const mergedModels = options.changes.merged;
      assert.ok(mergedModels.length === 2);
      assert.strictEqual(mergedModels[0].get('title'), model2Update.get('title'));
      assert.strictEqual(mergedModels[1].get('title'), modelUpdate.get('title'));
    });
    collection.set([model2Update, modelUpdate]);
  });

  QUnit.test("#3711 - set's `update` event should not be triggered adding a model which already exists exactly alike", (assert) => {
    let fired = false;
    const model = new Backbone.Model({id: 1, title: 'First Post'});
    const collection = new Backbone.Collection([model]);
    collection.on('update', (context, options) => {
      fired = true;
    });
    collection.set([model]);
    assert.equal(fired, false);
  });

  QUnit.test('get models with `attributes` key', (assert) => {
    const model = {id: 1, attributes: {}};
    const collection = new Backbone.Collection([model]);
    assert.ok(collection.get(model));
  });
})(QUnit);
