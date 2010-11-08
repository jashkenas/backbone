$(document).ready(function() {

  module("Backbone.sync");

  // Variable to catch the last request.
  window.lastRequest = null;

  // Stub out jQuery.ajax...
  $.ajax = function(obj) {
    lastRequest = obj;
  };

  var Library = Backbone.Collection.extend({
    url : function() { return '/library'; }
  });

  var library = new Library();

  var attrs = {
    title  : "The Tempest",
    author : "Bill Shakespeare",
    length : 123
  };

  test("sync: read", function() {
    Backbone.sync = originalSync;
    library.fetch();
    equals(lastRequest.url, '/library');
    equals(lastRequest.type, 'GET');
    equals(lastRequest.dataType, 'json');
    ok(_.isEmpty(lastRequest.data));
  });

  test("sync: create", function() {
    library.add(library.create(attrs));
    equals(lastRequest.url, '/library');
    equals(lastRequest.type, 'POST');
    equals(lastRequest.dataType, 'json');
    var data = JSON.parse(lastRequest.data);
    equals(data.title, 'The Tempest');
    equals(data.author, 'Bill Shakespeare');
    equals(data.length, 123);
  });


  test("sync: update", function() {
    library.first().save({id: '1-the-tempest', author: 'William Shakespeare'});
    equals(lastRequest.url, '/library/1-the-tempest');
    equals(lastRequest.type, 'PUT');
    equals(lastRequest.dataType, 'json');
    var data = JSON.parse(lastRequest.data);
    equals(data.id, '1-the-tempest');
    equals(data.title, 'The Tempest');
    equals(data.author, 'William Shakespeare');
    equals(data.length, 123);
  });

  test("sync: update with emulateHTTP and emulateJSON", function() {
    Backbone.emulateHTTP = Backbone.emulateJSON = true;
    library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'});
    equals(lastRequest.url, '/library/2-the-tempest');
    equals(lastRequest.type, 'POST');
    equals(lastRequest.dataType, 'json');
    equals(lastRequest.data._method, 'PUT');
    var data = JSON.parse(lastRequest.data.model);
    equals(data.id, '2-the-tempest');
    equals(data.author, 'Tim Shakespeare');
    equals(data.length, 123);
    Backbone.emulateHTTP = Backbone.emulateJSON = false;
  });

  test("sync: update with just emulateHTTP", function() {
    Backbone.emulateHTTP = true;
    library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'});
    equals(lastRequest.url, '/library/2-the-tempest');
    equals(lastRequest.type, 'POST');
    equals(lastRequest.contentType, 'application/json');
    var data = JSON.parse(lastRequest.data);
    equals(data.id, '2-the-tempest');
    equals(data.author, 'Tim Shakespeare');
    equals(data.length, 123);
    Backbone.emulateHTTP = false;
  });

  test("sync: update with just emulateJSON", function() {
    Backbone.emulateJSON = true;
    library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'});
    equals(lastRequest.url, '/library/2-the-tempest');
    equals(lastRequest.type, 'PUT');
    equals(lastRequest.contentType, 'application/x-www-form-urlencoded');
    var data = JSON.parse(lastRequest.data.model);
    equals(data.id, '2-the-tempest');
    equals(data.author, 'Tim Shakespeare');
    equals(data.length, 123);
    Backbone.emulateJSON = false;
  });

  test("sync: read model", function() {
    library.first().fetch();
    equals(lastRequest.url, '/library/2-the-tempest');
    equals(lastRequest.type, 'GET');
    ok(_.isEmpty(lastRequest.data));
  });

  test("sync: destroy", function() {
    library.first().destroy();
    equals(lastRequest.url, '/library/2-the-tempest');
    equals(lastRequest.type, 'DELETE');
    equals(lastRequest.data, null);
  });

  test("sync: destroy with emulateHTTP", function() {
    Backbone.emulateHTTP = Backbone.emulateJSON = true;
    library.first().destroy();
    equals(lastRequest.url, '/library/2-the-tempest');
    equals(lastRequest.type, 'POST');
    equals(JSON.stringify(lastRequest.data), '{"_method":"DELETE"}');
    Backbone.emulateHTTP = Backbone.emulateJSON = false;
  });

});
