(function(){

  var object = {};
  _.extend(object, Backbone.Events);
  var fn = function(){};

  JSLitmus.test('Events: bind + unbind', function() {
    object.on("event", fn);
    object.off("event", fn);
  });

  object.on('test:trigger', fn);

  JSLitmus.test('Events: trigger', function() {
    object.trigger('test:trigger');
  });

  object.on('test:trigger2', fn);
  object.on('test:trigger2', fn);

  JSLitmus.test('Events: trigger 2, passing 5 args', function() {
    object.trigger('test:trigger2', 1, 2, 3, 4, 5);
  });

  var model = new Backbone.Model;

  JSLitmus.test('Model: set Math.random()', function() {
    model.set({number: Math.random()});
  });

  var eventModel = new Backbone.Model;
  eventModel.on('change', fn);

  JSLitmus.test('Model: set rand() with an event', function() {
    eventModel.set({number: Math.random()});
  });

  var keyModel = new Backbone.Model;
  keyModel.on('change:number', fn);

  JSLitmus.test('Model: set rand() with an attribute observer', function() {
    keyModel.set({number: Math.random()});
  });

  var silentModel = new Backbone.Model;
  silentModel.on('change', fn);

  JSLitmus.test('Model: silent sets with rand(), with an attribute observer', function () {
    for (var i=0;i<10;i++) {
      silentModel.set({number:Math.random()}, {silent:true});
    }
    silentModel.set({number:'one'});
  });

})();
