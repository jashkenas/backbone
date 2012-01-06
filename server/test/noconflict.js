$(document).ready(function() {

  module("Backbone.noConflict");
  
  test('Backbone.noConflict', function() {
    var noconflictBackbone = Backbone.noConflict();
    equals(window.Backbone, undefined, 'Returned window.Backbone');
    window.Backbone = noconflictBackbone;
    equals(window.Backbone, noconflictBackbone, 'Backbone is still pointing to the original Backbone');
  });

});