$(document).ready(function() {

  var extend = Backbone.extend;
  var lastProtoProps, lastClassProps;

  module("Backbone.extend", {
    setup: function() {
      Backbone.extend = function(protoProps, classProps) {
        lastProtoProps = protoProps;
        lastClassProps = classProps;

        return extend.apply(this, arguments);
      }
    },

    teardown: function() {
      Backbone.extend = extend;
    }
  });

  test("extend: can be overriden", function() {
    var Model = Backbone.Model.extend({
      urlRoot: '/'
    });
    equal(lastProtoProps.urlRoot, Model.prototype.urlRoot);

    var Collection = Backbone.Collection.extend({
      model: Model
    });
    equal(lastProtoProps.model, Collection.prototype.model);

    var View = Backbone.View.extend({
      display: function() {}
    }, {
      anyDisplayed: true
    });
    equal(lastProtoProps.display, View.prototype.display);
    equal(lastClassProps.anyDisplayed, true);

    var Router = Backbone.Router.extend();
    ok(_.isUndefined(lastProtoProps));
    ok(_.isUndefined(lastProtoProps));
  });

});
