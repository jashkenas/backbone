$(document).ready(function() {

  module("Backbone.Events");

  test("Events: bind and trigger", function() {
    var obj = { counter: 0 };
    _.extend(obj,Backbone.Events);
    obj.bind('event', function() { obj.counter += 1; });
    obj.trigger('event');
    equals(obj.counter,1,'counter should be incremented.');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    equals(obj.counter, 5, 'counter should be incremented five times.');
  });

  test("Events: bind, then unbind all functions", function() {
    var obj = { counter: 0 };
    _.extend(obj,Backbone.Events);
    var callback = function() { obj.counter += 1; };
    obj.bind('event', callback);
    obj.trigger('event');
    obj.unbind('event');
    obj.trigger('event');
    equals(obj.counter, 1, 'counter should have only been incremented once.');
  });

  test("Events: bind two callbacks, unbind only one", function() {
    var obj = { counterA: 0, counterB: 0 };
    _.extend(obj,Backbone.Events);
    var callback = function() { obj.counterA += 1; };
    obj.bind('event', callback);
    obj.bind('event', function() { obj.counterB += 1; });
    obj.trigger('event');
    obj.unbind('event', callback);
    obj.trigger('event');
    equals(obj.counterA, 1, 'counterA should have only been incremented once.');
    equals(obj.counterB, 2, 'counterB should have been incremented twice.');
  });

});