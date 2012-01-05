$(document).ready(function() {

  module("Backbone.Model");

  // Variable to catch the last request.
  window.lastRequest = null;

  window.originalSync = Backbone.sync;

  // Stub out Backbone.request...
  Backbone.sync = function() {
    lastRequest = _.toArray(arguments);
  };

  var attrs = {
    id     : '1-the-tempest',
    title  : "The Tempest",
    author : "Bill Shakespeare",
    length : 123
  };

  var proxy = Backbone.Model.extend();
  var doc = new proxy(attrs);

  var klass = Backbone.Collection.extend({
    url : function() { return '/collection'; }
  });

  var collection = new klass();
  collection.add(doc);

  test("Model: initialize", function() {
    var Model = Backbone.Model.extend({
      initialize: function() {
        this.one = 1;
        equals(this.collection, collection);
      }
    });
    var model = new Model({}, {collection: collection});
    equals(model.one, 1);
    equals(model.collection, collection);
  });

  test("Model: initialize with attributes and options", function() {
    var Model = Backbone.Model.extend({
      initialize: function(attributes, options) {
        this.one = options.one;
      }
    });
    var model = new Model({}, {one: 1});
    equals(model.one, 1);
  });

  test("Model: initialize with parsed attributes", function() {
    var Model = Backbone.Model.extend({
      parse: function(obj) {
        obj.value += 1;
        return obj;
      }
    });
    var model = new Model({value: 1}, {parse: true});
    equals(model.get('value'), 2);
  });

  test("Model: url", function() {
    equals(doc.url(), '/collection/1-the-tempest');
    doc.collection.url = '/collection/';
    equals(doc.url(), '/collection/1-the-tempest');
    doc.collection = null;
    var failed = false;
    try {
      doc.url();
    } catch (e) {
      failed = true;
    }
    equals(failed, true);
    doc.collection = collection;
  });

  test("Model: url when using urlRoot, and uri encoding", function() {
    var Model = Backbone.Model.extend({
      urlRoot: '/collection'
    });
    var model = new Model();
    equals(model.url(), '/collection');
    model.set({id: '+1+'});
    equals(model.url(), '/collection/%2B1%2B');
  });

  test("Model: url when using urlRoot as a function to determine urlRoot at runtime", function() {
    var Model = Backbone.Model.extend({
      urlRoot: function() { return '/nested/' + this.get('parent_id') + '/collection'}
      // looks better in coffeescript: urlRoot: => "/nested/#{@get('parent_id')}/collection"
    });	

    var model = new Model({parent_id: 1});
    equals(model.url(), '/nested/1/collection');
    model.set({id: 2});
    equals(model.url(), '/nested/1/collection/2');
  });

  test("Model: clone", function() {
    attrs = { 'foo': 1, 'bar': 2, 'baz': 3};
    a = new Backbone.Model(attrs);
    b = a.clone();
    equals(a.get('foo'), 1);
    equals(a.get('bar'), 2);
    equals(a.get('baz'), 3);
    equals(b.get('foo'), a.get('foo'), "Foo should be the same on the clone.");
    equals(b.get('bar'), a.get('bar'), "Bar should be the same on the clone.");
    equals(b.get('baz'), a.get('baz'), "Baz should be the same on the clone.");
    a.set({foo : 100});
    equals(a.get('foo'), 100);
    equals(b.get('foo'), 1, "Changing a parent attribute does not change the clone.");
  });

  test("Model: isNew", function() {
    attrs = { 'foo': 1, 'bar': 2, 'baz': 3};
    a = new Backbone.Model(attrs);
    ok(a.isNew(), "it should be new");
    attrs = { 'foo': 1, 'bar': 2, 'baz': 3, 'id': -5 };
    a = new Backbone.Model(attrs);
    ok(!a.isNew(), "any defined ID is legal, negative or positive");
    attrs = { 'foo': 1, 'bar': 2, 'baz': 3, 'id': 0 };
    a = new Backbone.Model(attrs);
    ok(!a.isNew(), "any defined ID is legal, including zero");
    ok( new Backbone.Model({          }).isNew(), "is true when there is no id");
    ok(!new Backbone.Model({ 'id': 2  }).isNew(), "is false for a positive integer");
    ok(!new Backbone.Model({ 'id': -5 }).isNew(), "is false for a negative integer");
  });

  test("Model: get", function() {
    equals(doc.get('title'), 'The Tempest');
    equals(doc.get('author'), 'Bill Shakespeare');
  });

  test("Model: escape", function() {
    equals(doc.escape('title'), 'The Tempest');
    doc.set({audience: 'Bill & Bob'});
    equals(doc.escape('audience'), 'Bill &amp; Bob');
    doc.set({audience: 'Tim > Joan'});
    equals(doc.escape('audience'), 'Tim &gt; Joan');
    doc.set({audience: 10101});
    equals(doc.escape('audience'), '10101');
    doc.unset('audience');
    equals(doc.escape('audience'), '');
  });

  test("Model: has", function() {
    attrs = {};
    a = new Backbone.Model(attrs);
    equals(a.has("name"), false);
    _([true, "Truth!", 1, false, '', 0]).each(function(value) {
      a.set({'name': value});
      equals(a.has("name"), true);
    });
    a.unset('name');
    equals(a.has('name'), false);
    _([null, undefined]).each(function(value) {
      a.set({'name': value});
      equals(a.has("name"), false);
    });
  });

  test("Model: set and unset", function() {
    expect(8);
    attrs = {id: 'id', foo: 1, bar: 2, baz: 3};
    a = new Backbone.Model(attrs);
    var changeCount = 0;
    a.bind("change:foo", function() { changeCount += 1; });
    a.set({'foo': 2});
    ok(a.get('foo') == 2, "Foo should have changed.");
    ok(changeCount == 1, "Change count should have incremented.");
    a.set({'foo': 2}); // set with value that is not new shouldn't fire change event
    ok(a.get('foo') == 2, "Foo should NOT have changed, still 2");
    ok(changeCount == 1, "Change count should NOT have incremented.");

    a.validate = function(attrs) {
      equals(attrs.foo, void 0, 'ignore values when unsetting');
    };
    a.unset('foo');
    ok(a.get('foo') == null, "Foo should have changed");
    delete a.validate;
    ok(changeCount == 2, "Change count should have incremented for unset.");

    a.unset('id');
    equals(a.id, undefined, "Unsetting the id should remove the id property.");
  });

  test("Model: multiple unsets", function() {
    var i = 0;
    var counter = function(){ i++; };
    var model = new Backbone.Model({a: 1});
    model.bind("change:a", counter);
    model.set({a: 2});
    model.unset('a');
    model.unset('a');
    equals(i, 2, 'Unset does not fire an event for missing attributes.');
  });

  test("Model: unset and changedAttributes", function() {
    var model = new Backbone.Model({a: 1});
    model.unset('a', {silent: true});
    var changedAttributes = model.changedAttributes();
    ok('a' in changedAttributes, 'changedAttributes should contain unset properties');

    changedAttributes = model.changedAttributes();
    ok('a' in changedAttributes, 'changedAttributes should contain unset properties when running changedAttributes again after an unset.');
  });

  test("Model: using a non-default id attribute.", function() {
    var MongoModel = Backbone.Model.extend({idAttribute : '_id'});
    var model = new MongoModel({id: 'eye-dee', _id: 25, title: 'Model'});
    equals(model.get('id'), 'eye-dee');
    equals(model.id, 25);
    equals(model.isNew(), false);
    model.unset('_id');
    equals(model.id, undefined);
    equals(model.isNew(), true);
  });

  test("Model: set an empty string", function() {
    var model = new Backbone.Model({name : "Model"});
    model.set({name : ''});
    equals(model.get('name'), '');
  });

  test("Model: clear", function() {
    var changed;
    var model = new Backbone.Model({id: 1, name : "Model"});
    model.bind("change:name", function(){ changed = true; });
    model.bind("change", function() {
      var changedAttrs = model.changedAttributes();
      ok('name' in changedAttrs);
    });
    model.clear();
    equals(changed, true);
    equals(model.get('name'), undefined);
  });

  test("Model: defaults", function() {
    var Defaulted = Backbone.Model.extend({
      defaults: {
        "one": 1,
        "two": 2
      }
    });
    var model = new Defaulted({two: null});
    equals(model.get('one'), 1);
    equals(model.get('two'), null);
    Defaulted = Backbone.Model.extend({
      defaults: function() {
        return {
          "one": 3,
          "two": 4
        };
      }
    });
    var model = new Defaulted({two: null});
    equals(model.get('one'), 3);
    equals(model.get('two'), null);
  });

  test("Model: change, hasChanged, changedAttributes, previous, previousAttributes", function() {
    var model = new Backbone.Model({name : "Tim", age : 10});
    equals(model.changedAttributes(), false);
    model.bind('change', function() {
      ok(model.hasChanged('name'), 'name changed');
      ok(!model.hasChanged('age'), 'age did not');
      ok(_.isEqual(model.changedAttributes(), {name : 'Rob'}), 'changedAttributes returns the changed attrs');
      equals(model.previous('name'), 'Tim');
      ok(_.isEqual(model.previousAttributes(), {name : "Tim", age : 10}), 'previousAttributes is correct');
    });
    model.set({name : 'Rob'}, {silent : true});
    equals(model.hasChanged(), true);
    equals(model.hasChanged('name'), true);
    model.change();
    equals(model.get('name'), 'Rob');
  });

  test("Model: change with options", function() {
    var value;
    var model = new Backbone.Model({name: 'Rob'});
    model.bind('change', function(model, options) {
      value = options.prefix + model.get('name');
    });
    model.set({name: 'Bob'}, {silent: true});
    model.change({prefix: 'Mr. '});
    equals(value, 'Mr. Bob');
    model.set({name: 'Sue'}, {prefix: 'Ms. '});
    equals(value, 'Ms. Sue');
  });

  test("Model: change after initialize", function () {
    var changed = 0;
    var attrs = {id: 1, label: 'c'};
    var obj = new Backbone.Model(attrs);
    obj.bind('change', function() { changed += 1; });
    obj.set(attrs);
    equals(changed, 0);
  });

  test("Model: save within change event", function () {
    var model = new Backbone.Model({firstName : "Taylor", lastName: "Swift"});
    model.bind('change', function () {
      model.save();
      ok(_.isEqual(lastRequest[1], model));
    });
    model.set({lastName: 'Hicks'});
  });

  test("Model: validate after save", function() {
    var lastError, model = new Backbone.Model();
    model.validate = function(attrs) {
      if (attrs.admin) return "Can't change admin status.";
    };
    model.sync = function(method, model, options) {
      options.success.call(this, {admin: true});
    };
    model.save(null, {error: function(model, error) {
      console.log('erroring!');
      lastError = error;
    }});

    equals(lastError, "Can't change admin status.");
  });

  test("Model: save", function() {
    doc.save({title : "Henry V"});
    equals(lastRequest[0], 'update');
    ok(_.isEqual(lastRequest[1], doc));
  });

  test("Model: fetch", function() {
    doc.fetch();
    ok(lastRequest[0], 'read');
    ok(_.isEqual(lastRequest[1], doc));
  });

  test("Model: destroy", function() {
    doc.destroy();
    equals(lastRequest[0], 'delete');
    ok(_.isEqual(lastRequest[1], doc));
  });

  test("Model: non-persisted destroy", function() {
    attrs = { 'foo': 1, 'bar': 2, 'baz': 3};
    a = new Backbone.Model(attrs);
    a.sync = function() { throw "should not be called"; };
    ok(a.destroy(), "non-persisted model should not call sync");
  });

  test("Model: validate", function() {
    var lastError;
    var model = new Backbone.Model();
    model.validate = function(attrs) {
      if (attrs.admin) return "Can't change admin status.";
    };
    model.bind('error', function(model, error) {
      lastError = error;
    });
    var result = model.set({a: 100});
    equals(result, model);
    equals(model.get('a'), 100);
    equals(lastError, undefined);
    result = model.set({admin: true}, {silent: true});
    equals(lastError, undefined);
    equals(model.get('admin'), true);
    result = model.set({a: 200, admin: true});
    equals(result, false);
    equals(model.get('a'), 100);
    equals(lastError, "Can't change admin status.");
  });

  test("Model: validate on unset and clear", function() {
    var error;
    var model = new Backbone.Model({name: "One"});
    model.validate = function(attrs) {
      if ("name" in attrs) {
        if (!attrs.name) {
          error = true;
          return "No thanks.";
        }
      }
    };
    model.set({name: "Two"});
    equals(model.get('name'), 'Two');
    equals(error, undefined);
    model.unset('name');
    equals(error, true);
    equals(model.get('name'), 'Two');
    model.clear();
    equals(model.get('name'), 'Two');
    delete model.validate;
    model.clear();
    equals(model.get('name'), undefined);
  });

  test("Model: validate with error callback", function() {
    var lastError, boundError;
    var model = new Backbone.Model();
    model.validate = function(attrs) {
      if (attrs.admin) return "Can't change admin status.";
    };
    var callback = function(model, error) {
      lastError = error;
    };
    model.bind('error', function(model, error) {
      boundError = true;
    });
    var result = model.set({a: 100}, {error: callback});
    equals(result, model);
    equals(model.get('a'), 100);
    equals(lastError, undefined);
    equals(boundError, undefined);
    result = model.set({a: 200, admin: true}, {error: callback});
    equals(result, false);
    equals(model.get('a'), 100);
    equals(lastError, "Can't change admin status.");
    equals(boundError, undefined);
  });

  test("Model: defaults always extend attrs (#459)", function() {
    var Defaulted = Backbone.Model.extend({
      defaults: {one: 1},
      initialize : function(attrs, opts) {
        equals(attrs.one, 1);
      }
    });
    var providedattrs = new Defaulted({});
    var emptyattrs = new Defaulted();
  });

  test("Model: Inherit class properties", function() {
    var Parent = Backbone.Model.extend({
      instancePropSame: function() {},
      instancePropDiff: function() {}
    }, {
      classProp: function() {}
    });
    var Child = Parent.extend({
      instancePropDiff: function() {}
    });

    var adult = new Parent;
    var kid   = new Child;

    equals(Child.classProp, Parent.classProp);
    notEqual(Child.classProp, undefined);

    equals(kid.instancePropSame, adult.instancePropSame);
    notEqual(kid.instancePropSame, undefined);

    notEqual(Child.prototype.instancePropDiff, Parent.prototype.instancePropDiff);
    notEqual(Child.prototype.instancePropDiff, undefined);
  });

  test("Model: Nested change events don't clobber previous attributes", function() {
    var A = Backbone.Model.extend({
      initialize: function() {
        this.bind("change:state", function(a, newState) {
          equals(a.previous('state'), undefined);
          equals(newState, 'hello');
          // Fire a nested change event.
          this.set({ other: "whatever" });
        });
      }
    });

    var B = Backbone.Model.extend({
      initialize: function() {
        this.get("a").bind("change:state", function(a, newState) {
          equals(a.previous('state'), undefined);
          equals(newState, 'hello');
        });
      }
    });

    a = new A();
    b = new B({a: a});
    a.set({state: 'hello'});
  });

  test("Model: Multiple nested calls to set", function() {
    var counter = 0, model = new Backbone.Model({});
    model.bind('change', function() {
      counter++;
      model.set({b: 1});
      model.set({a: 1});
    })
    .set({a: 1});
    equal(counter, 1, 'change is only triggered once');
  });

});
