var Events = require('./events'),
    Model = require('./model'),
    helpers = require('./helpers'),
    sync = require('./sync'),
    ArrayProto = Array.prototype;

// Provides a standard collection class for our sets of models, ordered
// or unordered. If a `comparator` is specified, the Collection will maintain
// its models in sort order, as they're added and removed.
module.exports = exports = function(models, options) {
  options || (options = {});
  if (options.model) this.model = options.model;
  if (options.comparator !== void 0) this.comparator = options.comparator;
  this._reset();
  this.initialize.apply(this, arguments);
  if (models) {
    if (options.parse) models = this.parse(models);
    this.reset(models, {silent: true, parse: options.parse});
  }
};

exports.extend = helpers.extend;

// Define the Collection's inheritable methods.
_.extend(exports.prototype, Events, {

  // The default model for a collection is just a **Backbone.Model**.
  // This should be overridden in most cases.
  model: Model,

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function(){},

  // The JSON representation of a Collection is an array of the
  // models' attributes.
  toJSON: function(options) {
    return this.map(function(model){ return model.toJSON(options); });
  },

  // Proxy `./sync.js` by default.
  sync: sync,

  // Add a model, or list of models to the set. Pass **silent** to avoid
  // firing the `add` event for every new model.
  add: function(models, options) {
    var i, args, length, model, existing;
    var at = options && options.at;
    models = _.isArray(models) ? models.slice() : [models];

    // Begin by turning bare objects into model references, and preventing
    // invalid models from being added.
    for (i = 0, length = models.length; i < length; i++) {
      if (models[i] = this._prepareModel(models[i], options)) continue;
      throw new Error("Can't add an invalid model to a collection");
    }

    for (i = models.length - 1; i >= 0; i--) {
      model = models[i];
      existing = model.id != null && this._byId[model.id];

      // If a duplicate is found, splice it out and optionally merge it into
      // the existing model.
      if (existing || this._byCid[model.cid]) {
        if (options && options.merge && existing) {
          existing.set(model, options);
        }
        models.splice(i, 1);
        continue;
      }

      // Listen to added models' events, and index models for lookup by
      // `id` and by `cid`.
      model.on('all', this._onModelEvent, this);
      this._byCid[model.cid] = model;
      if (model.id != null) this._byId[model.id] = model;
    }

    // Update `length` and splice in new models.
    this.length += models.length;
    args = [at != null ? at : this.models.length, 0];
    ArrayProto.push.apply(args, models);
    ArrayProto.splice.apply(this.models, args);

    // Sort the collection if appropriate.
    if (this.comparator && at == null) this.sort({silent: true});

    if (options && options.silent) return this;

    // Trigger `add` events.
    while (model = models.shift()) {
      model.trigger('add', model, this, options);
    }

    return this;
  },

  // Remove a model, or a list of models from the set. Pass silent to avoid
  // firing the `remove` event for every model removed.
  remove: function(models, options) {
    var i, l, index, model;
    options || (options = {});
    models = _.isArray(models) ? models.slice() : [models];
    for (i = 0, l = models.length; i < l; i++) {
      model = this.getByCid(models[i]) || this.get(models[i]);
      if (!model) continue;
      delete this._byId[model.id];
      delete this._byCid[model.cid];
      index = this.indexOf(model);
      this.models.splice(index, 1);
      this.length--;
      if (!options.silent) {
        options.index = index;
        model.trigger('remove', model, this, options);
      }
      this._removeReference(model);
    }
    return this;
  },

  // Add a model to the end of the collection.
  push: function(model, options) {
    model = this._prepareModel(model, options);
    this.add(model, options);
    return model;
  },

  // Remove a model from the end of the collection.
  pop: function(options) {
    var model = this.at(this.length - 1);
    this.remove(model, options);
    return model;
  },

  // Add a model to the beginning of the collection.
  unshift: function(model, options) {
    model = this._prepareModel(model, options);
    this.add(model, _.extend({at: 0}, options));
    return model;
  },

  // Remove a model from the beginning of the collection.
  shift: function(options) {
    var model = this.at(0);
    this.remove(model, options);
    return model;
  },

  // Slice out a sub-array of models from the collection.
  slice: function(begin, end) {
    return this.models.slice(begin, end);
  },

  // Get a model from the set by id.
  get: function(id) {
    if (id == null) return void 0;
    return this._byId[id.id != null ? id.id : id];
  },

  // Get a model from the set by client id.
  getByCid: function(cid) {
    return cid && this._byCid[cid.cid || cid];
  },

  // Get the model at the given index.
  at: function(index) {
    return this.models[index];
  },

  // Return models with matching attributes. Useful for simple cases of `filter`.
  where: function(attrs) {
    if (_.isEmpty(attrs)) return [];
    return this.filter(function(model) {
      for (var key in attrs) {
        if (attrs[key] !== model.get(key)) return false;
      }
      return true;
    });
  },

  // Force the collection to re-sort itself. You don't need to call this under
  // normal circumstances, as the set will maintain sort order as each item
  // is added.
  sort: function(options) {
    if (!this.comparator) {
      throw new Error('Cannot sort a set without a comparator');
    }

    if (_.isString(this.comparator) || this.comparator.length === 1) {
      this.models = this.sortBy(this.comparator, this);
    } else {
      this.models.sort(_.bind(this.comparator, this));
    }

    if (!options || !options.silent) this.trigger('reset', this, options);
    return this;
  },

  // Pluck an attribute from each model in the collection.
  pluck: function(attr) {
    return _.invoke(this.models, 'get', attr);
  },

  // When you have more items than you want to add or remove individually,
  // you can reset the entire set with a new list of models, without firing
  // any `add` or `remove` events. Fires `reset` when finished.
  reset: function(models, options) {
    for (var i = 0, l = this.models.length; i < l; i++) {
      this._removeReference(this.models[i]);
    }
    this._reset();
    if (models) this.add(models, _.extend({silent: true}, options));
    if (!options || !options.silent) this.trigger('reset', this, options);
    return this;
  },

  // Fetch the default set of models for this collection, resetting the
  // collection when they arrive. If `add: true` is passed, appends the
  // models to the collection instead of resetting.
  fetch: function(options) {
    options = options ? _.clone(options) : {};
    if (options.parse === void 0) options.parse = true;
    var collection = this;
    var success = options.success;
    options.success = function(resp, status, xhr) {
      collection[options.add ? 'add' : 'reset'](collection.parse(resp, xhr), options);
      if (success) success(collection, resp, options);
    };
    return this.sync('read', this, options);
  },

  // Create a new instance of a model in this collection. Add the model to the
  // collection immediately, unless `wait: true` is passed, in which case we
  // wait for the server to agree.
  create: function(model, options) {
    var collection = this;
    options = options ? _.clone(options) : {};
    model = this._prepareModel(model, options);
    if (!model) return false;
    if (!options.wait) collection.add(model, options);
    var success = options.success;
    options.success = function(model, resp, options) {
      if (options.wait) collection.add(model, options);
      if (success) success(model, resp, options);
    };
    model.save(null, options);
    return model;
  },

  // **parse** converts a response into a list of models to be added to the
  // collection. The default implementation is just to pass it through.
  parse: function(resp, xhr) {
    return resp;
  },

  // Create a new collection with an identical list of models as this one.
  clone: function() {
    return new this.constructor(this.models);
  },

  // Proxy to _'s chain. Can't be proxied the same way the rest of the
  // underscore methods are proxied because it relies on the underscore
  // constructor.
  chain: function() {
    return _(this.models).chain();
  },

  // Reset all internal state. Called when the collection is reset.
  _reset: function(options) {
    this.length = 0;
    this.models = [];
    this._byId  = {};
    this._byCid = {};
  },

  // Prepare a model or hash of attributes to be added to this collection.
  _prepareModel: function(attrs, options) {
    if (attrs instanceof Model) {
      if (!attrs.collection) attrs.collection = this;
      return attrs;
    }
    options || (options = {});
    options.collection = this;
    var model = new this.model(attrs, options);
    if (!model._validate(model.attributes, options)) return false;
    return model;
  },

  // Internal method to remove a model's ties to a collection.
  _removeReference: function(model) {
    if (this === model.collection) delete model.collection;
    model.off('all', this._onModelEvent, this);
  },

  // Internal method called every time a model in the set fires an event.
  // Sets need to update their indexes when models change ids. All other
  // events simply proxy through. "add" and "remove" events that originate
  // in other collections are ignored.
  _onModelEvent: function(event, model, collection, options) {
    if ((event === 'add' || event === 'remove') && collection !== this) return;
    if (event === 'destroy') this.remove(model, options);
    if (model && event === 'change:' + model.idAttribute) {
      delete this._byId[model.previous(model.idAttribute)];
      if (model.id != null) this._byId[model.id] = model;
    }
    this.trigger.apply(this, arguments);
  }

});

// Underscore methods that we want to implement on the Collection.
var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
  'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
  'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
  'max', 'min', 'sortedIndex', 'toArray', 'size', 'first', 'head', 'take',
  'initial', 'rest', 'tail', 'last', 'without', 'indexOf', 'shuffle',
  'lastIndexOf', 'isEmpty'];

// Mix in each Underscore method as a proxy to `Collection#models`.
_.each(methods, function(method) {
  exports.prototype[method] = function() {
    var args = ArrayProto.slice.call(arguments);
    args.unshift(this.models);
    return _[method].apply(_, args);
  };
});

// Underscore methods that take a property name as an argument.
var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

// Use attributes instead of properties.
_.each(attributeMethods, function(method) {
  exports.prototype[method] = function(value, context) {
    var iterator = _.isFunction(value) ? value : function(model) {
      return model.get(value);
    };
    return _[method](this.models, iterator, context);
  };
});
