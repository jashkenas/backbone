$(document).ready(function() {

  module("Backbone model");

  test("model: clone", function() {
      attrs = { 'foo': 1, 'bar': 2, 'baz': 3};
      a = new Backbone.Model(attrs);
      b = a.clone();
      equals(b.foo,a.foo,"Foo should be the same on the clone.");
      equals(b.bar,a.bar,"Bar should be the same on the clone.");
      equals(b.baz,a.baz,"Baz should be the same on the clone.");
  });

});