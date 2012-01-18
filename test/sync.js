$(document).ready(function() {

  module("Backbone.sync", {setup : function() {
    window.lastRequest = null;
    $.ajax = function(obj) {
      lastRequest = obj;
    };
  }});

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
    equal(lastRequest.url, '/library');
    equal(lastRequest.type, 'GET');
    equal(lastRequest.dataType, 'json');
    ok(_.isEmpty(lastRequest.data));
  });

  test("sync: passing data", function() {
    library.fetch({data: {a: 'a', one: 1}});
    equal(lastRequest.url, '/library');
    equal(lastRequest.data.a, 'a');
    equal(lastRequest.data.one, 1);
  });

  test("sync: create", function() {
    library.create(attrs, {wait: false});
    equal(lastRequest.url, '/library');
    equal(lastRequest.type, 'POST');
    equal(lastRequest.dataType, 'json');
    var data = JSON.parse(lastRequest.data);
    equal(data.title, 'The Tempest');
    equal(data.author, 'Bill Shakespeare');
    equal(data.length, 123);
  });

  test("sync: update", function() {
    library.first().save({id: '1-the-tempest', author: 'William Shakespeare'});
    equal(lastRequest.url, '/library/1-the-tempest');
    equal(lastRequest.type, 'PUT');
    equal(lastRequest.dataType, 'json');
    var data = JSON.parse(lastRequest.data);
    equal(data.id, '1-the-tempest');
    equal(data.title, 'The Tempest');
    equal(data.author, 'William Shakespeare');
    equal(data.length, 123);
  });

  test("sync: update with emulateHTTP and emulateJSON", function() {
    Backbone.emulateHTTP = Backbone.emulateJSON = true;
    library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'});
    equal(lastRequest.url, '/library/2-the-tempest');
    equal(lastRequest.type, 'POST');
    equal(lastRequest.dataType, 'json');
    equal(lastRequest.data._method, 'PUT');
    var data = JSON.parse(lastRequest.data.model);
    equal(data.id, '2-the-tempest');
    equal(data.author, 'Tim Shakespeare');
    equal(data.length, 123);
    Backbone.emulateHTTP = Backbone.emulateJSON = false;
  });

  test("sync: update with just emulateHTTP", function() {
    Backbone.emulateHTTP = true;
    library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'});
    equal(lastRequest.url, '/library/2-the-tempest');
    equal(lastRequest.type, 'POST');
    equal(lastRequest.contentType, 'application/json');
    var data = JSON.parse(lastRequest.data);
    equal(data.id, '2-the-tempest');
    equal(data.author, 'Tim Shakespeare');
    equal(data.length, 123);
    Backbone.emulateHTTP = false;
  });

  test("sync: update with just emulateJSON", function() {
    Backbone.emulateJSON = true;
    library.first().save({id: '2-the-tempest', author: 'Tim Shakespeare'});
    equal(lastRequest.url, '/library/2-the-tempest');
    equal(lastRequest.type, 'PUT');
    equal(lastRequest.contentType, 'application/x-www-form-urlencoded');
    var data = JSON.parse(lastRequest.data.model);
    equal(data.id, '2-the-tempest');
    equal(data.author, 'Tim Shakespeare');
    equal(data.length, 123);
    Backbone.emulateJSON = false;
  });

  test("sync: read model", function() {
    library.first().fetch();
    equal(lastRequest.url, '/library/2-the-tempest');
    equal(lastRequest.type, 'GET');
    ok(_.isEmpty(lastRequest.data));
  });

  test("sync: destroy", function() {
    library.first().destroy({wait: true});
    equal(lastRequest.url, '/library/2-the-tempest');
    equal(lastRequest.type, 'DELETE');
    equal(lastRequest.data, null);
  });

  test("sync: destroy with emulateHTTP", function() {
    Backbone.emulateHTTP = Backbone.emulateJSON = true;
    library.first().destroy();
    equal(lastRequest.url, '/library/2-the-tempest');
    equal(lastRequest.type, 'POST');
    equal(JSON.stringify(lastRequest.data), '{"_method":"DELETE"}');
    Backbone.emulateHTTP = Backbone.emulateJSON = false;
  });

  test("sync: urlError", function() {
    model = new Backbone.Model();
    raises(function() {
      model.fetch();
    });
    model.fetch({url: '/one/two'});
    equal(lastRequest.url, '/one/two');
  });

});
