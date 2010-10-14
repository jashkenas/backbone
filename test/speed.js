(function(){

  var object = {};
  _.extend(object, Backbone.Events);
  var fn = function(){};

  JSLitmus.test('Events: bind + unbind', function() {
    object.bind("event", fn);
    object.unbind("event", fn);
  });

  object.bind('test:trigger', fn);

  JSLitmus.test('Events: trigger', function() {
    object.trigger('test:trigger');
  });

  object.bind('test:trigger2', fn);
  object.bind('test:trigger2', fn);

  JSLitmus.test('Events: trigger 2 functions, passing 5 arguments', function() {
    object.trigger('test:trigger2', 1, 2, 3, 4, 5);
  });

})();