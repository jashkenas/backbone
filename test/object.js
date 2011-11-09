$(document).ready(function() {

  module("Backbone.Object");

  test("Object: instanceof", function () {
    var Test1 = Backbone.Object.extend({});
    var Test2 = Test1.extend({});
    ok(new Test1() instanceof Backbone.Object);
    ok(new Test2() instanceof Backbone.Object);
    ok(new Test2() instanceof Test1);
  });

  test("Object: constructor property", function () {
    var Test1 = Backbone.Object.extend({});
    var inst = new Test1();
    strictEqual(Test1, inst.constructor);
  });

  test("Object: constructor can return different instance", function () {
    var testObj = {};
    var Test1 = Backbone.Object.extend({
      constructor: function () {
        return testObj;
      }
    });
    strictEqual(new Test1(), testObj);
  });

  test("Object: child constructor returns parent constructor return value", function () {
    var testObj = {};
    var Test1 = Backbone.Object.extend({
      constructor: function () {
        return testObj;
      }
    });
    var Test2 = Test1.extend({});
    strictEqual(new Test2(), testObj);
  });

  test("Object: __super__", function () {
    var Test1 = Backbone.Object.extend({});
    var Test2 = Test1.extend({});
    strictEqual(Test1.__super__, Backbone.Object.prototype);
    strictEqual(Test2.__super__, Test1.prototype);
  });
});
