$(document).ready(function() {

  module("Backbone.Collection");

  window.lastRequest = null;

  Backbone.sync = function() {
    lastRequest = _.toArray(arguments);
  };

  var a         = new Backbone.Model({id: 3, label: 'a'});
  var b         = new Backbone.Model({id: 2, label: 'b'});
  var c         = new Backbone.Model({id: 1, label: 'c'});
  var d         = new Backbone.Model({id: 0, label: 'd'});
  var e         = null;
  var col       = new Backbone.Collection([a,b,c,d]);
  var otherCol  = new Backbone.Collection();

  test("Collection: new and sort", function() {
    equals(col.first(), a, "a should be first");
    equals(col.last(), d, "d should be last");
    col.comparator = function(model) { return model.id; };
    col.sort();
    equals(col.first(), d, "d should be first");
    equals(col.last(), a, "a should be last");
    equals(col.length, 4);
  });

  test("Collection: get, getByCid", function() {
    equals(col.get(0), d);
    equals(col.get(2), b);
    equals(col.getByCid(col.first().cid), col.first());
  });

  test("Collection: get with non-default ids", function() {
    var col = new Backbone.Collection();
    var MongoModel = Backbone.Model.extend({
      idAttribute: '_id'
    });
    var model = new MongoModel({_id: 100});
    col.add(model);
    equals(col.get(100), model);
    model.set({_id: 101});
    equals(col.get(101), model);
  });

  test("Collection: update index when id changes", function() {
    var col = new Backbone.Collection();
    col.add([
      {id : 0, name : 'one'},
      {id : 1, name : 'two'}
    ]);
    var one = col.get(0);
    equals(one.get('name'), 'one');
    one.set({id : 101});
    equals(col.get(0), null);
    equals(col.get(101).get('name'), 'one');
  });

  test("Collection: at", function() {
    equals(col.at(2), b);
  });

  test("Collection: pluck", function() {
    equals(col.pluck('label').join(' '), 'd c b a');
  });

  test("Collection: add", function() {
    var added = opts = secondAdded = null;
    e = new Backbone.Model({id: 10, label : 'e'});
    otherCol.add(e);
    otherCol.bind('add', function() {
      secondAdded = true;
    });
    col.bind('add', function(model, collection, options){
      added = model.get('label');
      opts = options;
    });
    col.add(e, {amazing: true});
    equals(added, 'e');
    equals(col.length, 5);
    equals(col.last(), e);
    equals(otherCol.length, 1);
    equals(secondAdded, null);
    ok(opts.amazing);

    var f = new Backbone.Model({id: 20, label : 'f'});
    var g = new Backbone.Model({id: 21, label : 'g'});
    var h = new Backbone.Model({id: 22, label : 'h'});
    var atCol = new Backbone.Collection([f, g, h]);
    equals(atCol.length, 3);
    atCol.add(e, {at: 1});
    equals(atCol.length, 4);
    equals(atCol.at(1), e);
    equals(atCol.last(), h);
  });

  test("Collection: add model to collection twice", function() {
    try {
      // no id, same cid
      var a2 = new Backbone.Model({label: a.label});
      a2.cid = a.cid;
      col.add(a2);
      ok(false, "duplicate; expected add to fail");
    } catch (e) {
      equals(e.message, "Can't add the same model to a set twice,3");
    }
  });

  test("Collection: add model to multiple collections", function() {
    var counter = 0;
    var e = new Backbone.Model({id: 10, label : 'e'});
    e.bind('add', function(model, collection) {
      counter++;
      equals(e, model);
      if (counter > 1) {
        equals(collection, colF);
      } else {
        equals(collection, colE);
      }
    });
    var colE = new Backbone.Collection([]);
    colE.bind('add', function(model, collection) {
      equals(e, model);
      equals(colE, collection);
    });
    var colF = new Backbone.Collection([]);
    colF.bind('add', function(model, collection) {
      equals(e, model);
      equals(colF, collection);
    });
    colE.add(e);
    equals(e.collection, colE);
    colF.add(e);
    equals(e.collection, colE);
  });

  test("Collection: remove", function() {
    var removed = otherRemoved = null;
    col.bind('remove', function(model){ removed = model.get('label'); });
    otherCol.bind('remove', function(){ otherRemoved = true; });
    col.remove(e);
    equals(removed, 'e');
    equals(col.length, 4);
    equals(col.first(), d);
    equals(otherRemoved, null);
  });

  test("Collection: events are unbound on remove", function() {
    var counter = 0;
    var dj = new Backbone.Model();
    var emcees = new Backbone.Collection([dj]);
    emcees.bind('change', function(){ counter++; });
    dj.set({name : 'Kool'});
    equals(counter, 1);
    emcees.reset([]);
    equals(dj.collection, undefined);
    dj.set({name : 'Shadow'});
    equals(counter, 1);
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
    equals(passed, false);
    ok(colE.length == 0);
    colF.remove(e);
    ok(colF.length == 0);
    equals(passed, true);
  });

  test("Collection: remove same model in multiple collection", function() {
    var counter = 0;
    var e = new Backbone.Model({id: 5, title: 'Othello'});
    e.bind('remove', function(model, collection) {
      counter++;
      equals(e, model);
      if (counter > 1) {
        equals(collection, colE);
      } else {
        equals(collection, colF);
      }
    });
    var colE = new Backbone.Collection([e]);
    colE.bind('remove', function(model, collection) {
      equals(e, model);
      equals(colE, collection);
    });
    var colF = new Backbone.Collection([e]);
    colF.bind('remove', function(model, collection) {
      equals(e, model);
      equals(colF, collection);
    });
    equals(colE, e.collection);
    colF.remove(e);
    ok(colF.length == 0);
    ok(colE.length == 1);
    equals(counter, 1);
    equals(colE, e.collection);
    colE.remove(e);
    equals(null, e.collection);
    ok(colE.length == 0);
    equals(counter, 2);
  });

  test("Collection: model destroy removes from all collections", function() {
    var e = new Backbone.Model({id: 5, title: 'Othello'});
    e.sync = function(method, model, options) { options.success({}); };
    var colE = new Backbone.Collection([e]);
    var colF = new Backbone.Collection([e]);
    e.destroy();
    ok(colE.length == 0);
    ok(colF.length == 0);
    equals(null, e.collection);
  });

  test("Colllection: non-persisted model destroy removes from all collections", function() {
    var e = new Backbone.Model({title: 'Othello'});
    e.sync = function(method, model, options) { throw "should not be called"; };
    var colE = new Backbone.Collection([e]);
    var colF = new Backbone.Collection([e]);
    e.destroy();
    ok(colE.length == 0);
    ok(colF.length == 0);
    equals(null, e.collection);
  });

  test("Collection: fetch", function() {
    col.fetch();
    equals(lastRequest[0], 'read');
    equals(lastRequest[1], col);
  });

  test("Collection: create", function() {
    var model = col.create({label: 'f'});
    equals(lastRequest[0], 'create');
    equals(lastRequest[1], model);
    equals(model.get('label'), 'f');
    equals(model.collection, col);
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
    equals(col.create({"foo":"bar"}),false);
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
    equals(flag, true);
  });

  test("collection: initialize", function() {
    var Collection = Backbone.Collection.extend({
      initialize: function() {
        this.one = 1;
      }
    });
    var coll = new Collection;
    equals(coll.one, 1);
  });

  test("Collection: toJSON", function() {
    equals(JSON.stringify(col), '[{"id":0,"label":"d"},{"id":1,"label":"c"},{"id":2,"label":"b"},{"id":3,"label":"a"}]');
  });

  test("Collection: Underscore methods", function() {
    equals(col.map(function(model){ return model.get('label'); }).join(' '), 'd c b a');
    equals(col.any(function(model){ return model.id === 100; }), false);
    equals(col.any(function(model){ return model.id === 0; }), true);
    equals(col.indexOf(b), 2);
    equals(col.size(), 4);
    equals(col.rest().length, 3);
    ok(!_.include(col.rest()), a);
    ok(!_.include(col.rest()), d);
    ok(!col.isEmpty());
    ok(!_.include(col.without(d)), d);
    equals(col.max(function(model){ return model.id; }).id, 3);
    equals(col.min(function(model){ return model.id; }).id, 0);
    same(col.chain()
            .filter(function(o){ return o.id % 2 === 0; })
            .map(function(o){ return o.id * 2; })
            .value(),
         [0, 4]);
  });

  test("Collection: reset", function() {
    var resetCount = 0;
    var models = col.models;
    col.bind('reset', function() { resetCount += 1; });
    col.reset([]);
    equals(resetCount, 1);
    equals(col.length, 0);
    equals(col.last(), null);
    col.reset(models);
    equals(resetCount, 2);
    equals(col.length, 4);
    equals(col.last(), a);
    col.reset(_.map(models, function(m){ return m.attributes; }));
    equals(resetCount, 3);
    equals(col.length, 4);
    ok(col.last() !== a);
    ok(_.isEqual(col.last().attributes, a.attributes));
  });

  test("Collection: trigger custom events on models", function() {
    var fired = null;
    a.bind("custom", function() { fired = true; });
    a.trigger("custom");
    equals(fired, true);
  });

});
