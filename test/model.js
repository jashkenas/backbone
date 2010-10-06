$(document).ready(function() {

  module("Backbone model");

  // Variable to catch the last request.
  var lastRequest = null;

  // Stub out Backbone.request...
  Backbone.request = function() {
    lastRequest = _.toArray(arguments);
  };

  var attrs = {
    id     : '1-the-tempest',
    title  : "The Tempest",
    author : "Bill Shakespeare",
    length : 123
  };

  var doc = new Backbone.Model(attrs);

  var klass = Backbone.Collection.extend({
    url : function() { return '/collection'; }
  });

  var collection = new klass();
  collection.add(doc);

  test("model: attributes", function() {
    ok(doc.attributes() !== attrs, "Attributes are different objects.");
    ok(_.isEqual(doc.attributes(), attrs), "but with identical contents.");
  });

  test("model: url", function() {
    equals(doc.url(), '/collection/1-the-tempest');
  });

  test("model: toString", function() {
    equals(doc.toString(), 'Model 1-the-tempest');
  });

  test("model: clone", function() {
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

  test("model: isEqual", function() {
    attrs = { 'foo': 1, 'bar': 2, 'baz': 3};
    a = new Backbone.Model(attrs);
    b = new Backbone.Model(attrs);
    ok(a.isEqual(b), "a should equal b");
    c = new Backbone.Model({ 'foo': 1, 'bar': 2, 'baz': 3, 'qux': 4});
    ok(!a.isEqual(c), "a should not equal c");
  });

  test("model: isNew", function() {
    attrs = { 'foo': 1, 'bar': 2, 'baz': 3};
    a = new Backbone.Model(attrs);
    ok(a.isNew(), "it should be new");
    attrs = { 'foo': 1, 'bar': 2, 'baz': 3, 'id': -5 };
    ok(a.isNew(), "any defined ID is legal, negative or positive");
  });

  test("model: get", function() {
    equals(doc.get('title'), 'The Tempest');
    equals(doc.get('author'), 'Bill Shakespeare');
  });

  test("model: set and unset", function() {
    attrs = { 'foo': 1, 'bar': 2, 'baz': 3};
    a = new Backbone.Model(attrs);
    var changeCount = 0;
    a.bind("change:foo", function() { changeCount += 1; });
    a.set({'foo': 2});
    ok(a.get('foo')== 2, "Foo should have changed.");
    ok(changeCount == 1, "Change count should have incremented.");
    a.set({'foo': 2}); // set with value that is not new shouldn't fire change event
    ok(a.get('foo')== 2, "Foo should NOT have changed, still 2");
    ok(changeCount == 1, "Change count should NOT have incremented.");

    a.unset('foo');
    ok(a.get('foo')== null, "Foo should have changed");
    ok(changeCount == 2, "Change count should have incremented for unset.");
  });

  test("model: changed, hasChanged, changedAttributes, formerValue, formerAttributes", function() {
    var model = new Backbone.Model({name : "Tim", age : 10});
    model.bind('change', function() {
      ok(model.hasChanged('name'), 'name changed');
      ok(!model.hasChanged('age'), 'age did not');
      ok(_.isEqual(model.changedAttributes(), {name : 'Rob'}), 'changedAttributes returns the changed attrs');
      equals(model.formerValue('name'), 'Tim');
      ok(_.isEqual(model.formerAttributes(), {name : "Tim", age : 10}), 'formerAttributes is correct');
    });
    model.set({name : 'Rob'}, {silent : true});
    model.changed();
    equals(model.get('name'), 'Rob');
  });

  test("model: save", function() {
    doc.save({title : "Henry V"});
    equals(lastRequest[0], 'PUT');
    ok(_.isEqual(lastRequest[1], doc));
  });

  test("model: destroy", function() {
    doc.destroy();
    equals(lastRequest[0], 'DELETE');
    ok(_.isEqual(lastRequest[1], doc));
  });

});