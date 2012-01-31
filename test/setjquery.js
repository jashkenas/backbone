$(document).ready(function() {

  // a mock object that looks sufficiently jQuery-ish
  var myLib = function() {
    return {
      attr: function() { return "spam" },
      html: function() { return "spam" },
      hasClass: function() { return "spam" }
    };
  };

  var viewAttrs = { id: 'test-setjquery', className: 'test-setjquery' }

  module("Backbone.setjQuery");

  test('Changing jQuery library to custom library', function() {
    Backbone.setjQuery(myLib);
    var view = new Backbone.View(viewAttrs);

    ok(view.$el.hasClass('test-setjquery') === 'spam');
  });

  test('Changing jQuery library back to global jQuery', function() {
    Backbone.setjQuery(jQuery);
    var view = new Backbone.View(viewAttrs);

    ok(view.$el.hasClass('test-setjquery'));
  });

});
