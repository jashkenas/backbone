$(document).ready(function() {

  var view;

  module("Backbone.Singleton", {
    setup: function(){
      TestRouter = function(){};
      _.extend( TestRouter, Backbone.Router );
      _.extend( TestRouter, Backbone.Singleton );
      
      TestView = function(){};
      _.extend( TestView, Backbone.View );
      _.extend( TestView, Backbone.Singleton );
      
      TestModel = function(){};
      _.extend( TestModel, Backbone.Model );
      _.extend( TestModel, Backbone.Singleton );
      
      TestCollection = function(){};
      _.extend( TestCollection, Backbone.Collection );
      _.extend( TestCollection, Backbone.Singleton );
    }
  });

  // backbone routers...

  test("Singleton Router via getInstance()", function() {
    var inst = TestRouter.getInstance();
    inst.foo = 'bar';
    equal( TestRouter.getInstance().foo, 'bar' );
    equal( TestRouter.getInstance(), inst );
  });
  
  test("Singleton Router via new TestRouter()", function() {
    var inst = new TestRouter();
    TestRouter.setInstance(inst);
    inst.foo = 'bar';
    equal( TestRouter.getInstance().foo, 'bar' );
    equal( TestRouter.getInstance(), inst );
  });
  
  // backbone views...
  
  test("Singleton View via getInstance()", function() {
    var inst = TestView.getInstance();
    inst.foo = 'bar';
    equal( TestView.getInstance().foo, 'bar' );
    equal( TestView.getInstance(), inst );
  });
  
  test("Singleton View via new TestView()", function() {
    var inst = new TestView();
    TestView.setInstance(inst);
    inst.foo = 'bar';
    equal( TestView.getInstance().foo, 'bar' );
    equal( TestView.getInstance(), inst );
  });
  
  // backbone collections...
  
  test("Singleton Collections via getInstance()", function() {
    var inst = TestCollection.getInstance();
    inst.foo = 'bar';
    equal( TestCollection.getInstance().foo, 'bar' );
    equal( TestCollection.getInstance(), inst );
  });
  
  test("Singleton Collections via new TestCollection()", function() {
    var inst = new TestCollection();
    TestCollection.setInstance(inst);
    inst.foo = 'bar';
    equal( TestCollection.getInstance().foo, 'bar' );
    equal( TestCollection.getInstance(), inst );
  });
  
  // backbone models...
  
  test("Singleton Model via getInstance()", function() {
    var inst = TestModel.getInstance();
    inst.foo = 'bar';
    equal( TestModel.getInstance().foo, 'bar' );
    equal( TestModel.getInstance(), inst );
  });
  
  test("Singleton Model via new TestModel()", function() {
    var inst = new TestModel();
    TestModel.setInstance(inst);
    inst.foo = 'bar';
    equal( TestModel.getInstance().foo, 'bar' );
    equal( TestModel.getInstance(), inst );
  });
  

});