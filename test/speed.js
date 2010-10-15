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

  var model = new Backbone.Model;

  JSLitmus.test('Model: set Math.random()', function() {
    model.set({number: Math.random()});
  });

  var eventModel = new Backbone.Model;
  eventModel.bind('change', fn);

  JSLitmus.test('Model: set Math.random() with a change event', function() {
    eventModel.set({number: Math.random()});
  });

  var keyModel = new Backbone.Model;
  keyModel.bind('change:number', fn);

  JSLitmus.test('Model: set Math.random() with a key-value observer', function() {
    keyModel.set({number: Math.random()});
  });

})();