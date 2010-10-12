$(document).ready(function() {
  module("Backbone View");
  
  var View = Backbone.View.extend({
    className : "view",
    render : function(){
      $('body').append(this.el);
    }
  });
  
  var view = new View();
  view.render();
  
  test("view: setMode", function(){
    view.setMode("active", "test");
    ok(view.el.hasClass("active_test"), "View should set modes");    
  });
});