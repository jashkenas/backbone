import jQuery from 'jquery';
import underscore from 'underscore';

/*
Backbone.js 1.3.3 ES2015-2017 version
(c) 2010-2018 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
Backbone may be freely distributed under the MIT license.
For all details and documentation:
http://backbonejs.org

Conversion done by Michael Adams, https://github.com/unquietwiki/; May 2018
Uses modified https://standardjs.com/ rules.
*/

// Initial Setup
// -------------
export class Backbone {
  constructor (...args) {
    this.topargs = args;

    // Current version of the library. Keep in sync with `package.json`.
    this.VERSION = '1.3.3';

    // ensure imported jQuery and Underscore library contents are available.
    this.jQuery = jQuery;
    this.$ = jQuery;
    this.underscore = underscore;
    this._ = underscore;

    // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
    // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
    // set a `X-Http-Method-Override` header.
    this.emulateHTTP = false;

    // Turn on `emulateJSON` to support legacy servers that can't deal with direct
    // `application/json` requests ... this will encode the body as
    // `application/x-www-form-urlencoded` instead and will send the model in a
    // form param named `model`.
    this.emulateJSON = false;

    // Cached regex for stripping a leading hash/slash and trailing space.
    this.routeStripper = /^[#/]|\s+$/g;

    // Cached regex for stripping leading and trailing slashes.
    this.rootStripper = /^\/+|\/+$/g;

    // Cached regex for stripping urls of hash.
    this.pathStripper = /#.*$/;

    // Regular expression used to split event strings.
    this.eventSplitter = /\s+/;
  }

  // Splices `insert` into `array` at index `at`.
  splice (array, insert, at) {
    at = Math.min(Math.max(at, 0), array.length);
    const tail = Array(array.length - at);
    const length = insert.length;
    let i;
    for (i = 0; i < tail.length; i++) tail[i] = array[i + at];
    for (i = 0; i < length; i++) array[i + at] = insert[i];
    for (i = 0; i < tail.length; i++) array[i + length + at] = tail[i];
  }

  // preinitialize is an empty function by default. You can override it with a function
  // or object.  preinitialize will run before any instantiation logic is run in the Model.
  preinitialize () {}

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize () {}

  // Proxy `Backbone.sync` by default -- but override this if you need
  // custom syncing semantics for *this* particular model.
  sync () {
    return Backbone.Sync.apply(this, this.topargs);
  }

  // Throw an error when a URL is needed, and none is supplied.
  urlError () {
    throw new Error('A "url" property or function must be specified');
  }

  // Wrap an optional error callback with a fallback error event.
  wrapError (model, options) {
    const error = options.error;
    options.error = (resp) => {
      if (error) error.call(options.context, model, resp, options);
      model.trigger('error', model, resp, options);
    };
  }

  modelMatcher (attrs) {
    const matcher = underscore.matches(attrs);
    return function (model) {
      return matcher(model.attributes);
    };
  }

  // Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
  cb (iteratee, instance) {
    if (underscore.isFunction(iteratee)) return iteratee;
    if (underscore.isObject(iteratee) && !instance._isModel(iteratee)) return this.modelMatcher(iteratee);
    if (underscore.isString(iteratee)) return function (model) { return model.get(iteratee); };
    return iteratee;
  }

  // Proxy Backbone class methods to Underscore functions, wrapping the model's
  // `attributes` object or collection's `models` array behind the scenes.
  //
  // collection.filter(function(model) { return model.get('age') > 10});
  // collection.each(this.addView);
  //
  // `Function#apply` can be slow so we use the method's arg count, if we know it.
  addMethod (length, method, attribute) {
    switch (length) {
    case 1: return function () {
      return underscore[method](this[attribute]);
    };
    case 2: return function (value) {
      return underscore[method](this[attribute], value);
    };
    case 3: return function (iteratee, context) {
      return underscore[method](this[attribute], this.cb(iteratee, this), context);
    };
    case 4: return function (iteratee, defaultVal, context) {
      return underscore[method](this[attribute], this.cb(iteratee, this), defaultVal, context);
    };
    default: return function () {
      return underscore[method](this.topargs);
    };
    }
  }

  // NOTE: ignore https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore here
  addUnderscoreMethods (Class, methods, attribute) {
    underscore.each(methods, (length, method) => {
      if (underscore[method]) Class.prototype[method] = this.addMethod(length, method, attribute);
    });
  }
}

// Backbone.Events
// ---------------

// A module that can be mixed in to *any object* in order to provide it with
// a custom event channel. You may bind a callback to an event with `on` or
// remove with `off`; `trigger`-ing an event fires all callbacks in
// succession.
//
//      let object = {};
//     underscore.extend(object, Backbone.Events);
//     object.on('expand', function(){ alert('expanded');});
//     object.trigger('expand');
//
export class Events extends Backbone {
  constructor () {
    super();
    // Aliases for backwards compatibility.
    this.bind = Events.on;
    this.unbind = Events.off;
  }

  // Iterates over the standard `event, callback` (as well as the fancy multiple
  // space-separated events `"change blur", callback` and jQuery-style event
  // maps `{event: callback}`).
  eventsApi (iteratee, events, name, callback, opts) {
    let i = 0;
    let names;
    if (name && typeof name === 'object') {
      // Handle event maps.
      if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
      for (names = Object.keys(name); i < names.length; i++) {
        events = this.eventsApi(iteratee, events, names[i], name[names[i]], opts);
      }
    } else if (name && this.eventSplitter.test(name)) {
      // Handle space-separated event names by delegating them individually.
      for (names = name.split(this.eventSplitter); i < names.length; i++) {
        events = iteratee(events, names[i], callback, opts);
      }
    } else {
      // Finally, standard events.
      events = iteratee(events, name, callback, opts);
    }
    return events;
  }

  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  on (name, callback, context) {
    return internalOn(this, name, callback, context);
  }

  // Guard the `listening` argument from the public API.
  internalOn (obj, name, callback, context, listening) {
    obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
      context,
      ctx: obj,
      listening
    });

    if (listening) {
      const listeners = obj._listeners || (obj._listeners = {});
      listeners[listening.id] = listening;
    }

    return obj;
  }

  // Inversion-of-control versions of `on`. Tell *this* object to listen to
  // an event in another object... keeping track of what it's listening to
  // for easier unbinding later.
  listenTo (obj, name, callback) {
    if (!obj) return this;
    const id = obj._listenId || (obj._listenId = underscore.uniqueId('l'));
    const listeningTo = this._listeningTo || (this._listeningTo = {});
    let listening = listeningTo[id];

    // This object is not listening to any other events on `obj` yet.
    // Setup the necessary references to track the listening callbacks.
    if (!listening) {
      const thisId = this._listenId || (this._listenId = underscore.uniqueId('l'));
      listening = listeningTo[id] = {obj, objId: id, id: thisId, listeningTo, count: 0};
    }

    // Bind callbacks on obj, and keep track of them on listening.
    internalOn(obj, name, callback, this, listening);
    return this;
  }

  // The reducing API that adds a callback to the `events` object.
  onApi (events, name, callback, options) {
    if (callback) {
      const handlers = events[name] || (events[name] = []);
      const context = options.context;
      const ctx = options.ctx;
      const listening = options.listening;
      if (listening) listening.count++;

      handlers.push({callback, context, ctx: context || ctx, listening});
    }
    return events;
  }

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  off (name, callback, context) {
    if (!this._events) return this;
    this._events = eventsApi(offApi, this._events, name, callback, {
      context,
      listeners: this._listeners
    });
    return this;
  }

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  stopListening (obj, name, callback) {
    const listeningTo = this._listeningTo;
    if (!listeningTo) return this;

    const ids = obj ? [obj._listenId] : Object.keys(listeningTo);

    for (let i = 0; i < ids.length; i++) {
      const listening = listeningTo[ids[i]];

      // If listening doesn't exist, this object is not currently
      // listening to obj. Break out early.
      if (!listening) break;

      listening.obj.off(name, callback, this);
    }

    return this;
  }

  // The reducing API that removes a callback from the `events` object.
  offApi (events, name, callback, options) {
    if (!events) return;

    let i = 0;
    let listening;
    const context = options.context;
    const listeners = options.listeners;

    // Delete all events listeners and "drop" events.
    if (!name && !callback && !context) {
      const ids = Object.keys(listeners);
      for (; i < ids.length; i++) {
        listening = listeners[ids[i]];
        delete listeners[listening.id];
        delete listening.listeningTo[listening.objId];
      }
      return;
    }

    const names = name ? [name] : Object.keys(events);
    for (; i < names.length; i++) {
      name = names[i];
      const handlers = events[name];

      // Bail out if there are no events stored.
      if (!handlers) break;

      // Replace events if there are any remaining.  Otherwise, clean up.
      const remaining = [];
      for (let j = 0; j < handlers.length; j++) {
        const handler = handlers[j];
        // StandardJS: can't ambiguously be && and || ; recheck if problems
        // https://en.wikibooks.org/wiki/JavaScript/Operators was useful here
        if (
          (callback && (callback !== handler.callback) && // callback, but not handler.callback, AND
          (callback !== handler.callback._callback)) || // callback, but not handler.callback._callback, OR
          (context && (context !== handler.context)) // context, but not handler.context
        ) {
          remaining.push(handler);
        } else {
          listening = handler.listening;
          if (listening && --listening.count === 0) {
            delete listeners[listening.id];
            delete listening.listeningTo[listening.objId];
          }
        }
      }

      // Update tail event if the list has any events.  Otherwise, clean up.
      if (remaining.length) {
        events[name] = remaining;
      } else {
        delete events[name];
      }
    }
    return events;
  }

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, its listener will be removed. If multiple events
  // are passed in using the space-separated syntax, the handler will fire
  // once for each event, not once for a combination of all events.
  once (name, callback, context) {
    // Map the event into a `{event: once}` object.
    const events = eventsApi(onceMap, {}, name, callback, underscore.bind(this.off, this));
    if (typeof name === 'string' && context == null) callback = void 0;
    return this.on(events, callback, context);
  }

  // Inversion-of-control versions of `once`.
  listenToOnce (obj, name, callback) {
    // Map the event into a `{event: once}` object.
    const events = this.eventsApi(this.onceMap, {}, name, callback, underscore.bind(this.stopListening, this, obj));
    return this.listenTo(obj, events);
  }

  // Reduces the event callbacks into a map of `{event: onceWrapper}`.
  // `offer` unbinds the `onceWrapper` after it has been called.
  onceMap (map, name, callback, offer) {
    if (callback) {
      const once = map[name] = underscore.once(function (...args) {
        offer(name, once);
        callback.apply(this, args);
      });
      once._callback = callback;
    }
    return map;
  }

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger (name) {
    if (!this._events) return this;

    const length = Math.max(0, arguments.length - 1);
    const args = Array(length);
    for (let i = 0; i < length; i++) args[i] = arguments[i + 1];

    eventsApi(triggerApi, this._events, name, void 0, args);
    return this;
  }

  // Handles triggering the appropriate event callbacks.
  triggerApi (objEvents, name, callback, args) {
    if (objEvents) {
      const events = objEvents[name];
      let allEvents = objEvents.all;
      if (events && allEvents) allEvents = allEvents.slice();
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, [name].concat(args));
    }
    return objEvents;
  }

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  triggerEvents (events, args) {
    let ev;
    let i = -1;
    const l = events.length;
    const a1 = args[0];
    const a2 = args[1];
    const a3 = args[2];
    switch (args.length) {
    case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
    case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
    case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
    case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
    default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  }
}

// Backbone.Model
// --------------

// Backbone **Models** are the basic data object in the framework --
// frequently representing a row in a table in a database on your server.
// A discrete chunk of data and a bunch of useful, related methods for
// performing computations and transformations on that data.
export class Model extends Backbone.Events {
  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  constructor (attributes, options) {
    super(); // calls to Backbone.Events
    let attrs = attributes || {};
    options || (options = {});
    this.cid = underscore.uniqueId(this.cidPrefix);
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    const defaults = underscore.result(this, 'defaults');
    attrs = underscore.defaults(underscore.extend({}, defaults, attrs), defaults);
    this.set(attrs, options);

    // A hash of attributes whose current and previous value differ.
    this.changed = this.attributes.changed || null;

    // The value returned during the last failed validation.
    this.validationError = this.attributes.changed || null;

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    this.idAttribute = this.attributes.idAttribute || 'id';

    // The prefix is used to create the client id which is used to identify models locally.
    // You may want to override this if you're experiencing name clashes with model ids.
    this.cidPrefix = this.attributes.cidPrfix || 'c';

    // Mix in each Underscore method as a proxy to `Model#attributes`.
    addUnderscoreMethods(Model, modelMethods, attributes);

    // Initialize
    this.initialize.apply(this, arguments);
  }

  // Return a copy of the model's `attributes` object.
  toJSON (options) {
    return underscore.clone(this.attributes);
  }

  // Get the value of an attribute.
  get (attr) {
    return this.attributes[attr];
  }

  // Get the HTML-escaped value of an attribute.
  escape (attr) {
    return underscore.escape(this.get(attr));
  }

  // Returns `true` if the attribute contains a value that is not null
  // or undefined.
  has (attr) {
    return this.get(attr) != null;
  }

  // Special-cased proxy to underscore's `underscore.matches` method.
  matches (attrs) {
    return !!underscore.iteratee(attrs, this)(this.attributes);
  }

  // Set a hash of model attributes on the object, firing `"change"`. This is
  // the core primitive operation of a model, updating the data and notifying
  // anyone who needs to know about the change in state. The heart of the beast.
  set (key, val, options) {
    if (key == null) return this;

    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs;
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      (attrs = {})[key] = val;
    }

    options || (options = {});

    // Run validation.
    if (!this._validate(attrs, options)) return false;

    // Extract attributes and options.
    const unset = options.unset;
    const silent = options.silent;
    const changes = [];
    const changing = this._changing;
    this._changing = true;

    if (!changing) {
      this._previousAttributes = underscore.clone(this.attributes);
      this.changed = {};
    }

    const current = this.attributes;
    const changed = this.changed;
    const prev = this._previousAttributes;

    // For each `set` attribute, update or delete the current value.
    for (const attr in attrs) {
      val = attrs[attr];
      if (!underscore.isEqual(current[attr], val)) changes.push(attr);
      if (!underscore.isEqual(prev[attr], val)) {
        changed[attr] = val;
      } else {
        delete changed[attr];
      }
      unset ? delete current[attr] : current[attr] = val;
    }

    // Update the `id`.
    if (this.idAttribute in attrs) this.id = this.get(this.idAttribute);

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length) this._pending = options;
      for (let i = 0; i < changes.length; i++) {
        this.trigger(`change:${changes[i]}`, this, current[changes[i]], options);
      }
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing) return this;
    if (!silent) {
      while (this._pending) {
        options = this._pending;
        this._pending = false;
        this.trigger('change', this, options);
      }
    }
    this._pending = false;
    this._changing = false;
    return this;
  }

  // Remove an attribute from the model, firing `"change"`. `unset` is a noop
  // if the attribute doesn't exist.
  unset (attr, options) {
    return this.set(attr, void 0, underscore.extend({}, options, {unset: true}));
  }

  // Clear all attributes on the model, firing `"change"`.
  clear (options) {
    const attrs = {};
    for (const key in this.attributes) attrs[key] = void 0;
    return this.set(attrs, underscore.extend({}, options, {unset: true}));
  }

  // Determine if the model has changed since the last `"change"` event.
  // If you specify an attribute name, determine if that attribute has changed.
  hasChanged (attr) {
    if (attr == null) return !underscore.isEmpty(this.changed);
    return underscore.has(this.changed, attr);
  }

  // Return an object containing all the attributes that have changed, or
  // false if there are no changed attributes. Useful for determining what
  // parts of a view need to be updated and/or what attributes need to be
  // persisted to the server. Unset attributes will be set to undefined.
  // You can also pass an attributes object to diff against the model,
  // determining if there *would be* a change.
  changedAttributes (diff) {
    if (!diff) return this.hasChanged() ? underscore.clone(this.changed) : false;
    const old = this._changing ? this._previousAttributes : this.attributes;
    const changed = {};
    for (const attr in diff) {
      const val = diff[attr];
      if (underscore.isEqual(old[attr], val)) continue;
      changed[attr] = val;
    }
    return Object.keys(changed).length ? changed : false;
  }

  // Get the previous value of an attribute, recorded at the time the last
  // `"change"` event was fired.
  previous (attr) {
    if (attr == null || !this._previousAttributes) return null;
    return this._previousAttributes[attr];
  }

  // Get all of the attributes of the model at the time of the previous
  // `"change"` event.
  previousAttributes () {
    return underscore.clone(this._previousAttributes);
  }

  // Fetch the model from the server, merging the response with the model's
  // local attributes. Any changed attributes will trigger a "change" event.
  fetch (options) {
    options = underscore.extend({parse: true}, options);
    const model = this;
    const success = options.success;
    options.success = function (resp) {
      const serverAttrs = options.parse ? model.parse(resp, options) : resp;
      if (!model.set(serverAttrs, options)) return false;
      if (success) success.call(options.context, model, resp, options);
      model.trigger('sync', model, resp, options);
    };
    wrapError(this, options);
    return this.sync('read', this, options);
  }

  // Set a hash of model attributes, and sync the model to the server.
  // If the server returns an attributes hash that differs, the model's
  // state will be `set` again.
  save (key, val, options) {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs;
    if (key == null || typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      (attrs = {})[key] = val;
    }

    options = underscore.extend({validate: true, parse: true}, options);
    const wait = options.wait;

    // If we're not waiting and attributes exist, save acts as
    // `set(attr).save(null, opts)` with validation. Otherwise, check if
    // the model will be valid when the attributes, if any, are set.
    if (attrs && !wait) {
      if (!this.set(attrs, options)) return false;
    } else if (!this._validate(attrs, options)) {
      return false;
    }

    // After a successful server-side save, the client is (optionally)
    // updated with the server-side state.
    const model = this;
    const success = options.success;
    const attributes = this.attributes;
    options.success = function (resp) {
      // Ensure attributes are restored during synchronous saves.
      model.attributes = attributes;
      let serverAttrs = options.parse ? model.parse(resp, options) : resp;
      if (wait) serverAttrs = underscore.extend({}, attrs, serverAttrs);
      if (serverAttrs && !model.set(serverAttrs, options)) return false;
      if (success) success.call(options.context, model, resp, options);
      model.trigger('sync', model, resp, options);
    };
    wrapError(this, options);

    // Set temporary attributes if `{wait: true}` to properly find new ids.
    if (attrs && wait) this.attributes = underscore.extend({}, attributes, attrs);

    const method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
    if (method === 'patch' && !options.attrs) options.attrs = attrs;
    const xhr = this.sync(method, this, options);

    // Restore attributes.
    this.attributes = attributes;

    return xhr;
  }

  // Destroy this model on the server if it was already persisted.
  // Optimistically removes the model from its collection, if it has one.
  // If `wait: true` is passed, waits for the server to respond before removal.
  destroy (options) {
    options = options ? underscore.clone(options) : {};
    const model = this;
    const success = options.success;
    const wait = options.wait;

    const destroy = function () {
      model.stopListening();
      model.trigger('destroy', model, model.collection, options);
    };

    options.success = function (resp) {
      if (wait) destroy();
      if (success) success.call(options.context, model, resp, options);
      if (!model.isNew()) model.trigger('sync', model, resp, options);
    };

    let xhr = false;
    if (this.isNew()) {
      underscore.defer(options.success);
    } else {
      wrapError(this, options);
      xhr = this.sync('delete', this, options);
    }
    if (!wait) destroy();
    return xhr;
  }

  // Default URL for the model's representation on the server -- if you're
  // using Backbone's restful methods, override this to change the endpoint
  // that will be called.
  url () {
    const base =
    underscore.result(this, 'urlRoot') ||
    underscore.result(this.collection, 'url') ||
    urlError();
    if (this.isNew()) return base;
    const id = this.get(this.idAttribute);
    return base.replace(/[^/]$/, '$&/') + encodeURIComponent(id);
  }

  // **parse** converts a response into the hash of attributes to be `set` on
  // the model. The default implementation is just to pass the response along.
  parse (resp, options) {
    return resp;
  }

  // Create a new model with identical attributes to this one.
  clone () {
    return new this.constructor(this.attributes);
  }

  // A model is new if it has never been saved to the server, and lacks an id.
  isNew () {
    return !this.has(this.idAttribute);
  }

  // Check if the model is currently in a valid state.
  isValid (options) {
    return this._validate({}, underscore.extend({}, options, {validate: true}));
  }

  // Run validation against the next complete set of model attributes,
  // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
  _validate (attrs, options) {
    if (!options.validate || !this.validate) return true;
    attrs = underscore.extend({}, this.attributes, attrs);
    const error = this.validationError = this.validate(attrs, options) || null;
    if (!error) return true;
    this.trigger('invalid', this, error, underscore.extend(options, {validationError: error}));
    return false;
  }

  // Underscore methods that we want to implement on the Model, mapped to the
  // number of arguments they take.
  modelMethods () {
    return { keys: 1,
      values: 1,
      pairs: 1,
      invert: 1,
      pick: 0,
      omit: 0,
      chain: 1,
      isEmpty: 1
    }
    ;
  }
}

// Backbone.Collection
// -------------------

// If models tend to represent a single row of data, a Backbone Collection is
// more analogous to a table full of data ... or a small slice or page of that
// table, or a collection of rows that belong together for a particular reason
// -- all of the messages in this particular folder, all of the documents
// belonging to this particular author, and so on. Collections maintain
// indexes of their models, both in order, and for lookup by `id`.

// Create a new **Collection**, perhaps to contain a specific type of `model`.
// If a `comparator` is specified, the Collection will maintain
// its models in sort order, as they're added and removed.
export class Collection extends Backbone.Model {
  constructor (models, options) {
    super();
    options || (options = {});
    // TODO: fix this!
    this.preinitialize.apply(this, arguments);

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    this.model = options.model ? options.model : Model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();

    this.initialize.apply(this, arguments);
    if (models) this.reset(models, underscore.extend({silent: true}, options));

    // Default options for `Collection#set`.
    this.setOptions = {add: true, remove: true, merge: true};
    this.addOptions = {add: true, remove: false};

    // Mix in each Underscore method as a proxy to `Collection#models`.
    this.addUnderscoreMethods(Collection, this.collectionMethods, 'models');
  }

  // The JSON representation of a Collection is an array of the
  // models' attributes.
  toJSON (options) {
    return this.map((model) => { return model.toJSON(options); });
  }

  // Add a model, or list of models to the set. `models` may be Backbone
  // Models or raw JavaScript objects to be converted to Models, or any
  // combination of the two.
  add (models, options) {
    return this.set(models, underscore.extend({merge: false}, options, addOptions));
  }

  // Remove a model, or a list of models from the set.
  remove (models, options) {
    options = underscore.extend({}, options);
    const singular = !underscore.isArray(models);
    models = singular ? [models] : models.slice();
    const removed = this._removeModels(models, options);
    if (!options.silent && removed.length) {
      options.changes = {added: [], merged: [], removed};
      this.trigger('update', this, options);
    }
    return singular ? removed[0] : removed;
  }

  // Update a collection by `set`-ing a new list of models, adding new ones,
  // removing models that are no longer present, and merging models that
  // already exist in the collection, as necessary. Similar to **Model#set**,
  // the core operation for updating the data contained by the collection.
  set (models, options) {
    if (models == null) return;

    options = underscore.extend({}, setOptions, options);
    if (options.parse && !this._isModel(models)) {
      models = this.parse(models, options) || [];
    }

    const singular = !underscore.isArray(models);
    models = singular ? [models] : models.slice();

    let at = options.at;
    if (at != null) at = +at;
    if (at > this.length) at = this.length;
    if (at < 0) at += this.length + 1;

    const set = [];
    const toAdd = [];
    const toMerge = [];
    const toRemove = [];
    const modelMap = {};

    const add = options.add;
    const merge = options.merge;
    const remove = options.remove;

    let sort = false;
    const sortable = this.comparator && at == null && options.sort !== false;
    const sortAttr = underscore.isString(this.comparator) ? this.comparator : null;

    // Turn bare objects into model references, and prevent invalid models
    // from being added.
    let model, i;
    for (i = 0; i < models.length; i++) {
      model = models[i];

      // If a duplicate is found, prevent it from being added and
      // optionally merge it into the existing model.
      const existing = this.get(model);
      if (existing) {
        if (merge && model !== existing) {
          let attrs = this._isModel(model) ? model.attributes : model;
          if (options.parse) attrs = existing.parse(attrs, options);
          existing.set(attrs, options);
          toMerge.push(existing);
          if (sortable && !sort) sort = existing.hasChanged(sortAttr);
        }
        if (!modelMap[existing.cid]) {
          modelMap[existing.cid] = true;
          set.push(existing);
        }
        models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
      } else if (add) {
        model = models[i] = this._prepareModel(model, options);
        if (model) {
          toAdd.push(model);
          this._addReference(model, options);
          modelMap[model.cid] = true;
          set.push(model);
        }
      }
    }

    // Remove stale models.
    if (remove) {
      for (i = 0; i < this.length; i++) {
        model = this.models[i];
        if (!modelMap[model.cid]) toRemove.push(model);
      }
      if (toRemove.length) this._removeModels(toRemove, options);
    }

    // See if sorting is needed, update `length` and splice in new models.
    let orderChanged = false;
    const replace = !sortable && add && remove;
    if (set.length && replace) {
      orderChanged = this.length !== set.length || this.models.some((m, index) => {
        return m !== set[index];
      });
      this.models.length = 0;
      this.splice(this.models, set, 0);
      this.length = this.models.length;
    } else if (toAdd.length) {
      if (sortable) sort = true;
      this.splice(this.models, toAdd, at == null ? this.length : at);
      this.length = this.models.length;
    }

    // Silently sort the collection if appropriate.
    if (sort) this.sort({silent: true});

    // Unless silenced, it's time to fire all appropriate add/sort/update events.
    if (!options.silent) {
      for (i = 0; i < toAdd.length; i++) {
        if (at != null) options.index = at + i;
        model = toAdd[i];
        model.trigger('add', model, this, options);
      }
      if (sort || orderChanged) this.trigger('sort', this, options);
      if (toAdd.length || toRemove.length || toMerge.length) {
        options.changes = {
          added: toAdd,
          removed: toRemove,
          merged: toMerge
        };
        this.trigger('update', this, options);
      }
    }

    // Return the added (or merged) model (or models).
    return singular ? models[0] : models;
  }

  // When you have more items than you want to add or remove individually,
  // you can reset the entire set with a new list of models, without firing
  // any granular `add` or `remove` events. Fires `reset` when finished.
  // Useful for bulk operations and optimizations.
  reset (models, options) {
    options = options ? underscore.clone(options) : {};
    for (let i = 0; i < this.models.length; i++) {
      this._removeReference(this.models[i], options);
    }
    options.previousModels = this.models;
    this._reset();
    models = this.add(models, underscore.extend({silent: true}, options));
    if (!options.silent) this.trigger('reset', this, options);
    return models;
  }

  // Add a model to the end of the collection.
  push (model, options) {
    return this.add(model, underscore.extend({at: this.length}, options));
  }

  // Remove a model from the end of the collection.
  pop (options) {
    const model = this.at(this.length - 1);
    return this.remove(model, options);
  }

  // Add a model to the beginning of the collection.
  unshift (model, options) {
    return this.add(model, underscore.extend({at: 0}, options));
  }

  // Remove a model from the beginning of the collection.
  shift (options) {
    const model = this.at(0);
    return this.remove(model, options);
  }

  // Slice out a sub-array of models from the collection.
  slice () {
    return slice.apply(this.models, arguments);
  }

  // Get a model from the set by id, cid, model object with id or cid
  // properties, or an attributes object that is transformed through modelId.
  // StandardJS: can't ambiguously be && and || ; recheck if problems
  get (obj) {
    if (obj == null) return void 0;
    return this._byId[obj] ||
    this._byId[this.modelId(obj.attributes || obj)] ||
    (obj.cid && this._byId[obj.cid]);
  }

  // Returns `true` if the model is in the collection.
  has (obj) {
    return this.get(obj) != null;
  }

  // Get the model at the given index.
  at (index) {
    if (index < 0) index += this.length;
    return this.models[index];
  }

  // Return models with matching attributes. Useful for simple cases of
  // `filter`.
  where (attrs, first) {
    return this[first ? 'find' : 'filter'](attrs);
  }

  // Return the first model with matching attributes. Useful for simple cases
  // of `find`.
  findWhere (attrs) {
    return this.where(attrs, true);
  }

  // Force the collection to re-sort itself. You don't need to call this under
  // normal circumstances, as the set will maintain sort order as each item
  // is added.
  sort (options) {
    let comparator = this.comparator;
    if (!comparator) throw new Error('Cannot sort a set without a comparator');
    options || (options = {});

    const length = comparator.length;
    if (underscore.isFunction(comparator)) comparator = underscore.bind(comparator, this);

    // Run sort based on type of `comparator`.
    if (length === 1 || underscore.isString(comparator)) {
      this.models = this.sortBy(comparator);
    } else {
      this.models.sort(comparator);
    }
    if (!options.silent) this.trigger('sort', this, options);
    return this;
  }

  // Pluck an attribute from each model in the collection.
  pluck (attr) {
    return this.map(`${attr}`);
  }

  // Fetch the default set of models for this collection, resetting the
  // collection when they arrive. If `reset: true` is passed, the response
  // data will be passed through the `reset` method instead of `set`.
  fetch (options) {
    options = underscore.extend({parse: true}, options);
    const success = options.success;
    const collection = this;
    options.success = function (resp) {
      const method = options.reset ? 'reset' : 'set';
      collection[method](resp, options);
      if (success) success.call(options.context, collection, resp, options);
      collection.trigger('sync', collection, resp, options);
    };
    wrapError(this, options);
    return this.sync('read', this, options);
  }

  // Create a new instance of a model in this collection. Add the model to the
  // collection immediately, unless `wait: true` is passed, in which case we
  // wait for the server to agree.
  create (model, options) {
    options = options ? underscore.clone(options) : {};
    const wait = options.wait;
    model = this._prepareModel(model, options);
    if (!model) return false;
    if (!wait) this.add(model, options);
    const collection = this;
    const success = options.success;
    options.success = function (m, resp, callbackOpts) {
      if (wait) collection.add(m, callbackOpts);
      if (success) success.call(callbackOpts.context, m, resp, callbackOpts);
    };
    model.save(null, options);
    return model;
  }

  // **parse** converts a response into a list of models to be added to the
  // collection. The default implementation is just to pass it through.
  parse (resp, options) {
    return resp;
  }

  // Create a new collection with an identical list of models as this one.
  clone () {
    return new this.constructor(this.models, {
      model: this.model,
      comparator: this.comparator
    });
  }

  // Define how to uniquely identify models in the collection.
  modelId (attrs) {
    return attrs[this.model.prototype.idAttribute || 'id'];
  }

  // Private method to reset all internal state. Called when the collection
  // is first initialized or reset.
  _reset () {
    this.length = 0;
    this.models = [];
    this._byId = {};
  }

  // Prepare a hash of attributes (or other model) to be added to this
  // collection.
  _prepareModel (attrs, options) {
    if (this._isModel(attrs)) {
      if (!attrs.collection) attrs.collection = this;
      return attrs;
    }
    options = options ? underscore.clone(options) : {};
    options.collection = this;
    const model = new this.model(attrs, options);
    if (!model.validationError) return model;
    this.trigger('invalid', this, model.validationError, options);
    return false;
  }

  // Internal method called by both remove and set.
  _removeModels (models, options) {
    const removed = [];
    for (let i = 0; i < models.length; i++) {
      const model = this.get(models[i]);
      if (!model) continue;

      const index = this.indexOf(model);
      this.models.this.splice(index, 1);
      this.length--;

      // Remove references before triggering 'remove' event to prevent an
      // infinite loop. #3693
      delete this._byId[model.cid];
      const id = this.modelId(model.attributes);
      if (id != null) delete this._byId[id];

      if (!options.silent) {
        options.index = index;
        model.trigger('remove', model, this, options);
      }

      removed.push(model);
      this._removeReference(model, options);
    }
    return removed;
  }

  // Method for checking whether an object should be considered a model for
  // the purposes of adding to the collection.
  _isModel (model) {
    return model instanceof Model;
  }

  // Internal method to create a model's ties to a collection.
  _addReference (model, options) {
    this._byId[model.cid] = model;
    const id = this.modelId(model.attributes);
    if (id != null) this._byId[id] = model;
    model.on('all', this._onModelEvent, this);
  }

  // Internal method to sever a model's ties to a collection.
  _removeReference (model, options) {
    delete this._byId[model.cid];
    const id = this.modelId(model.attributes);
    if (id != null) delete this._byId[id];
    if (this === model.collection) delete model.collection;
    model.off('all', this._onModelEvent, this);
  }

  // Internal method called every time a model in the set fires an event.
  // Sets need to update their indexes when models change ids. All other
  // events simply proxy through. "add" and "remove" events that originate
  // in other collections are ignored.
  _onModelEvent (event, model, collection, options) {
    if (model) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (event === 'change') {
        const prevId = this.modelId(model.previousAttributes());
        const id = this.modelId(model.attributes);
        if (prevId !== id) {
          if (prevId != null) delete this._byId[prevId];
          if (id != null) this._byId[id] = model;
        }
      }
    }
    this.trigger.apply(this, arguments);
  }

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  collectionMethods () {
    return { forEach: 3,
      each: 3,
      map: 3,
      collect: 3,
      reduce: 0,
      foldl: 0,
      inject: 0,
      reduceRight: 0,
      foldr: 0,
      find: 3,
      detect: 3,
      filter: 3,
      select: 3,
      reject: 3,
      every: 3,
      all: 3,
      some: 3,
      any: 3,
      include: 3,
      includes: 3,
      contains: 3,
      invoke: 0,
      max: 3,
      min: 3,
      toArray: 1,
      size: 1,
      first: 3,
      head: 3,
      take: 3,
      initial: 3,
      rest: 3,
      tail: 3,
      drop: 3,
      last: 3,
      without: 0,
      difference: 0,
      indexOf: 3,
      shuffle: 1,
      lastIndexOf: 3,
      isEmpty: 1,
      chain: 1,
      sample: 3,
      partition: 3,
      groupBy: 3,
      countBy: 3,
      sortBy: 3,
      indexBy: 3,
      findIndex: 3,
      findLastIndex: 3};
  }
}

// Backbone.View
// -------------

// Backbone Views are almost more convention than they are actual code. A View
// is simply a JavaScript object that represents a logical chunk of UI in the
// DOM. This might be a single item, an entire list, a sidebar or panel, or
// even the surrounding frame which wraps your whole app. Defining a chunk of
// UI as a **View** allows you to define your DOM events declaratively, without
// having to worry about render order ... and makes it easy for the view to
// react to specific changes in the state of your models.

// Creating a Backbone.View creates its initial element outside of the DOM,
// if an existing element is not provided...
export class View extends Backbone.Events {
  constructor (options) {
    super();
    this.cid = underscore.uniqueId('view');
    // Cached regex to split keys for `delegate`.
    this.delegateEventSplitter = /^(\S+)\s*(.*)$/;
    // The default `tagName` of a View's element is `"div"`.
    this.tagName = 'div';
    // List of view options to be set as properties.
    this.viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];
    underscore.extend(this, underscore.pick(options, this.viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
  }

  // jQuery delegate for element lookup, scoped to DOM elements within the
  // current view. This should be preferred to global lookups where possible.
  $ (selector) {
    return this.$el.find(selector);
  }

  // **render** is the core function that your view should override, in order
  // to populate its element (`this.el`), with the appropriate HTML. The
  // convention is for **render** to always return `this`.
  render () {
    return this;
  }

  // Remove this view by taking the element out of the DOM, and removing any
  // applicable Backbone.Events listeners.
  remove () {
    this._removeElement();
    this.stopListening();
    return this;
  }

  // Remove this view's element from the document and all event listeners
  // attached to it. Exposed for subclasses using an alternative DOM
  // manipulation API.
  _removeElement () {
    this.$el.remove();
  }

  // Change the view's element (`this.el` property) and re-delegate the
  // view's events on the new element.
  setElement (element) {
    this.undelegateEvents();
    this._setElement(element);
    this.delegateEvents();
    return this;
  }

  // Creates the `this.el` and `this.$el` references for this view using the
  // given `el`. `el` can be a CSS selector or an HTML string, a jQuery
  // context or an element. Subclasses can override this to utilize an
  // alternative DOM manipulation API and are only required to set the
  // `this.el` property.
  _setElement (el) {
    this.$el = el instanceof Backbone.$ ? el : Backbone.$(el);
    this.el = this.$el[0];
  }

  // Set callbacks, where `this.events` is a hash of
  //
  // *{"event selector": "callback"}*
  //
  //     {
  //       'mousedown .title':  'edit',
  //       'click .button':     'save',
  //       'click .open':       function(e) { ...}
  //    }
  //
  // pairs. Callbacks will be bound to the view, with `this` set properly.
  // Uses event delegation for efficiency.
  // Omitting the selector binds the event to `this.el`.
  delegateEvents (events) {
    events || (events = underscore.result(this, 'events'));
    if (!events) return this;
    this.undelegateEvents();
    for (const key in events) {
      let method = events[key];
      if (!underscore.isFunction(method)) method = this[method];
      if (!method) continue;
      const match = key.match(delegateEventSplitter);
      this.delegate(match[1], match[2], underscore.bind(method, this));
    }
    return this;
  }

  // Add a single event listener to the view's element (or a child element
  // using `selector`). This only works for delegate-able events: not `focus`,
  // `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
  delegate (eventName, selector, listener) {
    this.$el.on(`${eventName}.delegateEvents${this.cid}`, selector, listener);
    return this;
  }

  // Clears all callbacks previously bound to the view by `delegateEvents`.
  // You usually don't need to use this, but may wish to if you have multiple
  // Backbone views attached to the same DOM element.
  undelegateEvents () {
    if (this.$el) this.$el.off(`.delegateEvents${this.cid}`);
    return this;
  }

  // A finer-grained `undelegateEvents` for removing a single delegated event.
  // `selector` and `listener` are both optional.
  undelegate (eventName, selector, listener) {
    this.$el.off(`${eventName}.delegateEvents${this.cid}`, selector, listener);
    return this;
  }

  // Produces a DOM element to be assigned to your view. Exposed for
  // subclasses using an alternative DOM manipulation API.
  _createElement (tagName) {
    return document.createElement(tagName);
  }

  // Ensure that the View has a DOM element to render into.
  // If `this.el` is a string, pass it through `$()`, take the first
  // matching element, and re-assign it to `el`. Otherwise, create
  // an element from the `id`, `className` and `tagName` properties.
  _ensureElement () {
    if (!this.el) {
      const attrs = underscore.extend({}, underscore.result(this, 'attributes'));
      if (this.id) attrs.id = underscore.result(this, 'id');
      if (this.className) attrs.class = underscore.result(this, 'className');
      this.setElement(this._createElement(underscore.result(this, 'tagName')));
      this._setAttributes(attrs);
    } else {
      this.setElement(underscore.result(this, 'el'));
    }
  }

  // Set attributes from a hash on this view's element.  Exposed for
  // subclasses using an alternative DOM manipulation API.
  _setAttributes (attributes) {
    this.$el.attr(attributes);
  }
}

// Backbone.sync
// -------------

// Override this function to change the manner in which Backbone persists
// models to the server. You will be passed the type of request, and the
// model in question. By default, makes a RESTful Ajax request
// to the model's `url()`. Some possible customizations could be:
//
// * Use `setTimeout` to batch rapid-fire updates into a single request.
// * Send up the models as XML instead of JSON.
// * Persist models via WebSockets instead of Ajax.
//
// Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
// as `POST`, with a `_method` parameter containing the true HTTP method,
// as well as all requests with the body as `application/x-www-form-urlencoded`
// instead of `application/json` with the model in a param named `model`.
// Useful when interfacing with server-side languages like **PHP** that make
// it difficult to read the body of `PUT` requests.
export class Sync extends Backbone {
  constructor (method, model, options) {
    super();
    this.type = methodMap[method];
    // Default options, unless specified.
    underscore.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    this.params = {type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = underscore.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      // TODO: fix this up with a Promise
      const beforeSend = options.beforeSend;
      options.beforeSend = function (xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // Pass along `textStatus` and `errorThrown` from jQuery.
    this.error = (xhr, textStatus, errorThrown) => {
      options.textStatus = textStatus;
      options.errorThrown = errorThrown;
      if (error) error.call(options.context, xhr, textStatus, errorThrown);
    };

    // Make the request, allowing the user to override any Ajax options.
    this.xhr = options.xhr = Backbone.ajax(underscore.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  }

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  methodMap () {
    return {
      create: 'POST',
      update: 'PUT',
      patch: 'PATCH',
      delete: 'DELETE',
      read: 'GET'
    }
    ;
  }
}

// Backbone.Router
// ---------------

// Routers map faux-URLs to actions, and fire events when routes are
// matched. Creating a new one sets its `routes` hash, if not set statically.
export class Router extends Backbone.Events {
  constructor (options) {
    super();
    if (options.routes) this.routes = options.routes;

    // Cached regular expressions for matching named param parts and splatted
    // parts of route strings.
    this.optionalParam = /\((.*?)\)/g;
    this.namedParam = /(\(\?)?:\w+/g;
    this.splatParam = /\*\w+/g;
    this.escapeRegExp = /[-{}[\]+?.,\\^$|#\s]/g;

    this._bindRoutes();
    this.initialize.apply(this, arguments);
  }

  // Manually bind a single named route to a callback. For example:
  //
  //     this.route('search/:query/p:num', 'search', function(query, num) {
  //       ...
  //    });
  //
  route (route, name, callback) {
    if (!underscore.isRegExp(route)) route = this._routeToRegExp(route);
    if (underscore.isFunction(name)) {
      callback = name;
      name = '';
    }
    if (!callback) callback = this[name];
    const router = this;
    Backbone.history.route(route, (fragment) => {
      const args = router._extractParameters(route, fragment);
      if (router.execute(callback, args, name) !== false) {
        router.trigger(...[`route:${name}`].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      }
    });
    return this;
  }

  // Execute a route handler with the provided parameters.  This is an
  // excellent place to do pre-route setup or post-route cleanup.
  execute (callback, args, name) {
    if (callback) callback.apply(this, args);
  }

  // Simple proxy to `Backbone.history` to save a fragment into the history.
  navigate (fragment, options) {
    Backbone.history.navigate(fragment, options);
    return this;
  }

  // Bind all defined routes to `Backbone.history`. We have to reverse the
  // order of the routes here to support behavior where the most general
  // routes can be defined at the bottom of the route map.
  _bindRoutes () {
    if (!this.routes) return;
    this.routes = underscore.result(this, 'routes');
    let route;
    const routes = Object.keys(this.routes);
    while ((route = routes.pop()) != null) {
      this.route(route, this.routes[route]);
    }
  }

  // Convert a route string into a regular expression, suitable for matching
  // against the current location hash.
  _routeToRegExp (route) {
    route = route.replace(escapeRegExp, '\\$&')
      .replace(optionalParam, '(?:$1)?')
      .replace(namedParam, (match, optional) => {
        return optional ? match : '([^/?]+)';
      })
      .replace(splatParam, '([^?]*?)');
    return new RegExp(`^${route}(?:\\?([\\s\\S]*))?$`);
  }

  // Given a route, and a URL fragment that it matches, return the array of
  // extracted decoded parameters. Empty or unmatched parameters will be
  // treated as `null` to normalize cross-browser behavior.
  _extractParameters (route, fragment) {
    const params = route.exec(fragment).slice(1);
    return params.map((param, i) => {
      // Don't decode the search params.
      if (i === params.length - 1) return param || null;
      return param ? decodeURIComponent(param) : null;
    });
  }
}

// Backbone.History
// ----------------

// Handles cross-browser history management, based on either
// [pushState](http://diveintohtml5.info/history.html) and real URLs, or
// [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
// and URL fragments. If the browser supports neither (old IE, natch),
// falls back to polling.
export class History extends Backbone.Events {
  constructor (...args) {
    super(...args);
    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    this.interval = new Map(...args).get('interval') || 20;
    this.handlers = [];
    this.checkUrl = underscore.bind(this.checkUrl, this);

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }

    // Has the history handling already been started?
    this.started = false;
  }

  // Are we at the app root?
  atRoot () {
    const path = this.location.pathname.replace(/[^/]$/, '$&/');
    return path === this.root && !this.getSearch();
  }

  // Does the pathname match the root?
  matchRoot () {
    const path = this.decodeFragment(this.location.pathname);
    const rootPath = `${path.slice(0, this.root.length - 1)}/`;
    return rootPath === this.root;
  }

  // Unicode characters in `location.pathname` are percent encoded so they're
  // decoded for comparison. `%25` should not be decoded since it may be part
  // of an encoded parameter.
  decodeFragment (fragment) {
    return decodeURI(fragment.replace(/%25/g, '%2525'));
  }

  // In IE6, the hash fragment and search params are incorrect if the
  // fragment contains `?`.
  getSearch () {
    const match = this.location.href.replace(/#.*/, '').match(/\?.+/);
    return match ? match[0] : '';
  }

  // Gets the true hash value. Cannot use location.hash directly due to bug
  // in Firefox where location.hash will always be decoded.
  getHash (window) {
    const match = (window || this).location.href.match(/#(.*)$/);
    return match ? match[1] : '';
  }

  // Get the pathname and search params, without the root.
  getPath () {
    const path = this.decodeFragment(
      this.location.pathname + this.getSearch()
    ).slice(this.root.length - 1);
    return path.charAt(0) === '/' ? path.slice(1) : path;
  }

  // Get the cross-browser normalized URL fragment from the path or hash.
  getFragment (fragment) {
    if (fragment == null) {
      if (this._usePushState || !this._wantsHashChange) {
        fragment = this.getPath();
      } else {
        fragment = this.getHash();
      }
    }
    return fragment.replace(routeStripper, '');
  }

  // Start the hash change handling, returning `true` if the current URL matches
  // an existing route, and `false` otherwise.
  start (options) {
    if (History.started) throw new Error('Backbone.history has already been started');
    History.started = true;

    // Figure out the initial configuration. Do we need an iframe?
    // Is pushState desired ... is it available?
    this.options = underscore.extend({root: '/'}, this.options, options);
    this.root = this.options.root;
    this._wantsHashChange = this.options.hashChange !== false;
    this._hasHashChange = 'onhashchange' in window && (document.documentMode === void 0 || document.documentMode > 7);
    this._useHashChange = this._wantsHashChange && this._hasHashChange;
    this._wantsPushState = !!this.options.pushState;
    this._hasPushState = !!(this.history && this.history.pushState);
    this._usePushState = this._wantsPushState && this._hasPushState;
    this.fragment = this.getFragment();

    // Normalize root to always include a leading and trailing slash.
    this.root = (`/${this.root}/`).replace(rootStripper, '/');

    // Transition from hashChange to pushState or vice versa if both are
    // requested.
    if (this._wantsHashChange && this._wantsPushState) {
      // If we've started off with a route from a `pushState`-enabled
      // browser, but we're currently in a browser that doesn't support it...
      if (!this._hasPushState && !this.atRoot()) {
        const rootPath = this.root.slice(0, -1) || '/';
        this.location.replace(`${rootPath}#${this.getPath()}`);
        // Return immediately as browser will do redirect to new url
        return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
      } else if (this._hasPushState && this.atRoot()) {
        this.navigate(this.getHash(), {replace: true});
      }
    }

    // Proxy an iframe to handle location events if the browser doesn't
    // support the `hashchange` event, HTML5 history, or the user wants
    // `hashChange` but not `pushState`.
    if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
      this.iframe = document.createElement('iframe');
      this.iframe.src = 'javascript:0';
      this.iframe.style.display = 'none';
      this.iframe.tabIndex = -1;
      const body = document.body;
      // Using `appendChild` will throw on IE < 9 if the document is not ready.
      const iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
      iWindow.document.open();
      iWindow.document.close();
      iWindow.location.hash = `#${this.fragment}`;
    }

    // Add a cross-platform `addEventListener` shim for older browsers.
    const addEventListener = window.addEventListener || function (eventName, listener) {
      return attachEvent(`on${eventName}`, listener);
    };

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
    if (this._usePushState) {
      addEventListener('popstate', this.checkUrl, false);
    } else if (this._useHashChange && !this.iframe) {
      addEventListener('hashchange', this.checkUrl, false);
    } else if (this._wantsHashChange) {
      this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
    }

    if (!this.options.silent) return this.loadUrl();
  }

  // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
  // but possibly useful for unit testing Routers.
  stop () {
    // Add a cross-platform `removeEventListener` shim for older browsers.
    const removeEventListener = window.removeEventListener || function (eventName, listener) {
      return detachEvent(`on${eventName}`, listener);
    };

      // Remove window listeners.
    if (this._usePushState) {
      removeEventListener('popstate', this.checkUrl, false);
    } else if (this._useHashChange && !this.iframe) {
      removeEventListener('hashchange', this.checkUrl, false);
    }

    // Clean up the iframe if necessary.
    if (this.iframe) {
      document.body.removeChild(this.iframe);
      this.iframe = null;
    }

    // Some environments will throw when clearing an undefined interval.
    if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
    History.started = false;
  }

  // Add a route to be tested when the fragment changes. Routes added later
  // may override previous routes.
  route (route, callback) {
    this.handlers.unshift({route, callback});
  }

  // Checks the current URL to see if it has changed, and if it has,
  // calls `loadUrl`, normalizing across the hidden iframe.
  checkUrl (e) {
    let current = this.getFragment();

    // If the user pressed the back button, the iframe's hash will have
    // changed and we should use that for comparison.
    if (current === this.fragment && this.iframe) {
      current = this.getHash(this.iframe.contentWindow);
    }

    if (current === this.fragment) return false;
    if (this.iframe) this.navigate(current);
    this.loadUrl();
  }

  // Attempt to load the current URL fragment. If a route succeeds with a
  // match, returns `true`. If no defined routes matches the fragment,
  // returns `false`.
  loadUrl (fragment) {
    // If the root doesn't match, no routes can match either.
    if (!this.matchRoot()) return false;
    fragment = this.fragment = this.getFragment(fragment);
    return this.handlers.some((handler) => {
      if (handler.route.test(fragment)) {
        handler.callback(fragment);
        return true;
      } return false;
    });
  }

  // Save a fragment into the hash history, or replace the URL state if the
  // 'replace' option is passed. You are responsible for properly URL-encoding
  // the fragment in advance.
  //
  // The options object can contain `trigger: true` if you wish to have the
  // route callback be fired (not usually desirable), or `replace: true`, if
  // you wish to modify the current URL without adding an entry to the history.
  navigate (fragment, options) {
    if (!History.started) return false;
    if (!options || options === true) options = {trigger: !!options};

    // Normalize the fragment.
    fragment = this.getFragment(fragment || '');

    // Don't include a trailing slash on the root.
    let rootPath = this.root;
    if (fragment === '' || fragment.charAt(0) === '?') {
      rootPath = rootPath.slice(0, -1) || '/';
    }
    const url = rootPath + fragment;

    // Strip the hash and decode for matching.
    fragment = this.decodeFragment(fragment.replace(this.pathStripper, ''));

    if (this.fragment === fragment) return;
    this.fragment = fragment;

    // If pushState is available, we use it to set the fragment as a real URL.
    if (this._usePushState) {
      this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
    } else if (this._wantsHashChange) {
      this._updateHash(this.location, fragment, options.replace);
      if (this.iframe && fragment !== this.getHash(this.iframe.contentWindow)) {
        const iWindow = this.iframe.contentWindow;

        // Opening and closing the iframe tricks IE7 and earlier to push a
        // history entry on hash-tag change.  When replace is true, we don't
        // want this.
        if (!options.replace) {
          iWindow.document.open();
          iWindow.document.close();
        }

        this._updateHash(iWindow.location, fragment, options.replace);
      }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
    } else {
      return this.location.assign(url);
    }
    if (options.trigger) return this.loadUrl(fragment);
  }

  // Update the hash location, either replacing the current entry, or adding
  // a new one to the browser history.
  _updateHash (location, fragment, replace) {
    if (replace) {
      const href = location.href.replace(/(javascript:|#).*$/, '');
      location.replace(`${href}#${fragment}`);
    } else {
      // Some browsers require that `hash` contains a leading #.
      location.hash = `#${fragment}`;
    }
  }
}
