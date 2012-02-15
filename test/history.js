var Router = Backbone.Router.extend({
    initialize: function(){
        Backbone.history.start();       
    }
});

var RouterWithCheck = Backbone.Router.extend({
    initialize: function(){
        if(!Backbone.history.isHistoryStarted()){
            Backbone.history.start();
        }
    }
});

module("Backbone.history");
test("Testing history started method", function(){
    ok(Backbone.history.isHistoryStarted(), 'History should be started');
    
    raises(function(){
            new Router()
        }, 'Exception should be thrown');
        
    
    ok(new RouterWithCheck(), 'Nothing should happen here really...Just no exception');
});