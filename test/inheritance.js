$(document).ready(function() {
  var BaseView;

  module("Backbone Inheritance", {

    setup: function() {
      BaseView = Backbone.View.extend({});
    }

  });

  test("replace base prototype.constructor", 1, function() {
    
    BaseView.prototype.constructor = function(){
      this.replacement = true;
      var args = Array.prototype.slice.apply(arguments);
      BaseView.apply(this, args);
    }

    var SubView = BaseView.extend({});
    var view = new SubView();

    equal(view.replacement, true);
  });


});
