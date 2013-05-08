/*
  Backbone.js 1.0.0

  (c) 2010-2011 Jeremy Ashkenas, DocumentCloud Inc.
  (c) 2011-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
  Backbone may be freely distributed under the MIT license.
  For all details and documentation:
  http://backbonejs.org
*/


(function() {
  var Backbone, Collection, Events, History, Model, Router, View, addOptions, array, attributeMethods, delegateEventSplitter, escapeRegExp, eventSplitter, eventsApi, extend, isExplorer, listenMethods, methodMap, methods, modelMethods, namedParam, optionalParam, previousBackbone, push, root, rootStripper, routeStripper, setOptions, slice, splatParam, splice, trailingSlash, triggerEvents, urlError, viewOptions, wrapError, _,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  root = this;

  previousBackbone = root.Backbone;

  array = [];

  push = array.push;

  slice = array.slice;

  splice = array.splice;

  if (typeof exports !== "undefined" && exports !== null) {
    Backbone = exports;
  } else {
    root.Backbone = {};
    Backbone = root.Backbone;
  }

  _ = root._;

  if ((_ == null) && (typeof require !== "undefined" && require !== null)) {
    _ = require('underscore');
  }

  methodMap = {
    create: 'POST',
    update: 'PUT',
    patch: 'PATCH',
    "delete": 'DELETE',
    read: 'GET'
  };

  _.extend(Backbone, {
    VERSION: '1.0.0',
    $: root.jQuery || root.Zepto || root.ender || root.$,
    noConflict: function() {
      root.Backbone = previousBackbone;
      return this;
    },
    emulateHTTP: false,
    emulateJSON: false,
    ajax: function() {
      return Backbone.$.ajax.apply(Backbone.$, arguments);
    },
    sync: function(method, model, options) {
      var beforeSend, params, type, xhr;

      if (options == null) {
        options = {};
      }
      type = methodMap[method];
      _.defaults(options, {
        emulateHTTP: Backbone.emulateHTTP,
        emulateJSON: Backbone.emulateJSON
      });
      params = {
        type: type,
        dataType: 'json'
      };
      if (!options.url) {
        params.url = _.result(model, 'url') || urlError();
      }
      if ((options.data == null) && model && (method === 'create' || method === 'update' || method === 'patch')) {
        params.contentType = 'application/json';
        params.data = JSON.stringify(options.attrs || model.toJSON(options));
      }
      if (options.emulateJSON) {
        params.contentType = 'application/x-www-form-urlencoded';
        params.data = params.data ? {
          model: params.data
        } : {};
      }
      if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
        params.type = 'POST';
        if (options.emulateJSON) {
          params.data._method = type;
        }
        beforeSend = options.beforeSend;
        options.beforeSend = function(xhr) {
          xhr.setRequestHeader('X-HTTP-Method-Override', type);
          if (beforeSend) {
            return beforeSend.apply(this, arguments);
          }
        };
      }
      if (params.type !== 'GET' && !options.emulateJSON) {
        params.processData = false;
      }
      if (params.type === 'PATCH' && window.ActiveXObject && !(window.external && window.external.msActiveXFilteringEnabled)) {
        params.xhr = function() {
          return new ActiveXObject('Microsoft.XMLHTTP');
        };
      }
      options.xhr = Backbone.ajax(_.extend(params, options));
      xhr = options.xhr;
      model.trigger('request', model, xhr, options);
      return xhr;
    }
  });

  /**
    Backbone.Events
    ---------------
  
    A module that can be mixed in to *any object* in order to provide it with
    custom events. You may bind with `on` or remove with `off` callback
    functions to an event; `trigger`-ing an event fires all callbacks in
    succession.
  
        var object = {};
        _.extend(object, Backbone.Events);
        object.on('expand', function(){ alert('expanded'); });
        object.trigger('expand');
  */


  Backbone.Events = (function() {
    function Events() {}

    Events.on = function(name, callback, context) {
      var events, _base, _ref, _ref1;

      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) {
        return this;
      }
      if ((_ref = this._events) == null) {
        this._events = {};
      }
      if ((_ref1 = (_base = this._events)[name]) == null) {
        _base[name] = [];
      }
      events = this._events[name];
      events.push({
        callback: callback,
        context: context,
        ctx: context || this
      });
      return this;
    };

    Events.once = function(name, callback, context) {
      var once, self;

      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) {
        return this;
      }
      self = this;
      once = _.once(function() {
        self.off(name, once);
        return callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    };

    Events.off = function(name, callback, context) {
      var ev, events, i, j, names, retain, _i, _j, _ref, _ref1;

      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) {
        return this;
      }
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }
      names = name ? [name] : _.keys(this._events);
      for (i = _i = 0, _ref = names.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        name = names[i];
        events = this._events[name];
        if (events) {
          retain = [];
          this._events[name] = retain;
          if (callback || context) {
            for (j = _j = 0, _ref1 = events.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) || (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) {
            delete this._events[name];
          }
        }
      }
      return this;
    };

    Events.trigger = function(name) {
      var allEvents, args, events;

      if (!this._events) {
        return this;
      }
      args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) {
        return this;
      }
      events = this._events[name];
      allEvents = this._events.all;
      if (events) {
        triggerEvents(events, args);
      }
      if (allEvents) {
        triggerEvents(allEvents, arguments);
      }
      return this;
    };

    Events.stopListening = function(obj, name, callback) {
      var deleteListener, id, listeners, v;

      listeners = this._listeners;
      if (!listeners) {
        return this;
      }
      deleteListener = !name && !callback;
      if (_.isObject(name)) {
        callback = this;
      }
      if (obj) {
        listeners = {};
        listeners[obj._listenerId] = obj;
      }
      for (id in listeners) {
        v = listeners[id];
        listeners[id].off(name, callback, this);
        if (deleteListener) {
          delete this._listeners[id];
        }
      }
      return this;
    };

    return Events;

  })();

  Events = Backbone.Events;

  eventSplitter = /\s+/;

  eventsApi = function(obj, action, name, rest) {
    var i, key, names, v, _i, _ref;

    if (!name) {
      return true;
    }
    if (_.isObject(name)) {
      for (key in name) {
        v = name[key];
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }
    if (eventSplitter.test(name)) {
      names = name.split(eventSplitter);
      for (i = _i = 0, _ref = names.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }
    return true;
  };

  triggerEvents = function(events, args) {
    var a1, a2, a3, ev, i, l, _results, _results1, _results2, _results3, _results4;

    i = -1;
    l = events.length;
    a1 = args[0];
    a2 = args[1];
    a3 = args[2];
    switch (args.length) {
      case 0:
        _results = [];
        while (++i < l) {
          ev = events[i];
          _results.push(ev.callback.call(ev.ctx));
        }
        return _results;
        break;
      case 1:
        _results1 = [];
        while (++i < l) {
          ev = events[i];
          _results1.push(ev.callback.call(ev.ctx, a1));
        }
        return _results1;
        break;
      case 2:
        _results2 = [];
        while (++i < l) {
          ev = events[i];
          _results2.push(ev.callback.call(ev.ctx, a1, a2));
        }
        return _results2;
        break;
      case 3:
        _results3 = [];
        while (++i < l) {
          ev = events[i];
          _results3.push(ev.callback.call(ev.ctx, a1, a2, a3));
        }
        return _results3;
        break;
      default:
        _results4 = [];
        while (++i < l) {
          ev = events[i];
          _results4.push(ev.callback.apply(ev.ctx, args));
        }
        return _results4;
    }
  };

  listenMethods = {
    listenTo: 'on',
    listenToOnce: 'once'
  };

  _.each(listenMethods, function(implementation, method) {
    return Events[method] = function(obj, name, callback) {
      var id, listeners, _ref, _ref1;

      if ((_ref = this._listeners) == null) {
        this._listeners = {};
      }
      listeners = this._listeners;
      if ((_ref1 = obj._listenerId) == null) {
        obj._listenerId = _.uniqueId('l');
      }
      id = obj._listenerId;
      listeners[id] = obj;
      if (_.isObject(name)) {
        callback = this;
      }
      obj[implementation](name, callback, this);
      return this;
    };
  });

  Events.bind = Events.on;

  Events.unbind = Events.off;

  _.extend(Backbone, Events);

  /**
    Backbone.Model
    --------------
  
    Backbone **Models** are the basic data object in the framework --
    frequently representing a row in a table in a database on your server.
    A discrete chunk of data and a bunch of useful, related methods for
    performing computations and transformations on that data.
  
    Create a new model with the specified attributes. A client id (`cid`)
    is automatically generated and assigned for you.
  */


  Backbone.Model = (function() {
    _.extend(Model.prototype, Events);

    function Model(attributes, options) {
      var attrs, defaults;

      if (options == null) {
        options = {};
      }
      attrs = attributes || {};
      this.cid = _.uniqueId('c');
      this.attributes = {};
      if (options.collection) {
        this.collection = options.collection;
      }
      if (options.parse) {
        attrs = this.parse(attrs, options) || {};
      }
      options._attrs = attrs;
      defaults = _.result(this, 'defaults');
      if (defaults) {
        attrs = _.defaults({}, attrs, defaults);
      }
      this.set(attrs, options);
      this.changed = {};
      this.initialize.apply(this, arguments);
    }

    Model.prototype.changed = null;

    Model.prototype.validationError = null;

    Model.prototype.idAttribute = 'id';

    Model.prototype.initialize = function() {};

    Model.prototype.toJSON = function(options) {
      return _.clone(this.attributes);
    };

    Model.prototype.sync = function() {
      return Backbone.sync.apply(this, arguments);
    };

    Model.prototype.get = function(attr) {
      return this.attributes[attr];
    };

    Model.prototype.escape = function(attr) {
      return _.escape(this.get(attr));
    };

    Model.prototype.has = function(attr) {
      return this.get(attr) != null;
    };

    Model.prototype.set = function(key, val, options) {
      var attr, attrs, changes, changing, current, i, prev, silent, unset, v, _i, _ref;

      if (options == null) {
        options = {};
      }
      if (key == null) {
        return this;
      }
      if (_.isObject(key)) {
        attrs = key;
        options = val || {};
      } else {
        attrs = {};
        attrs[key] = val;
      }
      if (!this._validate(attrs, options)) {
        return false;
      }
      unset = options.unset;
      silent = options.silent;
      changes = [];
      changing = this._changing;
      this._changing = true;
      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes;
      prev = this._previousAttributes;
      if (_.has(attrs, this.idAttribute)) {
        this.id = attrs[this.idAttribute];
      }
      for (attr in attrs) {
        v = attrs[attr];
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) {
          changes.push(attr);
        }
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        if (unset) {
          delete current[attr];
        } else {
          current[attr] = val;
        }
      }
      if (!silent) {
        if (changes.length) {
          this._pending = true;
        }
        for (i = _i = 0, _ref = changes.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }
      if (changing) {
        return this;
      }
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    };

    Model.prototype.unset = function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {
        unset: true
      }));
    };

    Model.prototype.clear = function(options) {
      var attrs, key, v, _ref;

      attrs = {};
      _ref = this.attributes;
      for (key in _ref) {
        v = _ref[key];
        attrs[key] = void 0;
      }
      return this.set(attrs, _.extend({}, options, {
        unset: true
      }));
    };

    Model.prototype.hasChanged = function(attr) {
      if (attr == null) {
        return !_.isEmpty(this.changed);
      }
      return _.has(this.changed, attr);
    };

    Model.prototype.changedAttributes = function(diff) {
      var attr, changed, old, v;

      if (!diff) {
        if (this.hasChanged()) {
          return _.clone(this.changed);
        } else {
          return false;
        }
      }
      changed = false;
      old = this._changing ? this._previousAttributes : this.attributes;
      for (attr in diff) {
        v = diff[attr];
        if (_.isEqual(old[attr], v)) {
          continue;
        }
        if (!changed) {
          changed = {};
        }
        changed[attr] = v;
      }
      return changed;
    };

    Model.prototype.previous = function(attr) {
      if ((attr == null) || !this._previousAttributes) {
        return null;
      }
      return this._previousAttributes[attr];
    };

    Model.prototype.previousAttributes = function() {
      return _.clone(this._previousAttributes);
    };

    Model.prototype.fetch = function(options) {
      var model, success;

      if (options == null) {
        options = {};
      }
      options = _.clone(options);
      if (options.parse == null) {
        options.parse = true;
      }
      model = this;
      success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) {
          return false;
        }
        if (success) {
          success(model, resp, options);
        }
        return model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    };

    Model.prototype.save = function(key, val, options) {
      var attributes, attrs, method, model, success, xhr;

      attributes = this.attributes;
      if ((key == null) || _.isObject(key)) {
        attrs = key;
        options = val;
      } else {
        attrs = {};
        attrs[key] = val;
      }
      options = _.extend({
        validate: true
      }, options);
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) {
          return false;
        }
      } else {
        if (!this._validate(attrs, options)) {
          return false;
        }
      }
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }
      if (options.parse == null) {
        options.parse = true;
      }
      model = this;
      success = options.success;
      options.success = function(resp) {
        var serverAttrs;

        model.attributes = attributes;
        serverAttrs = model.parse(resp, options);
        if (options.wait) {
          serverAttrs = _.extend(attrs || {}, serverAttrs);
        }
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) {
          success(model, resp, options);
        }
        return model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') {
        options.attrs = attrs;
      }
      xhr = this.sync(method, this, options);
      if (attrs && options.wait) {
        this.attributes = attributes;
      }
      return xhr;
    };

    Model.prototype.destroy = function(options) {
      var destroy, model, success, xhr;

      if (options == null) {
        options = {};
      }
      options = _.clone(options);
      model = this;
      success = options.success;
      destroy = function() {
        return model.trigger('destroy', model, model.collection, options);
      };
      options.success = function(resp) {
        if (options.wait || model.isNew()) {
          destroy();
        }
        if (success) {
          success(model, resp, options);
        }
        if (!model.isNew()) {
          return model.trigger('sync', model, resp, options);
        }
      };
      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);
      xhr = this.sync('delete', this, options);
      if (!options.wait) {
        destroy();
      }
      return xhr;
    };

    Model.prototype.url = function() {
      var base;

      base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
      if (this.isNew()) {
        return base;
      }
      return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id);
    };

    Model.prototype.parse = function(resp, options) {
      return resp;
    };

    Model.prototype.clone = function() {
      return new this.constructor(this.attributes);
    };

    Model.prototype.isNew = function() {
      return this.id == null;
    };

    Model.prototype.isValid = function(options) {
      return this._validate({}, _.extend(options || {}, {
        validate: true
      }));
    };

    Model.prototype._validate = function(attrs, options) {
      var error;

      if (options == null) {
        options = {};
      }
      if (!options.validate || !this.validate) {
        return true;
      }
      attrs = _.extend({}, this.attributes, attrs);
      this.validationError = this.validate(attrs, options) || null;
      error = this.validationError;
      if (!error) {
        return true;
      }
      this.trigger('invalid', this, error, _.extend(options || {}, {
        validationError: error
      }));
      return false;
    };

    return Model;

  })();

  Model = Backbone.Model;

  modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  _.each(modelMethods, function(method) {
    return Model.prototype[method] = function() {
      var args;

      args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  /**
    Backbone.Collection
    -------------------
  
    If models tend to represent a single row of data, a Backbone Collection is
    more analagous to a table full of data ... or a small slice or page of that
    table, or a collection of rows that belong together for a particular reason
    -- all of the messages in this particular folder, all of the documents
    belonging to this particular author, and so on. Collections maintain
    indexes of their models, both in order, and for lookup by `id`.
  
    Create a new **Collection**, perhaps to contain a specific type of `model`.
    If a `comparator` is specified, the Collection will maintain
    its models in sort order, as they're added and removed.
  */


  setOptions = {
    add: true,
    remove: true,
    merge: true
  };

  addOptions = {
    add: true,
    merge: false,
    remove: false
  };

  Backbone.Collection = (function() {
    _.extend(Collection.prototype, Events);

    Collection.prototype.model = Model;

    function Collection(models, options) {
      options || (options = {});
      if (options.model) {
        this.model = options.model;
      }
      if (!_.isUndefined(options.comparator)) {
        this.comparator = options.comparator;
      }
      this._reset();
      this.initialize.apply(this, arguments);
      if (models) {
        this.reset(models, _.extend({
          silent: true
        }, options));
      }
    }

    Collection.prototype.initialize = function() {};

    Collection.prototype.toJSON = function(options) {
      return this.map(function(model) {
        return model.toJSON(options);
      });
    };

    Collection.prototype.sync = function() {
      return Backbone.sync.apply(this, arguments);
    };

    Collection.prototype.add = function(models, options) {
      if (options == null) {
        options = {};
      }
      return this.set(models, _.defaults(options, addOptions));
    };

    Collection.prototype.remove = function(models, options) {
      var i, index, model, _i, _ref;

      if (options == null) {
        options = {};
      }
      models = _.isArray(models) ? models.slice() : [models];
      for (i = _i = 0, _ref = models.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        model = this.get(models[i]);
        if (!model) {
          continue;
        }
        delete this._byId[model.id];
        delete this._byId[model.cid];
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
    };

    Collection.prototype.set = function(models, options) {
      var add, at, attrs, existing, i, merge, model, modelMap, order, remove, sort, sortAttr, sortable, toAdd, toRemove, _i, _j, _k, _ref, _ref1, _ref2;

      if (options == null) {
        options = {};
      }
      options = _.defaults(options, setOptions);
      if (options.parse) {
        models = this.parse(models, options);
      }
      if (!_.isArray(models)) {
        models = models ? [models] : [];
      }
      at = options.at;
      sortable = this.comparator && (at == null) && options.sort !== false;
      sortAttr = _.isString(this.comparator) ? this.comparator : null;
      toAdd = [];
      toRemove = [];
      modelMap = {};
      add = options.add;
      merge = options.merge;
      remove = options.remove;
      order = !sortable && add && remove ? [] : false;
      for (i = _i = 0, _ref = models.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        attrs = models[i];
        model = this._prepareModel(attrs, options);
        if (!model) {
          continue;
        }
        existing = this.get(model);
        if (existing) {
          if (remove) {
            modelMap[existing.cid] = true;
          }
          if (merge) {
            attrs = attrs === model ? model.attributes : options._attrs;
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) {
              sort = true;
            }
          }
        } else if (add) {
          toAdd.push(model);
          model.on('all', this._onModelEvent, this);
          this._byId[model.cid] = model;
          if (model.id != null) {
            this._byId[model.id] = model;
          }
        }
        if (order) {
          order.push(existing || model);
        }
      }
      if (remove) {
        for (i = _j = 0, _ref1 = this.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          model = this.models[i];
          if (!modelMap[model.cid]) {
            toRemove.push(model);
          }
        }
        if (toRemove.length) {
          this.remove(toRemove, options);
        }
      }
      if (toAdd.length || (order && order.length)) {
        if (sortable) {
          sort = true;
        }
        this.length += toAdd.length;
        if (at != null) {
          splice.apply(this.models, [at, 0].concat(toAdd));
        } else {
          if (order) {
            this.models.length = 0;
          }
          push.apply(this.models, order || toAdd);
        }
      }
      if (sort) {
        this.sort({
          silent: true
        });
      }
      if (options.silent) {
        return this;
      }
      for (i = _k = 0, _ref2 = toAdd.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
        model = toAdd[i];
        model.trigger('add', model, this, options);
      }
      if (sort || (order && order.length)) {
        this.trigger('sort', this, options);
      }
      return this;
    };

    Collection.prototype.reset = function(models, options) {
      var i, _i, _ref;

      if (options == null) {
        options = {};
      }
      for (i = _i = 0, _ref = this.models.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models;
      this._reset();
      this.add(models, _.extend({
        silent: true
      }, options));
      if (!options.silent) {
        this.trigger('reset', this, options);
      }
      return this;
    };

    Collection.prototype.push = function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({
        at: this.length
      }, options));
      return model;
    };

    Collection.prototype.pop = function(options) {
      var model;

      model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    };

    Collection.prototype.unshift = function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({
        at: 0
      }, options));
      return model;
    };

    Collection.prototype.shift = function(options) {
      var model;

      model = this.at(0);
      this.remove(model, options);
      return model;
    };

    Collection.prototype.slice = function() {
      return slice.apply(this.models, arguments);
    };

    Collection.prototype.get = function(obj) {
      if (obj == null) {
        return void 0;
      }
      return this._byId[obj.id != null ? obj.id : obj.cid || obj];
    };

    Collection.prototype.at = function(index) {
      return this.models[index];
    };

    Collection.prototype.where = function(attrs, first) {
      if (_.isEmpty(attrs)) {
        if (first) {
          return void 0;
        } else {
          return [];
        }
      }
      return this[first ? 'find' : 'filter'](function(model) {
        var key, v;

        for (key in attrs) {
          v = attrs[key];
          if (v !== model.get(key)) {
            return false;
          }
        }
        return true;
      });
    };

    Collection.prototype.findWhere = function(attrs) {
      return this.where(attrs, true);
    };

    Collection.prototype.sort = function(options) {
      if (options == null) {
        options = {};
      }
      if (!this.comparator) {
        throw new Error('Cannot sort a set without a comparator');
      }
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }
      if (!options.silent) {
        this.trigger('sort', this, options);
      }
      return this;
    };

    Collection.prototype.sortedIndex = function(model, value, context) {
      var iterator;

      value = value || this.comparator;
      iterator = _.isFunction(value) ? value : (function(model) {
        return model.get(value);
      });
      return _.sortedIndex(this.models, model, iterator, context);
    };

    Collection.prototype.pluck = function(attr) {
      return _.invoke(this.models, 'get', attr);
    };

    Collection.prototype.fetch = function(options) {
      var collection, success;

      if (options == null) {
        options = {};
      }
      options = _.clone(options);
      if (options.parse == null) {
        options.parse = true;
      }
      success = options.success;
      collection = this;
      options.success = function(resp) {
        var method;

        method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) {
          success(collection, resp, options);
        }
        return collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    };

    Collection.prototype.create = function(model, options) {
      var collection, success;

      if (options == null) {
        options = {};
      }
      options = _.clone(options);
      model = this._prepareModel(model, options);
      if (!model) {
        return false;
      }
      if (!options.wait) {
        this.add(model, options);
      }
      collection = this;
      success = options.success;
      options.success = function(resp) {
        if (options.wait) {
          collection.add(model, options);
        }
        if (success) {
          return success(model, resp, options);
        }
      };
      model.save(null, options);
      return model;
    };

    Collection.prototype.parse = function(resp, options) {
      return resp;
    };

    Collection.prototype.clone = function() {
      return new this.constructor(this.models);
    };

    Collection.prototype._reset = function() {
      this.length = 0;
      this.models = [];
      return this._byId = {};
    };

    Collection.prototype._prepareModel = function(attrs, options) {
      var model;

      if (options == null) {
        options = {};
      }
      if (attrs instanceof Model) {
        if (!attrs.collection) {
          attrs.collection = this;
        }
        return attrs;
      }
      options.collection = this;
      model = new this.model(attrs, options);
      if (!model._validate(attrs, options)) {
        this.trigger('invalid', this, attrs, options);
        return false;
      }
      return model;
    };

    Collection.prototype._removeReference = function(model) {
      if (this === model.collection) {
        delete model.collection;
      }
      return model.off('all', this._onModelEvent, this);
    };

    Collection.prototype._onModelEvent = function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) {
        return;
      }
      if (event === 'destroy') {
        this.remove(model, options);
      }
      if (model && event === ("change:" + model.idAttribute)) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) {
          this._byId[model.id] = model;
        }
      }
      return this.trigger.apply(this, arguments);
    };

    return Collection;

  })();

  Collection = Backbone.Collection;

  methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl', 'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke', 'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest', 'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf', 'isEmpty', 'chain'];

  _.each(methods, function(method) {
    return Collection.prototype[method] = function() {
      var args;

      args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  _.each(attributeMethods, function(method) {
    return Collection.prototype[method] = function(value, context) {
      var iterator;

      iterator = _.isFunction(value) ? value : (function(model) {
        return model.get(value);
      });
      return _[method](this.models, iterator, context);
    };
  });

  /**
    Backbone.View
    -------------
  
    Backbone Views are almost more convention than they are actual code. A View
    is simply a JavaScript object that represents a logical chunk of UI in the
    DOM. This might be a single item, an entire list, a sidebar or panel, or
    even the surrounding frame which wraps your whole app. Defining a chunk of
    UI as a **View** allows you to define your DOM events declaratively, without
    having to worry about render order ... and makes it easy for the view to
    react to specific changes in the state of your models.
  
    Options with special meaning *(e.g. model, collection, id, className)* are
    attached directly to the view.  See `viewOptions` for an exhaustive
    list.
  
    Creating a Backbone.View creates its initial element outside of the DOM,
    if an existing element is not provided...
  */


  delegateEventSplitter = /^(\S+)\s*(.*)$/;

  viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  Backbone.View = (function() {
    _.extend(View.prototype, Events);

    View.prototype.tagName = 'div';

    function View(options) {
      if (options == null) {
        options = {};
      }
      this.cid = _.uniqueId('view');
      _.extend(this, _.pick(options, viewOptions));
      this._ensureElement();
      this.initialize.apply(this, arguments);
      this.delegateEvents();
    }

    View.prototype.$ = function(selector) {
      return this.$el.find(selector);
    };

    View.prototype.initialize = function() {};

    View.prototype.render = function() {
      return this;
    };

    View.prototype.remove = function() {
      this.$el.remove();
      this.stopListening();
      return this;
    };

    View.prototype.setElement = function(element, delegate) {
      if (this.$el) {
        this.undelegateEvents();
      }
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) {
        this.delegateEvents();
      }
      return this;
    };

    View.prototype.delegateEvents = function(events) {
      var eventName, key, match, method, selector;

      events = events || _.result(this, 'events');
      if (!events) {
        return this;
      }
      this.undelegateEvents();
      for (key in events) {
        method = events[key];
        if (!_.isFunction(method)) {
          method = this[events[key]];
        }
        if (!method) {
          continue;
        }
        match = key.match(delegateEventSplitter);
        eventName = match[1];
        selector = match[2];
        method = _.bind(method, this);
        eventName += ".delegateEvents" + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    };

    View.prototype.undelegateEvents = function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    };

    View.prototype._ensureElement = function() {
      var $el, attrs;

      if (!this.el) {
        attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) {
          attrs.id = _.result(this, 'id');
        }
        if (this.className) {
          attrs['class'] = _.result(this, 'className');
        }
        $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        return this.setElement($el, false);
      } else {
        return this.setElement(_.result(this, 'el'), false);
      }
    };

    return View;

  })();

  View = Backbone.View;

  /**
    Backbone.Router
    ---------------
  
    Routers map faux-URLs to actions, and fire events when routes are
    matched. Creating a new one sets its `routes` hash, if not set statically.
  */


  optionalParam = /\((.*?)\)/g;

  namedParam = /(\(\?)?:\w+/g;

  splatParam = /\*\w+/g;

  escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  Backbone.Router = (function() {
    _.extend(Router.prototype, Events);

    function Router(options) {
      if (options == null) {
        options = {};
      }
      if (options.routes) {
        this.routes = options.routes;
      }
      this._bindRoutes();
      this.initialize.apply(this, arguments);
    }

    Router.prototype.initialize = function() {};

    Router.prototype.route = function(route, name, callback) {
      var router;

      if (!_.isRegExp(route)) {
        route = this._routeToRegExp(route);
      }
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) {
        callback = this[name];
      }
      router = this;
      Backbone.history.route(route, function(fragment) {
        var args;

        args = router._extractParameters(route, fragment);
        if (callback != null) {
          callback.apply(router, args);
        }
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        return Backbone.history.trigger('route', router, name, args);
      });
      return this;
    };

    Router.prototype.navigate = function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    };

    Router.prototype._bindRoutes = function() {
      var route, routes, _results;

      if (!this.routes) {
        return;
      }
      this.routes = _.result(this, 'routes');
      routes = _.keys(this.routes);
      route = routes.pop();
      _results = [];
      while (route != null) {
        this.route(route, this.routes[route]);
        _results.push(route = routes.pop());
      }
      return _results;
    };

    Router.prototype._routeToRegExp = function(route) {
      route = route.replace(escapeRegExp, '\\$&').replace(optionalParam, '(?:$1)?').replace(namedParam, function(match, optional) {
        if (optional) {
          return match;
        } else {
          return '([^\/]+)';
        }
      }).replace(splatParam, '(.*?)');
      return new RegExp("^" + route + "$");
    };

    Router.prototype._extractParameters = function(route, fragment) {
      var params;

      params = route.exec(fragment).slice(1);
      return _.map(params, function(param) {
        if (param) {
          return decodeURIComponent(param);
        } else {
          return null;
        }
      });
    };

    return Router;

  })();

  Router = Backbone.Router;

  /**
    Backbone.History
    ----------------
  
    Handles cross-browser history management, based on either
    [pushState](http:#diveintohtml5.info/history.html) and real URLs, or
    [onhashchange](https:#developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
    and URL fragments. If the browser supports neither (old IE, natch),
    falls back to polling.
  */


  routeStripper = /^[#\/]|\s+$/g;

  rootStripper = /^\/+|\/+$/g;

  isExplorer = /msie [\w.]+/;

  trailingSlash = /\/$/;

  Backbone.History = (function() {
    _.extend(History.prototype, Events);

    History.started = false;

    History.prototype.interval = 50;

    function History() {
      this.handlers = [];
      _.bindAll(this, 'checkUrl');
      if (typeof window !== 'undefined') {
        this.location = window.location;
        this.history = window.history;
      }
    }

    History.prototype.getHash = function(window) {
      var match;

      match = (window || this).location.href.match(/#(.*)$/);
      if (match) {
        return match[1];
      } else {
        return '';
      }
    };

    History.prototype.getFragment = function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) {
            fragment = fragment.substr(root.length);
          }
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    };

    History.prototype.start = function(options) {
      var atRoot, docMode, fragment, loc, oldIE;

      if (History.started) {
        throw new Error("Backbone.history has already been started");
      }
      History.started = true;
      this.options = _.extend({}, {
        root: '/'
      }, this.options, options);
      this.root = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState = !!this.options.pushState;
      this._hasPushState = !!(this.options.pushState && this.history && this.history.pushState);
      fragment = this.getFragment();
      docMode = document.documentMode;
      oldIE = isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7);
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');
      if (oldIE && this._wantsHashChange) {
        this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && (__indexOf.call(window, 'onhashchange') >= 0) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }
      this.fragment = fragment;
      loc = this.location;
      atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);
        return true;
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
      }
      if (!this.options.silent) {
        return this.loadUrl();
      }
    };

    History.prototype.stop = function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      return History.started = false;
    };

    History.prototype.route = function(route, callback) {
      return this.handlers.unshift({
        route: route,
        callback: callback
      });
    };

    History.prototype.checkUrl = function(e) {
      var current;

      current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) {
        return false;
      }
      if (this.iframe) {
        this.navigate(current);
      }
      return this.loadUrl() || this.loadUrl(this.getHash());
    };

    History.prototype.loadUrl = function(fragmentOverride) {
      var fragment, matched;

      this.fragment = this.getFragment(fragmentOverride);
      fragment = this.fragment;
      matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
    };

    History.prototype.navigate = function(fragment, options) {
      var url;

      if (!History.started) {
        return false;
      }
      if (!options || options === true) {
        options = {
          trigger: options
        };
      }
      fragment = this.getFragment(fragment || '');
      if (this.fragment === fragment) {
        return;
      }
      this.fragment = fragment;
      url = this.root + fragment;
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          if (!options.replace) {
            this.iframe.document.open().close();
          }
          this._updateHash(this.iframe.location, fragment, options.replace);
        }
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) {
        return this.loadUrl(fragment);
      }
    };

    History.prototype._updateHash = function(location, fragment, replace) {
      var href;

      if (replace) {
        href = location.href.replace(/(javascript:|#).*$/, '');
        return location.replace(href + '#' + fragment);
      } else {
        return location.hash = '#' + fragment;
      }
    };

    return History;

  })();

  History = Backbone.History;

  Backbone.history = new History;

  /**
  Helpers
  -------
  
  Helper function to correctly set up the prototype chain, for subclasses.
  Similar to `goog.inherits`, but uses a hash of prototype properties and
  class properties to be extended.
  */


  extend = function(protoProps, staticProps) {
    var Surrogate, child, parent;

    parent = this;
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function() {
        return parent.apply(this, arguments);
      };
    }
    _.extend(child, parent, staticProps);
    Surrogate = (function() {
      function Surrogate() {
        this.constructor = child;
      }

      return Surrogate;

    })();
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;
    if (protoProps) {
      _.extend(child.prototype, protoProps);
    }
    child.__super__ = parent.prototype;
    return child;
  };

  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  wrapError = function(model, options) {
    var error;

    error = options.error;
    return options.error = function(resp) {
      if (error) {
        error(model, resp, options);
      }
      return model.trigger('error', model, resp, options);
    };
  };

}).call(this);
