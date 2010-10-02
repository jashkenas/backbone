$(document).ready(function() {

  module("Backbone bindable");

    test("bindable: bind and trigger", function() {
        var obj = { counter: 0 }
        _.extend(obj,Backbone.Bindable);
        obj.bind('foo',function() { obj.counter += 1; });
        obj.trigger('foo');
        equals(obj.counter,1,'counter should be incremented.');
        obj.trigger('foo');
        obj.trigger('foo');
        obj.trigger('foo');
        obj.trigger('foo');
        equals(obj.counter,5,'counter should be incremented five times.');
    });
  
    test("bindable: bind, then unbind all functions", function() {
        var obj = { counter: 0 }
        _.extend(obj,Backbone.Bindable);
        var callback = function() { obj.counter += 1; }
        obj.bind('foo', callback);
        obj.trigger('foo');
        obj.unbind('foo');
        obj.trigger('foo');
        equals(obj.counter,1,'counter should have only been incremented once.')
    });

    test("bindable: bind two callbacks, unbind only one", function() {
        var obj = { counterA: 0, counterB: 0 }
        _.extend(obj,Backbone.Bindable);
        var callback = function() { obj.counterA += 1; };
        obj.bind('foo', callback);
        obj.bind('foo', function() { obj.counterB += 1 });
        obj.trigger('foo');
        obj.unbind('foo', callback);
        obj.trigger('foo');
        equals(obj.counterA,1,'counterA should have only been incremented once.')
        equals(obj.counterB,2,'counterB should have been incremented twice.')
    });

});