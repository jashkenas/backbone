$(document).ready(function() {

  // a mock object that looks sufficiently jQuery-ish
  var myLib = function() {
    return {
      attr: function() { return "spam" },
      html: function() { return "spam" },
      hasClass: function() { return "spam" }
    };
  };

  var viewAttrs = { id: 'test-setdomlibrary', className: 'test-setdomlibrary' }

  module("Backbone.setDomLibrary");

  test('Changing jQuery library to custom library', function() {
    Backbone.setDomLibrary(myLib);
    var view = new Backbone.View(viewAttrs);

    ok(view.$el.hasClass('test-setdomlibrary') === 'spam');
  });

  test('Changing jQuery library back to global jQuery', function() {
    Backbone.setDomLibrary(jQuery);
    var view = new Backbone.View(viewAttrs);

    ok(view.$el.hasClass('test-setdomlibrary'));
  });

});
