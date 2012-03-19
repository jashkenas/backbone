$(document).ready(function() {

  var lastRequest = null;
  var sync = Backbone.sync;

  var a, b, c, d, e, col, otherCol;

  module("Backbone.Collection", {

    setup: function() {
      a         = new Backbone.Model({id: 3, label: 'a'});
      b         = new Backbone.Model({id: 2, label: 'b'});
      c         = new Backbone.Model({id: 1, label: 'c'});
      d         = new Backbone.Model({id: 0, label: 'd'});
      e         = null;
      col       = new Backbone.Collection([a,b,c,d]);
      otherCol  = new Backbone.Collection();

      Backbone.sync = function(method, model, options) {
        lastRequest = {
          method: method,
          model: model,
          options: options
        };
      };
    },

    teardown: function() {
      Backbone.sync = sync;
    }

  });

  test("Collection: new and sort", function() {
    equal(col.first(), a, "a should be first");
    equal(col.last(), d, "d should be last");
    col.comparator = function(a, b) {
      return a.id > b.id ? -1 : 1;
    };
    col.sort();
    equal(col.first(), a, "a should be first");
    equal(col.last(), d, "d should be last");
    col.comparator = function(model) { return model.id; };
    col.sort();
    equal(col.first(), d, "d should be first");
    equal(col.last(), a, "a should be last");
    equal(col.length, 4);
  });

  test("Collection: get, getByCid", function() {
    equal(col.get(0), d);
    equal(col.get(2), b);
    equal(col.getByCid(col.first().cid), col.first());
  });

  test("Collection: get with non-default ids", function() {
    var col = new Backbone.Collection();
    var MongoModel = Backbone.Model.extend({
      idAttribute: '_id'
    });
    var model = new MongoModel({_id: 100});
    col.push(model);
    equal(col.get(100), model);
    model.set({_id: 101});
    equal(col.get(101), model);
  });

  test("Collection: update index when id changes", function() {
    var col = new Backbone.Collection();
    col.add([
      {id : 0, name : 'one'},
      {id : 1, name : 'two'}
    ]);
    var one = col.get(0);
    equal(one.get('name'), 'one');
    one.set({id : 101});
    equal(col.get(0), null);
    equal(col.get(101).get('name'), 'one');
  });

  test("Collection: at", function() {
    equal(col.at(2), c);
  });

  test("Collection: pluck", function() {
    equal(col.pluck('label').join(' '), 'a b c d');
  });

  test("Collection: add", function() {
    var added, opts, secondAdded;
    added = opts = secondAdded = null;
    e = new Backbone.Model({id: 10, label : 'e'});
    otherCol.add(e);
    otherCol.bind('add', function() {
      secondAdded = true;
    });
    col.bind('add', function(model, collection, options){
      added = model.get('label');
      equal(options.index, 4);
      opts = options;
    });
    col.add(e, {amazing: true});
    equal(added, 'e');
    equal(col.length, 5);
    equal(col.last(), e);
    equal(otherCol.length, 1);
    equal(secondAdded, null);
    ok(opts.amazing);

    var f = new Backbone.Model({id: 20, label : 'f'});
    var g = new Backbone.Model({id: 21, label : 'g'});
    var h = new Backbone.Model({id: 22, label : 'h'});
    var atCol = new Backbone.Collection([f, g, h]);
    equal(atCol.length, 3);
    atCol.add(e, {at: 1});
    equal(atCol.length, 4);
    equal(atCol.at(1), e);
    equal(atCol.last(), h);
  });

  test("Collection: add multiple models", function() {
    var col = new Backbone.Collection([{at: 0}, {at: 1}, {at: 9}]);
    col.add([{at: 2}, {at: 3}, {at: 4}, {at: 5}, {at: 6}, {at: 7}, {at: 8}], {at: 2});
    for (var i = 0; i <= 5; i++) {
      equal(col.at(i).get('at'), i);
    }
  });

  test("Collection: can't add model to collection twice", function() {
    var col = new Backbone.Collection([{id: 1}, {id: 2}, {id: 1}, {id: 2}, {id: 3}]);
    equal(col.pluck('id').join(' '), '1 2 3');
  });

  test("Collection: can't add different model with same id to collection twice", function() {
    var col = new Backbone.Collection;
    col.unshift({id: 101});
    col.add({id: 101});
    equal(col.length, 1);
  });

  test("Collection: add model to multiple collections", function() {
    var counter = 0;
    var e = new Backbone.Model({id: 10, label : 'e'});
    e.bind('add', function(model, collection) {
      counter++;
      equal(e, model);
      if (counter > 1) {
        equal(collection, colF);
      } else {
        equal(collection, colE);
      }
    });
    var colE = new Backbone.Collection([]);
    colE.bind('add', function(model, collection) {
      equal(e, model);
      equal(colE, collection);
    });
    var colF = new Backbone.Collection([]);
    colF.bind('add', function(model, collection) {
      equal(e, model);
      equal(colF, collection);
    });
    colE.add(e);
    equal(e.collection, colE);
    colF.add(e);
    equal(e.collection, colE);
  });

  test("Collection: add model with parse", function() {
    var Model = Backbone.Model.extend({
      parse: function(obj) {
        obj.value += 1;
        return obj;
      }
    });

    var Col = Backbone.Collection.extend({model: Model});
    var col = new Col;
    col.add({value: 1}, {parse: true});
    equal(col.at(0).get('value'), 2);
  });

  test("Collection: add model to collection with sort()-style comparator", function() {
    var col = new Backbone.Collection;
    col.comparator = function(a, b) {
      return a.get('name') < b.get('name') ? -1 : 1;
    };
    var tom = new Backbone.Model({name: 'Tom'});
    var rob = new Backbone.Model({name: 'Rob'});
    var tim = new Backbone.Model({name: 'Tim'});
    col.add(tom);
    col.add(rob);
    col.add(tim);
    equal(col.indexOf(rob), 0);
    equal(col.indexOf(tim), 1);
    equal(col.indexOf(tom), 2);
  });

  test("Collection: comparator that depends on `this`", function() {
    var col = new Backbone.Collection;
    col.negative = function(num) {
      return -num;
    };
    col.comparator = function(a) {
      return this.negative(a.id);
    };
    col.add([{id: 1}, {id: 2}, {id: 3}]);
    equal(col.pluck('id').join(' '), '3 2 1');
  });

  test("Collection: remove", function() {
    var removed = null;
    var otherRemoved = null;
    col.bind('remove', function(model, col, options) {
      removed = model.get('label');
      equal(options.index, 3);
    });
    otherCol.bind('remove', function(model, col, options) {
      otherRemoved = true;
    });
    col.remove(d);
    equal(removed, 'd');
    equal(col.length, 3);
    equal(col.first(), a);
    equal(otherRemoved, null);
  });

  test("Collection: shift and pop", function() {
    var col = new Backbone.Collection([{a: 'a'}, {b: 'b'}, {c: 'c'}]);
    equal(col.shift().get('a'), 'a');
    equal(col.pop().get('c'), 'c');
  });

  test("Collection: events are unbound on remove", function() {
    var counter = 0;
    var dj = new Backbone.Model();
    var emcees = new Backbone.Collection([dj]);
    emcees.bind('change', function(){ counter++; });
    dj.set({name : 'Kool'});
    equal(counter, 1);
    emcees.reset([]);
    equal(dj.collection, undefined);
    dj.set({name : 'Shadow'});
    equal(counter, 1);
  });

  test("Collection: remove in multiple collections", function() {
    var modelData = {
      id : 5,
      title : 'Othello'
    };
    var passed = false;
    var e = new Backbone.Model(modelData);
    var f = new Backbone.Model(modelData);
    f.bind('remove', function() {
      passed = true;
    });
    var colE = new Backbone.Collection([e]);
    var colF = new Backbone.Collection([f]);
    ok(e != f);
    ok(colE.length == 1);
    ok(colF.length == 1);
    colE.remove(e);
    equal(passed, false);
    ok(colE.length == 0);
    colF.remove(e);
    ok(colF.length == 0);
    equal(passed, true);
  });

  test("Collection: remove same model in multiple collection", function() {
    var counter = 0;
    var e = new Backbone.Model({id: 5, title: 'Othello'});
    e.bind('remove', function(model, collection) {
      counter++;
      equal(e, model);
      if (counter > 1) {
        equal(collection, colE);
      } else {
        equal(collection, colF);
      }
    });
    var colE = new Backbone.Collection([e]);
    colE.bind('remove', function(model, collection) {
      equal(e, model);
      equal(colE, collection);
    });
    var colF = new Backbone.Collection([e]);
    colF.bind('remove', function(model, collection) {
      equal(e, model);
      equal(colF, collection);
    });
    equal(colE, e.collection);
    colF.remove(e);
    ok(colF.length == 0);
    ok(colE.length == 1);
    equal(counter, 1);
    equal(colE, e.collection);
    colE.remove(e);
    equal(null, e.collection);
    ok(colE.length == 0);
    equal(counter, 2);
  });

  test("Collection: model destroy removes from all collections", function() {
    var e = new Backbone.Model({id: 5, title: 'Othello'});
    e.sync = function(method, model, options) { options.success({}); };
    var colE = new Backbone.Collection([e]);
    var colF = new Backbone.Collection([e]);
    e.destroy();
    ok(colE.length == 0);
    ok(colF.length == 0);
    equal(undefined, e.collection);
  });

  test("Colllection: non-persisted model destroy removes from all collections", function() {
    var e = new Backbone.Model({title: 'Othello'});
    e.sync = function(method, model, options) { throw "should not be called"; };
    var colE = new Backbone.Collection([e]);
    var colF = new Backbone.Collection([e]);
    e.destroy();
    ok(colE.length == 0);
    ok(colF.length == 0);
    equal(undefined, e.collection);
  });

  test("Collection: fetch", function() {
    col.fetch();
    equal(lastRequest.method, 'read');
    equal(lastRequest.model, col);
    equal(lastRequest.options.parse, true);

    col.fetch({parse: false});
    equal(lastRequest.options.parse, false);
  });

  test("Collection: create", function() {
    var model = col.create({label: 'f'}, {wait: true});
    equal(lastRequest.method, 'create');
    equal(lastRequest.model, model);
    equal(model.get('label'), 'f');
    equal(model.collection, col);
  });

  test("Collection: create enforces validation", function() {
    var ValidatingModel = Backbone.Model.extend({
      validate: function(attrs) {
        return "fail";
      }
    });
    var ValidatingCollection = Backbone.Collection.extend({
      model: ValidatingModel
    });
    var col = new ValidatingCollection();
    equal(col.create({"foo":"bar"}), false);
  });

  test("Collection: a failing create runs the error callback", function() {
    var ValidatingModel = Backbone.Model.extend({
      validate: function(attrs) {
        return "fail";
      }
    });
    var ValidatingCollection = Backbone.Collection.extend({
      model: ValidatingModel
    });
    var flag = false;
    var callback = function(model, error) { flag = true; };
    var col = new ValidatingCollection();
    col.create({"foo":"bar"}, { error: callback });
    equal(flag, true);
  });

  test("collection: initialize", function() {
    var Collection = Backbone.Collection.extend({
      initialize: function() {
        this.one = 1;
      }
    });
    var coll = new Collection;
    equal(coll.one, 1);
  });

  test("Collection: toJSON", function() {
    equal(JSON.stringify(col), '[{"id":3,"label":"a"},{"id":2,"label":"b"},{"id":1,"label":"c"},{"id":0,"label":"d"}]');
  });

  test("Collection: where", function() {
    var coll = new Backbone.Collection([
      {a: 1},
      {a: 1},
      {a: 1, b: 2},
      {a: 2, b: 2},
      {a: 3}
    ]);
    equal(coll.where({a: 1}).length, 3);
    equal(coll.where({a: 2}).length, 1);
    equal(coll.where({a: 3}).length, 1);
    equal(coll.where({b: 1}).length, 0);
    equal(coll.where({b: 2}).length, 2);
    equal(coll.where({a: 1, b: 2}).length, 1);
  });

  test("Collection: Underscore methods", function() {
    equal(col.map(function(model){ return model.get('label'); }).join(' '), 'a b c d');
    equal(col.any(function(model){ return model.id === 100; }), false);
    equal(col.any(function(model){ return model.id === 0; }), true);
    equal(col.indexOf(b), 1);
    equal(col.size(), 4);
    equal(col.rest().length, 3);
    ok(!_.include(col.rest()), a);
    ok(!_.include(col.rest()), d);
    ok(!col.isEmpty());
    ok(!_.include(col.without(d)), d);
    equal(col.max(function(model){ return model.id; }).id, 3);
    equal(col.min(function(model){ return model.id; }).id, 0);
    same(col.chain()
            .filter(function(o){ return o.id % 2 === 0; })
            .map(function(o){ return o.id * 2; })
            .value(),
         [4, 0]);
  });

  test("Collection: reset", function() {
    var resetCount = 0;
    var models = col.models;
    col.bind('reset', function() { resetCount += 1; });
    col.reset([]);
    equal(resetCount, 1);
    equal(col.length, 0);
    equal(col.last(), null);
    col.reset(models);
    equal(resetCount, 2);
    equal(col.length, 4);
    equal(col.last(), d);
    col.reset(_.map(models, function(m){ return m.attributes; }));
    equal(resetCount, 3);
    equal(col.length, 4);
    ok(col.last() !== d);
    ok(_.isEqual(col.last().attributes, d.attributes));
  });

  test("Collection: reset passes caller options", function() {
    var Model = Backbone.Model.extend({
      initialize: function(attrs, options) {
        this.model_parameter = options.model_parameter;
      }
    });
    var col = new (Backbone.Collection.extend({ model: Model }))();
    col.reset([{ astring: "green", anumber: 1 }, { astring: "blue", anumber: 2 }], { model_parameter: 'model parameter' });
    equal(col.length, 2);
    col.each(function(model) {
      equal(model.model_parameter, 'model parameter');
    });
  });

  test("Collection: trigger custom events on models", function() {
    var fired = null;
    a.bind("custom", function() { fired = true; });
    a.trigger("custom");
    equal(fired, true);
  });

  test("Collection: add does not alter arguments", function(){
    var attrs = {};
    var models = [attrs];
    new Backbone.Collection().add(models);
    equal(models.length, 1);
    ok(attrs === models[0]);
  });

  test("#714: access `model.collection` in a brand new model.", 2, function() {
    var col = new Backbone.Collection;
    var Model = Backbone.Model.extend({
      set: function(attrs) {
        equal(attrs.prop, 'value');
        equal(this.collection, col);
        return this;
      }
    });
    col.model = Model;
    col.create({prop: 'value'});
  });

  test("#574, remove its own reference to the .models array.", function() {
    var col = new Backbone.Collection([
      {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}
    ]);
    equal(col.length, 6);
    col.remove(col.models);
    equal(col.length, 0);
  });

  test("#861, adding models to a collection which do not pass validation", function() {
    raises(function() {
      var Model = Backbone.Model.extend({
        validate: function(attrs) {
          if (attrs.id == 3) return "id can't be 3";
        }
      });

      var Collection = Backbone.Collection.extend({
        model: Model
      });

      var col = new Collection;

      col.add([{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}]);
    }, "Can't add an invalid model to a collection");
  });

  test("Collection: index with comparator", function() {
    expect(4);
    var counter = 0;
    var col = new Backbone.Collection([{id: 2}, {id: 4}], {
      comparator: function(model){ return model.id; }
    }).on('add', function(model, colleciton, options){
      if (model.id == 1) {
        equal(options.index, 0);
        equal(counter++, 0);
      }
      if (model.id == 3) {
        equal(options.index, 2);
        equal(counter++, 1);
      }
    });
    col.add([{id: 3}, {id: 1}]);
  });

  test("Collection: throwing during add leaves consistent state", function() {
    expect(4);
    var col = new Backbone.Collection();
    col.bind('test', function() { ok(false); });
    col.model = Backbone.Model.extend({
      validate: function(attrs){ if (!attrs.valid) return 'invalid'; }
    });
    var model = new col.model({id: 1, valid: true});
    raises(function() { col.add([model, {id: 2}]); });
    model.trigger('test');
    ok(!col.getByCid(model.cid));
    ok(!col.get(1));
    equal(col.length, 0);
  });

  test("Collection: multiple copies of the same model", function() {
    var col = new Backbone.Collection();
    var model = new Backbone.Model();
    col.add([model, model]);
    equal(col.length, 1);
    col.add([{id: 1}, {id: 1}]);
    equal(col.length, 2);
    equal(col.last().id, 1);
  });

  test("#964 - collection.get return in consistent", function() {
    var c = new Backbone.Collection();
    ok(c.get(null) === undefined);
    ok(c.get() === undefined);
  });

  test("#1112 - passing options.model sets collection.model", function() {
    var Model = Backbone.Model.extend({});
    var c = new Backbone.Collection([{id: 1}], {model: Model});
    ok(c.model === Model);
    ok(c.at(0) instanceof Model);
  });

});
