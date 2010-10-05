//    (c) 2010 Jeremy Ashkenas, DocumentCloud Inc.
//    Backbone may be freely distributed under the terms of the MIT license.
//    For all details and documentation:
//    http://documentcloud.github.com/backbone

(function(){

  // Initial Setup
  // -------------

  // The top-level namespace.
  var Backbone = {};

  // Keep the version in sync with `package.json`.
  Backbone.VERSION = '0.1.0';

  // Export for both CommonJS and the Browser.
  (typeof exports !== 'undefined' ? exports : this).Backbone = Backbone;

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // static properties to be extended.
  var inherits = function(parent, protoProps, classProps) {
    var child = protoProps.hasOwnProperty('constructor') ? protoProps.constructor :
                function(){ return parent.apply(this, arguments); };
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    _.extend(child.prototype, protoProps);
    if (classProps) _.extend(child, classProps);
    child.prototype.constructor = child;
    return child;
  };

  // Backbone.Bindable
  // -----------------

  // A module that can be mixed in to any object in order to provide it with
  // custom events. You may `bind` or `unbind` a callback function to an event;
  // `trigger`-ing an event fires all callbacks in succession.
  //
  //    _.extend(object, Backbone.Bindable);
  //    object.bind('expand', function(){ alert('expanded'); });
  //    object.trigger('expand');
  //
  Backbone.Bindable = {

    // Bind an event, specified by a string name, `ev`, to a `callback` function.
    // Passing `"all"` will bind the callback to all events fired.
    bind : function(ev, callback) {
      var calls = this._callbacks || (this._callbacks = {});
      var list  = this._callbacks[ev] || (this._callbacks[ev] = []);
      list.push(callback);
      return this;
    },

    // Remove one or many callbacks. If `callback` is null, removes all
    // callbacks for the event. If `ev` is null, removes all bound callbacks
    // for all events.
    unbind : function(ev, callback) {
      var calls;
      if (!ev) {
        this._callbacks = {};
      } else if (calls = this._callbacks) {
        if (!callback) {
          calls[ev] = [];
        } else {
          var list = calls[ev];
          if (!list) return this;
          for (var i = 0, l = list.length; i < l; i++) {
            if (callback === list[i]) {
              list.splice(i, 1);
              break;
            }
          }
        }
      }
      return this;
    },

    // Trigger an event, firing all bound callbacks.
    trigger : function(ev) {
      var calls = this._callbacks;
      for (var i = 0; i < 2; i++) {
        var list = calls && calls[i ? 'all' : ev];
        if (!list) continue;
        for (var j = 0, l = list.length; j < l; j++) {
          list[j].apply(this, arguments);
        }
      }
      return this;
    }

  };

  // Backbone.Model
  // --------------

  // Create a new model, with defined attributes.
  // If you do not specify the id, a negative id will be assigned for you.
  Backbone.Model = function(attributes) {
    this._attributes = {};
    attributes = attributes || {};
    this.set(attributes, true);
    this.cid = _.uniqueId('c');
    this._formerAttributes = this.attributes();
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Backbone.Model.prototype, Backbone.Bindable, {

    // A snapshot of the model's previous attributes, taken immediately
    // after the last `changed` event was fired.
    _formerAttributes : null,

    // Has the item been changed since the last `changed` event?
    _changed : false,

    // Create a new model with identical attributes to this one.
    clone : function() {
      return new (this.constructor)(this.attributes());
    },

    // Are this model's attributes identical to another model?
    isEqual : function(other) {
      return other && _.isEqual(this._attributes, other._attributes);
    },

    // A model is new if it has never been saved to the server, and has a negative
    // ID.
    isNew : function() {
      return !this.id;
    },

    // Call this method to fire manually fire a `changed` event for this model.
    // Calling this will cause all objects observing the model to update.
    changed : function() {
      this.trigger('change', this);
      this._formerAttributes = this.attributes();
      this._changed = false;
    },

    // Determine if the model has changed since the last `changed` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged : function(attr) {
      if (attr) return this._formerAttributes[attr] != this._attributes[attr];
      return this._changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `changed` event was fired.
    formerValue : function(attr) {
      if (!attr || !this._formerAttributes) return null;
      return this._formerAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `changed` event.
    formerAttributes : function() {
      return this._formerAttributes;
    },

    // Return an object containing all the attributes that have changed, or false
    // if there are no changed attributes. Useful for determining what parts of a
    // view need to be updated and/or what attributes need to be persisted to
    // the server.
    changedAttributes : function(now) {
      var old = this.formerAttributes(), now = now || this.attributes(), changed = false;
      for (var attr in now) {
        if (!_.isEqual(old[attr], now[attr])) {
          changed = changed || {};
          changed[attr] = now[attr];
        }
      }
      return changed;
    },

    // Set a hash of model attributes on the object, firing `changed` unless you
    // choose to silence it.
    set : function(attrs, options) {
      options || (options = {});
      if (!attrs) return this;
      attrs = attrs._attributes || attrs;
      var now = this._attributes;
      if (attrs.id) {
        this.id = attrs.id;
        if (this.collection) this.resource = this.collection.resource + '/' + this.id;
      }
      for (var attr in attrs) {
        var val = attrs[attr];
        if (val === '') val = null;
        if (!_.isEqual(now[attr], val)) {
          now[attr] = val;
          if (!options.silent) {
            this._changed = true;
            this.trigger('change:' + attr);
          }
        }
      }
      if (!options.silent && this._changed) this.changed();
      return this;
    },

    // Get the value of an attribute.
    get : function(attr) {
      return this._attributes[attr];
    },

    // Remove an attribute from the model, firing `changed` unless you choose to
    // silence it.
    unset : function(attr, options) {
      options || (options = {});
      var value = this._attributes[attr];
      delete this._attributes[attr];
      if (!options.silent) this.changed();
      return value;
    },

    // Return a copy of the model's attributes.
    attributes : function() {
      return _.clone(this._attributes);
    },

    // Bind all methods in the list to the model.
    bindAll : function() {
      _.bindAll.apply(_, [this].concat(arguments));
    },

    toString : function() {
      return 'Model ' + this.id;
    },

    // The URL of the model's representation on the server.
    url : function() {
      var base = this.collection.url();
      if (this.isNew()) return base;
      return base + '/' + this.id;
    },

    // Set a hash of model attributes, and sync the model to the server.
    save : function(attrs, options) {
      attrs   || (attrs = {});
      options || (options = {});
      this.set(attrs, options);
      var model = this;
      var success = function(resp) {
        model.set(resp.model);
        if (options.success) options.success(model, resp);
      };
      var method = this.isNew() ? 'POST' : 'PUT';
      Backbone.request(method, this, success, options.error);
      return this;
    },

    // Destroy this model on the server.
    destroy : function(options) {
      options || (options = {});
      var model = this;
      var success = function(resp) {
        if (model.collection) model.collection.remove(model);
        if (options.success) options.success(model, resp);
      };
      Backbone.request('DELETE', this, success, options.error);
      return this;
    }

  });

  // Backbone.Collection
  // -------------------

  // Provides a standard collection class for our sets of models, ordered
  // or unordered. If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  Backbone.Collection = function(models, options) {
    if (options && options.comparator) {
      this.comparator = options.comparator;
      delete options.comparator;
    }
    this._boundOnModelEvent = _.bind(this._onModelEvent, this);
    this._initialize();
    if (models) this.refresh(models,true);
  };

  // Define the Collection's inheritable methods.
  _.extend(Backbone.Collection.prototype, Backbone.Bindable, {

    // Initialize or re-initialize all internal state. Called when the
    // collection is refreshed.
    _initialize : function() {
      this.length = 0;
      this.models = [];
      this._byId = {};
      this._byCid = {};
    },

    // Get a model from the set by id.
    get : function(id) {
      return id && this._byId[id.id || id];
    },

    // Get a model from the set by client id.
    getByCid : function(cid) {
      return cid && this._byCid[cid.cid || cid];
    },

    // What are the ids for every model in the set?
    getIds : function() {
      return _.keys(this._byId);
    },

    // What are the client ids for every model in the set?
    getCids : function() {
      return _.keys(this._byCid);
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Add a model, or list of models to the set. Pass silent to avoid firing
    // the `added` event for every new model.
    add : function(models, silent) {
      if (!_.isArray(models)) return this._add(models, silent);
      for (var i=0; i<models.length; i++) this._add(models[i], silent);
      return models;
    },

    // Internal implementation of adding a single model to the set.
    _add : function(model, silent) {
      var already = this.get(model);
      if (already) throw new Error(["Can't add the same model to a set twice", already.id]);
      this._byId[model.id] = model;
      this._byCid[model.cid] = model;
      model.collection = this;
      var index = this.comparator ? this.sortedIndex(model, this.comparator) : this.length;
      this.models.splice(index, 0, model);
      model.bind('all', this._boundOnModelEvent);
      this.length++;
      if (!silent) this.trigger('add', model);
      return model;
    },

    // Remove a model, or a list of models from the set. Pass silent to avoid
    // firing the `removed` event for every model removed.
    remove : function(models, silent) {
      if (!_.isArray(models)) return this._remove(models, silent);
      for (var i=0; i<models.length; i++) this._remove(models[i], silent);
      return models;
    },

    // Internal implementation of removing a single model from the set.
    _remove : function(model, silent) {
      model = this.get(model);
      if (!model) return null;
      delete this._byId[model.id];
      delete this._byCid[model.cid];
      delete model.collection;
      this.models.splice(this.indexOf(model), 1);
      model.unbind('all', this._boundOnModelEvent);
      this.length--;
      if (!silent) this.trigger('remove', model);
      return model;
    },

    // When you have more items than you want to add or remove individually,
    // you can refresh the entire set with a new list of models, without firing
    // any `added` or `removed` events. Fires `refreshed` when finished.
    refresh : function(models, silent) {
      models = models || [];
      var collection = this;
      if (models[0] && !(models[0] instanceof Backbone.Model)) {
        models = _.map(models, function(attrs, i) {
          return new collection.model(attrs);
        });
      }
      this._initialize();
      this.add(models, true);
      if (!silent) this.trigger('refresh');
    },

    // Fetch the default set of models for this collection, refreshing the
    // collection.
    fetch : function(options) {
      options || (options = {});
      var collection = this;
      var success = function(resp) {
        collection.refresh(resp.models);
        if (options.success) options.success(collection, resp);
      };
      Backbone.request('GET', this, success, options.error);
    },

    // Create a new instance of a model in this collection.
    create : function(model, options) {
      options || (options = {});
      if (!(model instanceof Backbone.Model)) model = new this.model(model);
      model.collection = this;
      var success = function(model, resp) {
        model.collection.add(model);
        if (options.success) options.success(model, resp);
      };
      model.save(null, {success : success, error : options.error});
    },

    // Force the set to re-sort itself. You don't need to call this under normal
    // circumstances, as the set will maintain sort order as each item is added.
    sort : function(silent) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      this.models = this.sortBy(this.comparator);
      if (!silent) this.trigger('refresh');
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids.
    _onModelEvent : function(ev, model) {
      if (ev == 'change') {
        if (model.hasChanged('id')) {
          delete this._byId[model.formerValue('id')];
          this._byId[model.id] = model;
        }
        this.trigger('change', model);
      }
    },

    // Inspect.
    toString : function() {
      return 'Set (' + this.length + " models)";
    }

  });

  // Underscore methods that we want to implement on the Collection.
  var methods = ['each', 'map', 'reduce', 'reduceRight', 'detect', 'select',
    'reject', 'all', 'any', 'include', 'invoke', 'pluck', 'max', 'min', 'sortBy',
    'sortedIndex', 'toArray', 'size', 'first', 'rest', 'last', 'without',
    'indexOf', 'lastIndexOf', 'isEmpty'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Backbone.Collection.prototype[method] = function() {
      return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
    };
  });

  // Backbone.View
  // -------------

  Backbone.View = function(options) {
    this.modes = {};
    this.configure(options || {});
    if (this.options.el) {
      this.el = this.options.el;
    } else {
      var attrs = {};
      if (this.id) attrs.id = this.id;
      if (this.className) attrs['class'] = this.className;
      this.el = this.make(this.tagName, attrs);
    }
    return this;
  };

  // Set up all interitable view properties and methods.
  _.extend(Backbone.View.prototype, {

    el        : null,
    model     : null,
    modes     : null,
    id        : null,
    className : null,
    callbacks : null,
    options   : null,
    tagName   : 'div',

    configure : function(options) {
      if (this.options) options = _.extend({}, this.options, options);
      if (options.model)      this.model      = options.model;
      if (options.collection) this.collection = options.collection;
      if (options.id)         this.id         = options.id;
      if (options.className)  this.className  = options.className;
      this.options = options;
    },

    render : function() {
      return this;
    },

    // jQuery lookup, scoped to the current view.
    $ : function(selector) {
      return $(selector, this.el);
    },

    // Quick-create a dom element with attributes.
    make : function(tagName, attributes, content) {
      var el = document.createElement(tagName);
      if (attributes) $(el).attr(attributes);
      if (content) $(el).html(content);
      return el;
    },

    // Makes the view enter a mode. Modes have both a 'mode' and a 'group',
    // and are mutually exclusive with any other modes in the same group.
    // Setting will update the view's modes hash, as well as set an HTML className
    // of [mode]_[group] on the view's element. Convenient way to swap styles
    // and behavior.
    setMode : function(mode, group) {
      if (this.modes[group] == mode) return;
      $(this.el).setMode(mode, group);
      this.modes[group] = mode;
    },

    // Set callbacks, where this.callbacks is a hash of
    //   {selector.event_name, callback_name}
    // pairs. Callbacks will be bound to the view, with 'this' set properly.
    // Passing a selector of 'el' binds to the view's root element.
    // Change events are not delegated through the view because IE does not bubble
    // change events at all.
    setCallbacks : function(callbacks) {
      $(this.el).unbind();
      if (!(callbacks || (callbacks = this.callbacks))) return this;
      for (key in callbacks) {
        var methodName = callbacks[key];
        key = key.split(/\.(?!.*\.)/);
        var selector = key[0], eventName = key[1];
        var method = _.bind(this[methodName], this);
        if (selector === '' || eventName == 'change') {
          $(this.el).bind(eventName, method);
        } else {
          $(this.el).delegate(selector, eventName, method);
        }
      }
      return this;
    }

  });

  // Set up inheritance for the model, collection, and view.
  var extend = Backbone.Model.extend = Backbone.Collection.extend = Backbone.View.extend = function (protoProps, classProps) {
    var child = inherits(this, protoProps, classProps);
    child.extend = extend;
    return child;
  };

  // `Backbone.request`...
  Backbone.request = function(type, model, success, error) {
    var data = model.attributes ? {model : JSON.stringify(model.attributes())} : {};
    $.ajax({
      url       : model.url(),
      type      : type,
      data      : data,
      dataType  : 'json',
      success   : success,
      error     : error
    });
  };

})();