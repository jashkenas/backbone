$(document).ready(function(jQuery) {

  // a mock object that looks sufficiently jQuery-ish
  var myLib = function() {
    return {
      attr: function() { return "spam" },
      html: function() { return "spam" },
      hasClass: function() { return "spam" }
    };
  };

  var viewAttrs = { id: 'test-setdomlibrary', className: 'test-setdomlibrary' }

  module("Backbone.setDomLibrary", {

    teardown: function() {
      Backbone.setDomLibrary(jQuery);
    }

  });

  test('Changing jQuery library to custom library', function() {
    Backbone.setDomLibrary(myLib);
    var view = new Backbone.View(viewAttrs);
    ok(view.$el.hasClass('test-setdomlibrary') === 'spam');
    Backbone.setDomLibrary(jQuery);
    var view = new Backbone.View(viewAttrs);
    ok(view.$el.hasClass('test-setdomlibrary'));
  });

});
