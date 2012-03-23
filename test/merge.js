$(document).ready(function() {

  module("Backbone.merge", {

    setup : function() {
    },

    teardown: function() {
    }
    
  });

  var ACollection = Backbone.Collection.extend({});

  var a = {
    id     : 1,
    title  : "Book 1"
  };
  
  var b = {
    id     : 2,
    title  : "Book 2"
  };
  
  var c = {
    id     : 3,
    title  : "Book 3"
  };

  var d = {
    id     : 4,
    title  : "Book 4"
  };

  // Add
  test("merging new models into and empty collection, with defaults, adds them to the collection", function() {
    expect(4);
    var aCollection = new ACollection();
    aCollection.on('add', function(){ ok(true, 'item was added'); }, this);
    
    aCollection.merge([a, b, c]);
    equal(aCollection.length, 3);
  });

  test("merging new models into and empty collection, with adds enabled, adds them to the collection", function() {
    expect(4);
    var aCollection = new ACollection();
    aCollection.on('add', function(){ ok(true, 'item was added'); }, this);

    aCollection.merge([a, b, c], { add: true });
    equal(aCollection.length, 3);
  });

  test("merging new models into an empty collection, with adds disabled, does nothing", function(){
    var aCollection = new ACollection();
    aCollection.on('add', function(){ ok(false, 'item was added'); }, this);

    aCollection.merge([a, b, c], { add: false });
    equal(aCollection.length, 0);
  });

  // Update
  test("merging existing models into a collection, with defaults, updates the existing models in the collection", function(){
    expect(4);

    var aCollection = new ACollection([a, b, c]);
    aCollection.get(a.id).on('change', function(){ ok(true, "a changed"); }, this);
    aCollection.get(b.id).on('change', function(){ ok(true, "b changed"); }, this);
    aCollection.get(c.id).on('change', function(){ ok(true, "c changed"); }, this);

    aCollection.merge([{id: a.id, title: ''}, {id: b.id, title: ''}, {id: c.id, title: ''}]);

    equal(aCollection.length, 3);
  });

  test("merging existing models into a collection, with updates enabled, updates the existing models in the collection", function(){
    expect(4);

    var aCollection = new ACollection([a, b, c]);
    aCollection.get(a.id).on('change', function(){ ok(true, "a changed"); }, this);
    aCollection.get(b.id).on('change', function(){ ok(true, "b changed"); }, this);
    aCollection.get(c.id).on('change', function(){ ok(true, "c changed"); }, this);

    aCollection.merge([{id: a.id, title: ''}, {id: b.id, title: ''}, {id: c.id, title: ''}], { update: true });

    equal(aCollection.length, 3);
  });

  test("merging existing models into a collection, with updates disabled, does nothing", function(){
    var aCollection = new ACollection([a, b, c]);
    aCollection.get(a.id).on('change', function(){ ok(false, "a changed"); }, this);
    aCollection.get(b.id).on('change', function(){ ok(false, "b changed"); }, this);
    aCollection.get(c.id).on('change', function(){ ok(false, "c changed"); }, this);

    aCollection.merge([{id: a.id, title: ''}, {id: b.id, title: ''}, {id: c.id, title: ''}], { update: false });

    equal(aCollection.length, 3);
  });

  // Delete
  test("merging new model into a collection, with defaults, does not remove existing models", function(){
    var aCollection = new ACollection([a, b, c]);
    aCollection.get(a.id).on('remove', function(){ ok(false, "a changed"); }, this);
    aCollection.get(b.id).on('remove', function(){ ok(false, "b changed"); }, this);
    aCollection.get(c.id).on('remove', function(){ ok(false, "c changed"); }, this);

    aCollection.merge([d]);
  });

  test("merging new model into a collection, with delete enabled, removes the existing models", function(){
    expect(4);

    var aCollection = new ACollection([a, b, c]);
    aCollection.get(a.id).on('remove', function(){ ok(true, "a removed"); }, this);
    aCollection.get(b.id).on('remove', function(){ ok(true, "b removed"); }, this);
    aCollection.get(c.id).on('remove', function(){ ok(true, "c removed"); }, this);

    aCollection.merge([d], { 'delete': true });

    equal(aCollection.length, 1);
  });

  test("merging new model into a collection, with delete disabled, does not remove existing models", function(){
    var aCollection = new ACollection([a, b, c]);
    aCollection.get(a.id).on('remove', function(){ ok(false, "a changed"); }, this);
    aCollection.get(b.id).on('remove', function(){ ok(false, "b changed"); }, this);
    aCollection.get(c.id).on('remove', function(){ ok(false, "c changed"); }, this);

    aCollection.merge([d], { 'delete': false });

    equal(aCollection.length, 4);
  });

  // Add, Update, and Delete
  test("merging models into a collection, with add, update, and delete disabled, does nothing", function() {
    var aCollection = new ACollection([a, b, c]);
    aCollection.on('all', function(){ ok(false, 'collection changed'); }, this);
    
    aCollection.merge([{id: a.id, title:''}, {id: b.id, title: ''}, d], { 'add': false, 'update': false, 'delete': false });
    equal(aCollection.length, 3);
  });

  test("merging new, merging existing, and excluding some models at once, with add, update, and delete enabled, changes the collection", function(){
    expect(4);

    var aCollection = new ACollection([a, b, c]);
    aCollection.get(a.id).on('all', function(){ ok(false, "a changed"); }, this);
    aCollection.get(b.id).on('change', function(){ ok(true, "b changed"); }, this);
    aCollection.get(c.id).on('remove', function(){ ok(true, "c removed"); }, this);
    aCollection.on('add', function(item){ ok(item.id === d.id, "d added"); }, this);

    aCollection.merge([a, {id: b.id, title: ''}, d], { 'add': true, 'update': true, 'delete': true });

    equal(aCollection.length, 3);
  });

});
