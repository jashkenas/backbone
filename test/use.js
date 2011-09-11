$(document).ready(function() {

  var view = new Backbone.View({
    id        : 'test-use',
    className : 'test-use'
  });

  // a mock javascript library
  var myLib = function(){ return "spam" }

  module("Backbone.use");

  test('Backbone.use', function() {
    view.el = document.body;

    // switch to mock library and see if it is being used
    Backbone.use(myLib);
    ok(view.$('#qunit-header a') === 'spam');

    // switch back to jQuery and make sure it works
    Backbone.use(jQuery);
    ok(view.$('#qunit-header a').get(0).innerHTML.match(/Backbone Test Suite/));

  });

});