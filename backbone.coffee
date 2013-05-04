###
  Backbone.js 1.0.0

  (c) 2010-2011 Jeremy Ashkenas, DocumentCloud Inc.
  (c) 2011-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
  Backbone may be freely distributed under the MIT license.
  For all details and documentation:
  http://backbonejs.org
###


# Initial Setup
# -------------
# Save a reference to the global object (`window` in the browser, `exports`
# on the server).
root = @

# Save the previous value of the `Backbone` variable, so that it can be
# restored later on, if `noConflict` is used.
previousBackbone = root.Backbone

# Create local references to array methods we'll want to use later.
array = []
push = array.push
slice = array.slice
splice = array.splice

# The top-level namespace. All public Backbone classes and modules will
# be attached to this. Exported for both the browser and the server.
if exports?
  Backbone = exports
else
  root.Backbone = {}
  Backbone = root.Backbone

# Require Underscore, if we're on the server, and it's not already present.
_ = root._
_ = require('underscore') if !_? and require?

# Map from CRUD to HTTP for our default `Backbone.sync` implementation.
methodMap =
  create: 'POST'
  update: 'PUT'
  patch: 'PATCH'
  delete: 'DELETE'
  read: 'GET'

_.extend Backbone,
  # Current version of the library. Keep in sync with `package.json`.
  VERSION: '1.0.0'
  # For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  # the `$` variable.
  $: root.jQuery or root.Zepto or root.ender or root.$
  # Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  # to its previous owner. Returns a reference to this Backbone object.
  noConflict: ->
    root.Backbone = previousBackbone
    @
  # Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  # will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  # set a `X-Http-Method-Override` header.
  emulateHTTP: false
  # Turn on `emulateJSON` to support legacy servers that can't deal with direct
  # `application/json` requests ... will encode the body as
  # `application/x-www-form-urlencoded` instead and will send the model in a
  # form param named `model`.
  emulateJSON: false
  # Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  # Override this if you'd like to use a different library.
  ajax: -> Backbone.$.ajax.apply Backbone.$, arguments
  # Backbone.sync
  # -------------
  #
  # Override this function to change the manner in which Backbone persists
  # models to the server. You will be passed the type of request, and the
  # model in question. By default, makes a RESTful Ajax request
  # to the model's `url()`. Some possible customizations could be:
  #
  # * Use `setTimeout` to batch rapid-fire updates into a single request.
  # * Send up the models as XML instead of JSON.
  # * Persist models via WebSockets instead of Ajax.
  #
  # Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  # as `POST`, with a `_method` parameter containing the true HTTP method,
  # as well as all requests with the body as `application/x-www-form-urlencoded`
  # instead of `application/json` with the model in a param named `model`.
  # Useful when interfacing with server-side languages like **PHP** that make
  # it difficult to read the body of `PUT` requests.
  sync: (method, model, options = {}) ->
    type = methodMap[method]

    # Default options, unless specified.
    _.defaults options,
      emulateHTTP: Backbone.emulateHTTP
      emulateJSON: Backbone.emulateJSON

    # Default JSON-request options.
    params =
      type: type
      dataType: 'json'

    # Ensure that we have a URL.
    if !options.url
      params.url = _.result(model, 'url') or urlError()

    # Ensure that we have the appropriate request data.
    if !options.data? and model and (method == 'create' or method == 'update' or method == 'patch')
      params.contentType = 'application/json'
      params.data = JSON.stringify(options.attrs or model.toJSON options)

    # For older servers, emulate JSON by encoding the request into an HTML-form.
    if options.emulateJSON
      params.contentType = 'application/x-www-form-urlencoded'
      params.data = if params.data then {model: params.data} else {}

    # For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    # And an `X-HTTP-Method-Override` header.
    if options.emulateHTTP and (type == 'PUT' or type == 'DELETE' or type == 'PATCH')
      params.type = 'POST'
      params.data._method = type if options.emulateJSON
      beforeSend = options.beforeSend
      options.beforeSend = (xhr) ->
        xhr.setRequestHeader 'X-HTTP-Method-Override', type
        return beforeSend.apply(this, arguments) if beforeSend

    # Don't process data on a non-GET request.
    params.processData = false if params.type != 'GET' and !options.emulateJSON

    # If we're sending a `PATCH` request, and we're in an old Internet Explorer
    # that still has ActiveX enabled by default, override jQuery to use that
    # for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if params.type == 'PATCH' and window.ActiveXObject and !(window.external and window.external.msActiveXFilteringEnabled)
      params.xhr = -> new ActiveXObject 'Microsoft.XMLHTTP'

    # Make the request, allowing the user to override any Ajax options.
    options.xhr = Backbone.ajax _.extend(params, options)
    xhr = options.xhr
    model.trigger 'request', model, xhr, options
    xhr
  


# Backbone.Events
# ---------------

# A module that can be mixed in to *any object* in order to provide it with
# custom events. You may bind with `on` or remove with `off` callback
# functions to an event; `trigger`-ing an event fires all callbacks in
# succession.
#
#     var object = {};
#     _.extend(object, Backbone.Events);
#     object.on('expand', function(){ alert('expanded'); });
#     object.trigger('expand');
#
class Backbone.Events
  # Bind an event to a `callback` function. Passing `"all"` will bind
  # the callback to all events fired.
  @on: (name, callback, context) ->
    return @ if !eventsApi(@, 'on', name, [callback, context]) or !callback
    @_events ?= {}
    @_events[name] ?= []
    events = @_events[name]
    events.push
      callback: callback
      context: context
      ctx: context or @
    @
  # Bind an event to only be triggered a single time. After the first time
  # the callback is invoked, it will be removed.
  @once: (name, callback, context) ->
    return @ if !eventsApi(@, 'once', name, [callback, context]) or !callback
    self = @
    once = _.once(->
      self.off name, once
      callback.apply @, arguments
    )
    once._callback = callback
    @on name, once, context
  # Remove one or many callbacks. If `context` is null, removes all
  # callbacks with that function. If `callback` is null, removes all
  # callbacks for the event. If `name` is null, removes all bound
  # callbacks for all events.
  @off: (name, callback, context) ->
    return @ if !@_events or !eventsApi @, 'off', name, [callback, context]
    if !name and !callback and !context
      @_events = {}
      return @
    names = if name then [name] else _.keys @_events
    for i in [0...names.length]
      name = names[i]
      events = @_events[name]
      if events
        retain = []
        @_events[name] = retain
        if callback or context
          for j in [0...events.length]
            ev = events[j]
            if (callback and callback != ev.callback and callback != ev.callback._callback) or (context and context != ev.context)
              retain.push ev
        delete @_events[name] if !retain.length
    @
  # Trigger one or many events, firing all bound callbacks. Callbacks are
  # passed the same arguments as `trigger` is, apart from the event name
  # (unless you're listening on `"all"`, which will cause your callback to
  # receive the true name of the event as the first argument).
  @trigger: (name) ->
    return @ if !@_events
    args = slice.call arguments, 1
    return @ if !eventsApi @, 'trigger', name, args
    events = @_events[name]
    allEvents = @_events.all
    triggerEvents(events, args) if events
    triggerEvents(allEvents, arguments) if allEvents
    @
  # Tell this object to stop listening to either specific events ... or
  # to every object it's currently listening to.
  @stopListening: (obj, name, callback) ->
    listeners = @_listeners
    return @ if !listeners
    deleteListener = !name and !callback
    callback = @ if _.isObject name
    if obj
      listeners = {}
      listeners[obj._listenerId] = obj
    for id, v of listeners
      listeners[id].off(name, callback, @)
      delete @_listeners[id] if deleteListener
    @

Events = Backbone.Events

# Regular expression used to split event strings.
eventSplitter = /\s+/

# Implement fancy features of the Events API such as multiple event
# names `"change blur"` and jQuery-style event maps `{change: action}`
# in terms of the existing API.
eventsApi = (obj, action, name, rest) ->
  return true if !name
  # Handle event maps.
  if _.isObject name
    for key, v of name
      obj[action].apply obj, [key, name[key]].concat(rest)
    return false
  # Handle space separated event names.
  if eventSplitter.test name
    names = name.split eventSplitter
    for i in [0...names.length]
      obj[action].apply obj, [names[i]].concat(rest)
    return false
  true

# A difficult-to-believe, but optimized internal dispatch function for
# triggering events. Tries to keep the usual cases speedy (most internal
# Backbone events have 3 arguments).
triggerEvents = (events, args) ->
  i = -1
  l = events.length
  a1 = args[0]
  a2 = args[1]
  a3 = args[2]
  switch args.length
    when 0
      while ++i < l
        ev = events[i]
        ev.callback.call ev.ctx
    when 1
      while ++i < l
        ev = events[i]
        ev.callback.call ev.ctx, a1
    when 2
      while ++i < l
        ev = events[i]
        ev.callback.call ev.ctx, a1, a2
    when 3
      while ++i < l
        ev = events[i]
        ev.callback.call ev.ctx, a1, a2, a3
    else
      while ++i < l
        ev = events[i]
        ev.callback.apply ev.ctx, args

listenMethods =
  listenTo: 'on'
  listenToOnce: 'once'

# Inversion-of-control versions of `on` and `once`. Tell *this* object to
# listen to an event in another object ... keeping track of what it's
# listening to.
_.each listenMethods, (implementation, method) ->
  Events[method] = (obj, name, callback) ->
    @_listeners ?= {}
    listeners = @_listeners
    obj._listenerId ?= _.uniqueId 'l'
    id = obj._listenerId
    listeners[id] = obj
    callback = this if _.isObject name
    obj[implementation] name, callback, @
    @

# Aliases for backwards compatibility.
Events.bind = Events.on
Events.unbind = Events.off

# Allow the `Backbone` object to serve as a global event bus, for folks who
# want global "pubsub" in a convenient place.
_.extend Backbone, Events


# Backbone.Model
# --------------

# Backbone **Models** are the basic data object in the framework --
# frequently representing a row in a table in a database on your server.
# A discrete chunk of data and a bunch of useful, related methods for
# performing computations and transformations on that data.

# Create a new model with the specified attributes. A client id (`cid`)
# is automatically generated and assigned for you.
class Backbone.Model
  _.extend @::, Events
  
  constructor: (attributes, options = {}) ->
    attrs = attributes or {}
    @cid = _.uniqueId 'c'
    @attributes = {}
    @collection = options.collection if options.collection
    attrs = @parse(attrs, options) or {} if options.parse
    options._attrs = attrs
    defaults = _.result @, 'defaults'
    attrs = _.defaults({}, attrs, defaults) if defaults
    @set attrs, options
    @changed = {}
    @initialize.apply @, arguments  
  # A hash of attributes whose current and previous value differ.
  changed: null
  # The value returned during the last failed validation.
  validationError: null
  # The default name for the JSON `id` attribute is `"id"`. MongoDB and
  # CouchDB users may want to set this to `"_id"`.
  idAttribute: 'id'
  # Initialize is an empty function by default. Override it with your own
  # initialization logic.
  initialize: ->
    # pass
  # Return a copy of the model's `attributes` object.
  toJSON: (options) -> _.clone @attributes
  # Proxy `Backbone.sync` by default -- but override this if you need
  # custom syncing semantics for *this* particular model.
  sync: -> Backbone.sync.apply @, arguments
  # Get the value of an attribute.
  get: (attr) -> @attributes[attr]
  # Get the HTML-escaped value of an attribute.
  escape: (attr) -> _.escape @get(attr)
  # Returns `true` if the attribute contains a value that is not null
  # or undefined.
  has: (attr) -> @get(attr)?
  # Set a hash of model attributes on the object, firing `"change"`. This is
  # the core primitive operation of a model, updating the data and notifying
  # anyone who needs to know about the change in state. The heart of the beast.
  set: (key, val, options = {}) ->
    return @ if !key?
    
    # Handle both `"key", value` and `{key: value}` -style arguments.
    if _.isObject key
      attrs = key
      options = val or {}
    else
      attrs = {}
      attrs[key] = val
    
    # Run validation.
    return false if !@_validate attrs, options
    
    # Extract attributes and options.
    unset = options.unset
    silent = options.silent
    changes = []
    changing = @_changing
    @_changing = true
    
    if !changing
      @_previousAttributes = _.clone @attributes
      @changed = {}
    
    current = @attributes
    prev = @_previousAttributes

    # Check for changes of `id`.
    @id = attrs[@idAttribute] if _.has attrs, @idAttribute

    # For each `set` attribute, update or delete the current value.
    for attr, v of attrs
      val = attrs[attr]
      changes.push(attr) if !_.isEqual current[attr], val
      if !_.isEqual prev[attr], val
        @changed[attr] = val
      else
        delete @changed[attr]
      if unset
        delete current[attr]
      else
        current[attr] = val

    # Trigger all relevant attribute changes.
    if !silent
      @_pending = true if changes.length
      for i in [0...changes.length]
        @trigger 'change:' + changes[i], @, current[changes[i]], options

    # You might be wondering why there's a `while` loop here. Changes can
    # be recursively nested within `"change"` events.
    return @ if changing
    if !silent
      while @_pending
        @_pending = false
        @trigger 'change', @, options
    
    @_pending = false
    @_changing = false
    @
  # Remove an attribute from the model, firing `"change"`. `unset` is a noop
  # if the attribute doesn't exist.
  unset: (attr, options) -> @set attr, undefined, _.extend({}, options, unset: true)
  # Clear all attributes on the model, firing `"change"`.
  clear: (options) ->
    attrs = {}
    for key, v of @attributes
      attrs[key] = undefined
    @set attrs, _.extend({}, options, unset: true)
  # Determine if the model has changed since the last `"change"` event.
  # If you specify an attribute name, determine if that attribute has changed.
  hasChanged: (attr) ->
    return !_.isEmpty @changed if !attr?
    return _.has @changed, attr
  # Return an object containing all the attributes that have changed, or
  # false if there are no changed attributes. Useful for determining what
  # parts of a view need to be updated and/or what attributes need to be
  # persisted to the server. Unset attributes will be set to undefined.
  # You can also pass an attributes object to diff against the model,
  # determining if there *would be* a change.
  changedAttributes: (diff) ->
    if !diff
      return if @hasChanged() then _.clone(@changed) else false
    changed = false
    old = if @_changing then @_previousAttributes else @attributes
    for attr, v of diff
      continue if _.isEqual old[attr], v
      changed = {} if !changed
      changed[attr] = v
    return changed
  # Get the previous value of an attribute, recorded at the time the last
  # `"change"` event was fired.
  previous: (attr) ->
    return null if !attr? or !@_previousAttributes
    return @_previousAttributes[attr]
  # Get all of the attributes of the model at the time of the previous
  # `"change"` event.
  previousAttributes: -> _.clone @_previousAttributes
  # Fetch the model from the server. If the server's representation of the
  # model differs from its current attributes, they will be overridden,
  # triggering a `"change"` event.
  fetch: (options = {}) ->
    options = _.clone options
    options.parse = true if !options.parse?
    model = @
    success = options.success
    options.success = (resp) ->
      return false if !model.set model.parse(resp, options), options
      success(model, resp, options) if success
      model.trigger 'sync', model, resp, options
    wrapError @, options
    @sync 'read', @, options
  # Set a hash of model attributes, and sync the model to the server.
  # If the server returns an attributes hash that differs, the model's
  # state will be `set` again.
  save: (key, val, options) ->
    attributes = @attributes

    # Handle both `"key", value` and `{key: value}` -style arguments.
    if !key? or _.isObject key
      attrs = key
      options = val
    else
      attrs = {}
      attrs[key] = val

    options = _.extend {validate: true}, options

    # If we're not waiting and attributes exist, save acts as
    # `set(attr).save(null, opts)` with validation. Otherwise, check if
    # the model will be valid when the attributes, if any, are set.
    if attrs and !options.wait
      return false if !@set attrs, options
    else
      return false if !@_validate attrs, options

    # Set temporary attributes if `{wait: true}`.
    if attrs and options.wait
      @attributes = _.extend {}, attributes, attrs

    # After a successful server-side save, the client is (optionally)
    # updated with the server-side state.
    options.parse = true if !options.parse?
    model = @
    success = options.success
    options.success = (resp) ->
      # Ensure attributes are restored during synchronous saves.
      model.attributes = attributes
      serverAttrs = model.parse resp, options
      serverAttrs = _.extend(attrs or {}, serverAttrs) if options.wait
      return false if _.isObject(serverAttrs) and !model.set(serverAttrs, options)
      success model, resp, options if success
      model.trigger 'sync', model, resp, options
    wrapError @, options

    method = if @isNew() then 'create' else (if options.patch then 'patch' else 'update')
    options.attrs = attrs if method == 'patch'
    xhr = @sync method, @, options

    # Restore attributes.
    @attributes = attributes if attrs and options.wait

    return xhr

  # Destroy this model on the server if it was already persisted.
  # Optimistically removes the model from its collection, if it has one.
  # If `wait: true` is passed, waits for the server to respond before removal.
  destroy: (options = {}) ->
    options = _.clone options
    model = @
    success = options.success

    destroy = ->
      model.trigger 'destroy', model, model.collection, options

    options.success = (resp) ->
      destroy() if options.wait or model.isNew()
      success(model, resp, options) if success
      model.trigger('sync', model, resp, options) if !model.isNew()

    if @isNew()
      options.success()
      return false
    wrapError @, options

    xhr = @sync 'delete', @, options
    destroy() if !options.wait
    return xhr

  # Default URL for the model's representation on the server -- if you're
  # using Backbone's restful methods, override this to change the endpoint
  # that will be called.
  url: ->
    base = _.result(@, 'urlRoot') or _.result(@collection, 'url') or urlError()
    return base if @isNew()
    base + (if base.charAt(base.length - 1) == '/' then '' else '/') + encodeURIComponent @id

  # **parse** converts a response into the hash of attributes to be `set` on
  # the model. The default implementation is just to pass the response along.
  parse: (resp, options) -> resp

  # Create a new model with identical attributes to this one.
  clone: -> new @constructor @attributes

  # A model is new if it has never been saved to the server, and lacks an id.
  isNew: -> !@id?

  # Check if the model is currently in a valid state.
  isValid: (options) -> @_validate {}, _.extend(options or {}, validate: true)

  # Run validation against the next complete set of model attributes,
  # returning `true` if all is well. Otherwise, fire an `"invalid"` event.
  _validate: (attrs, options = {}) ->
    return true if !options.validate or !@validate
    attrs = _.extend {}, @attributes, attrs
    @validationError = @validate(attrs, options) or null
    error = @validationError
    return true if !error
    @trigger 'invalid', @, error, _.extend(options or {}, validationError: error)
    false

Model = Backbone.Model

# Underscore methods that we want to implement on the Model.
modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit']

# Mix in each Underscore method as a proxy to `Model#attributes`.
_.each modelMethods, (method) ->
  Model.prototype[method] = ->
    args = slice.call arguments
    args.unshift @attributes
    _[method].apply _, args


# Backbone.Collection
# -------------------

# If models tend to represent a single row of data, a Backbone Collection is
# more analagous to a table full of data ... or a small slice or page of that
# table, or a collection of rows that belong together for a particular reason
# -- all of the messages in this particular folder, all of the documents
# belonging to this particular author, and so on. Collections maintain
# indexes of their models, both in order, and for lookup by `id`.

# Create a new **Collection**, perhaps to contain a specific type of `model`.
# If a `comparator` is specified, the Collection will maintain
# its models in sort order, as they're added and removed.

# Default options for `Collection#set`.
setOptions =
  add: true
  remove: true
  merge: true
addOptions =
  add: true
  merge: false
  remove: false

class Backbone.Collection
  _.extend @::, Events
  
  # The default model for a collection is just a **Backbone.Model**.
  # This should be overridden in most cases.
  model: Model
  
  constructor: (models, options) ->
    options or (options = {})
    @model = options.model if options.model
    @comparator = options.comparator if !_.isUndefined options.comparator
    @_reset()
    @initialize.apply @, arguments
    @reset(models, _.extend({silent: true}, options)) if models
  
  # Initialize is an empty function by default. Override it with your own
  # initialization logic.
  initialize: ->
    # pass
  
  # The JSON representation of a Collection is an array of the
  # models' attributes.
  toJSON: (options) -> @map (model) -> model.toJSON options

  # Proxy `Backbone.sync` by default.
  sync: -> Backbone.sync.apply @, arguments

  # Add a model, or list of models to the set.
  add: (models, options = {}) -> @set models, _.defaults(options, addOptions)
  
  # Remove a model, or a list of models from the set.
  remove: (models, options = {}) ->
    models = if _.isArray(models) then models.slice() else [models]
    for i in [0...models.length]
      model = @get models[i]
      continue if !model
      delete @_byId[model.id]
      delete @_byId[model.cid]
      index = @indexOf model
      @models.splice index, 1
      @length--
      if !options.silent
        options.index = index
        model.trigger 'remove', model, @, options
      @_removeReference model
    @

  # Update a collection by `set`-ing a new list of models, adding new ones,
  # removing models that are no longer present, and merging models that
  # already exist in the collection, as necessary. Similar to **Model#set**,
  # the core operation for updating the data contained by the collection.
  set: (models, options = {}) ->
    options = _.defaults options, setOptions
    models = @parse(models, options) if options.parse
    if !_.isArray models
      models = if models then [models] else []
    at = options.at
    sortable = @comparator and !at? and options.sort != false
    sortAttr = if _.isString(@comparator) then @comparator else null
    toAdd = []
    toRemove = []
    modelMap = {}
    add = options.add
    merge = options.merge
    remove = options.remove
    order = if !sortable and add and remove then [] else false

    # Turn bare objects into model references, and prevent invalid models
    # from being added.
    for i in [0...models.length]
      attrs = models[i]
      model = @_prepareModel attrs, options
      continue if !model

      # If a duplicate is found, prevent it from being added and
      # optionally merge it into the existing model.
      existing = @get model
      if existing
        modelMap[existing.cid] = true if remove
        if merge
          attrs = if attrs == model then model.attributes else options._attrs
          existing.set attrs, options
          sort = true if sortable and !sort and existing.hasChanged sortAttr
      # This is a new model, push it to the `toAdd` list.
      else if add
        toAdd.push model
        # Listen to added models' events, and index models for lookup by
        # `id` and by `cid`.
        model.on 'all', @_onModelEvent, @
        @_byId[model.cid] = model
        @_byId[model.id] = model if model.id?
      
      order.push(existing or model) if order

    # Remove nonexistent models if appropriate.
    if remove
      for i in [0...@length]
        model = @models[i]
        toRemove.push(model) if !modelMap[model.cid]
      @remove(toRemove, options) if toRemove.length

    # See if sorting is needed, update `length` and splice in new models.
    if toAdd.length or (order and order.length)
      sort = true if sortable
      @length += toAdd.length
      if at?
        splice.apply @models, [at, 0].concat(toAdd)
      else
        @models.length = 0 if order
        push.apply @models, (order or toAdd)

    # Silently sort the collection if appropriate.
    @sort(silent: true) if sort

    return @ if options.silent

    # Trigger `add` events.
    for i in [0...toAdd.length]
      model = toAdd[i]
      model.trigger 'add', model, @, options

    # Trigger `sort` if the collection was sorted.
    @trigger('sort', @, options) if sort or (order and order.length)
    @
    
  # When you have more items than you want to add or remove individually,
  # you can reset the entire set with a new list of models, without firing
  # any granular `add` or `remove` events. Fires `reset` when finished.
  # Useful for bulk operations and optimizations.
  reset: (models, options = {}) ->
    for i in [0...@models.length]
      @_removeReference @models[i]
    options.previousModels = @models
    @_reset()
    @add models, _.extend({silent: true}, options)
    @trigger 'reset', @, options if !options.silent
    @

  # Add a model to the end of the collection.
  push: (model, options) ->
    model = @_prepareModel model, options
    @add model, _.extend({at: this.length}, options)
    model

  # Remove a model from the end of the collection.
  pop: (options) ->
    model = @at(@length - 1)
    @remove model, options
    model
  
  # Add a model to the beginning of the collection.
  unshift: (model, options) ->
    model = @_prepareModel model, options
    @add model, _.extend({at: 0}, options)
    model

  # Remove a model from the beginning of the collection.
  shift: (options) ->
    model = @at 0
    @remove model, options
    model

  # Slice out a sub-array of models from the collection.
  slice: -> slice.apply @models, arguments
  
  # Get a model from the set by id.
  get: (obj) ->
    return undefined if !obj?
    @_byId[if obj.id? then obj.id else obj.cid or obj]

  # Get the model at the given index.
  at: (index) -> @models[index]
  
  # Return models with matching attributes. Useful for simple cases of
  # `filter`.
  where: (attrs, first) ->
    if _.isEmpty attrs
      return if first then undefined else []
    @[if first then 'find' else 'filter']((model) ->
      for key, v of attrs
        return false if v != model.get(key)
      true
    )

  # Return the first model with matching attributes. Useful for simple cases
  # of `find`.
  findWhere: (attrs) -> @where attrs, true
  
  # Force the collection to re-sort itself. You don't need to call this under
  # normal circumstances, as the set will maintain sort order as each item
  # is added.
  sort: (options = {}) ->
    throw new Error('Cannot sort a set without a comparator') if !@comparator
    # Run sort based on type of `comparator`.
    if _.isString(@comparator) or @comparator.length == 1
      @models = @sortBy @comparator, @
    else
      @models.sort _.bind(@comparator, @)
    @trigger('sort', @, options) if !options.silent
    @
  
  # Figure out the smallest index at which a model should be inserted so as
  # to maintain order.
  sortedIndex: (model, value, context) ->
    value = value or @comparator
    iterator = if _.isFunction(value) then value else ((model) -> model.get value)
    _.sortedIndex @models, model, iterator, context

  # Pluck an attribute from each model in the collection.
  pluck: (attr) -> _.invoke @models, 'get', attr

  # Fetch the default set of models for this collection, resetting the
  # collection when they arrive. If `reset: true` is passed, the response
  # data will be passed through the `reset` method instead of `set`.
  fetch: (options = {}) ->
    options = _.clone options
    options.parse = true if !options.parse?
    success = options.success
    collection = @
    options.success = (resp) ->
      method = if options.reset then 'reset' else 'set'
      collection[method] resp, options
      success(collection, resp, options) if success
      collection.trigger 'sync', collection, resp, options
    wrapError @, options
    @sync 'read', @, options
    
  # Create a new instance of a model in this collection. Add the model to the
  # collection immediately, unless `wait: true` is passed, in which case we
  # wait for the server to agree.
  create: (model, options = {}) ->
    options = _.clone options
    model = @_prepareModel model, options
    return false if !model
    @add(model, options) if !options.wait
    collection = @
    success = options.success
    options.success = (resp) ->
      collection.add(model, options) if options.wait
      success(model, resp, options) if success
    model.save null, options
    model
  
  # **parse** converts a response into a list of models to be added to the
  # collection. The default implementation is just to pass it through.
  parse: (resp, options) -> resp

  # Create a new collection with an identical list of models as this one.
  clone: -> new @constructor @models
  
  # Private method to reset all internal state. Called when the collection
  # is first initialized or reset.
  _reset: ->
    @length = 0
    @models = []
    @_byId  = {}
  
  # Prepare a hash of attributes (or other model) to be added to this
  # collection.
  _prepareModel: (attrs, options = {}) ->
    if attrs instanceof Model
      attrs.collection = @ if !attrs.collection
      return attrs
    options.collection = @
    model = new @model attrs, options
    if !model._validate attrs, options
      @trigger 'invalid', @, attrs, options
      return false
    model
    
  # Internal method to sever a model's ties to a collection.
  _removeReference: (model) ->
    delete model.collection if @ == model.collection
    model.off 'all', @_onModelEvent, @

  # Internal method called every time a model in the set fires an event.
  # Sets need to update their indexes when models change ids. All other
  # events simply proxy through. "add" and "remove" events that originate
  # in other collections are ignored.
  _onModelEvent: (event, model, collection, options) ->
    return if (event == 'add' or event == 'remove') and collection != @
    @remove model, options if event == 'destroy'
    if model and event == "change:#{model.idAttribute}"
      delete @_byId[model.previous(model.idAttribute)]
      @_byId[model.id] = model if model.id?
    @trigger.apply @, arguments

Collection = Backbone.Collection

# Underscore methods that we want to implement on the Collection.
# 90% of the core usefulness of Backbone Collections is actually implemented
# right here:
methods = [
  'forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
  'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
  'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
  'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
  'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
  'isEmpty', 'chain'
]

# Mix in each Underscore method as a proxy to `Collection#models`.
_.each methods, (method) ->
  Collection::[method] = ->
    args = slice.call arguments
    args.unshift @models
    _[method].apply _, args

# Underscore methods that take a property name as an argument.
attributeMethods = ['groupBy', 'countBy', 'sortBy']

# Use attributes instead of properties.
_.each attributeMethods, (method) ->
  Collection::[method] = (value, context) ->
    iterator = if _.isFunction(value) then value else ((model) -> model.get value)
    _[method] @models, iterator, context
  

# Backbone.View
# -------------

# Backbone Views are almost more convention than they are actual code. A View
# is simply a JavaScript object that represents a logical chunk of UI in the
# DOM. This might be a single item, an entire list, a sidebar or panel, or
# even the surrounding frame which wraps your whole app. Defining a chunk of
# UI as a **View** allows you to define your DOM events declaratively, without
# having to worry about render order ... and makes it easy for the view to
# react to specific changes in the state of your models.

# Options with special meaning *(e.g. model, collection, id, className)* are
# attached directly to the view.  See `viewOptions` for an exhaustive
# list.

# Creating a Backbone.View creates its initial element outside of the DOM,
# if an existing element is not provided...

# Cached regex to split keys for `delegate`.
delegateEventSplitter = /^(\S+)\s*(.*)$/

# List of view options to be merged as properties.
viewOptions = [
  'model'
  'collection'
  'el'
  'id'
  'attributes'
  'className'
  'tagName'
  'events'
]

class Backbone.View
  _.extend @::, Events
  
  # The default `tagName` of a View's element is `"div"`.
  tagName: 'div'
  
  constructor: (options = {}) ->
    @cid = _.uniqueId 'view'
    _.extend @, _.pick(options, viewOptions)
    @_ensureElement()
    @initialize.apply @, arguments
    @delegateEvents()

  # jQuery delegate for element lookup, scoped to DOM elements within the
  # current view. This should be prefered to global lookups where possible.
  $: (selector) -> @$el.find selector

  # Initialize is an empty function by default. Override it with your own
  # initialization logic.
  initialize: ->
    # pass

  # **render** is the core function that your view should override, in order
  # to populate its element (`this.el`), with the appropriate HTML. The
  # convention is for **render** to always return `this`.
  render: -> @
  
  # Remove this view by taking the element out of the DOM, and removing any
  # applicable Backbone.Events listeners.
  remove: ->
    @$el.remove()
    @stopListening()
    @

  # Change the view's element (`this.el` property), including event
  # re-delegation.
  setElement: (element, delegate) ->
    @undelegateEvents() if @$el
    @$el = if element instanceof Backbone.$ then element else Backbone.$(element)
    @el = @$el[0]
    @delegateEvents() if delegate != false
    @
    
  # Set callbacks, where `this.events` is a hash of
  #
  # *{"event selector": "callback"}*
  #
  #     {
  #       'mousedown .title':  'edit',
  #       'click .button':     'save'
  #       'click .open':       function(e) { ... }
  #     }
  #
  # pairs. Callbacks will be bound to the view, with `this` set properly.
  # Uses event delegation for efficiency.
  # Omitting the selector binds the event to `this.el`.
  # This only works for delegate-able events: not `focus`, `blur`, and
  # not `change`, `submit`, and `reset` in Internet Explorer.
  delegateEvents: (events) ->
    events = events or _.result @, 'events'
    return @ if !events
    @undelegateEvents()
    for key, method of events
      method = @[events[key]] if !_.isFunction method
      continue if !method
      match = key.match delegateEventSplitter
      eventName = match[1]
      selector = match[2]
      method = _.bind method, @
      eventName += ".delegateEvents#{@cid}"
      if selector == ''
        @$el.on eventName, method
      else
        @$el.on eventName, selector, method
    @

  # Clears all callbacks previously bound to the view with `delegateEvents`.
  # You usually don't need to use this, but may wish to if you have multiple
  # Backbone views attached to the same DOM element.
  undelegateEvents: ->
    @$el.off '.delegateEvents' + @cid
    @
  
  # Ensure that the View has a DOM element to render into.
  # If `this.el` is a string, pass it through `$()`, take the first
  # matching element, and re-assign it to `el`. Otherwise, create
  # an element from the `id`, `className` and `tagName` properties.
  _ensureElement: ->
    if !@el
      attrs = _.extend {}, _.result(@, 'attributes')
      attrs.id = _.result(@, 'id') if @id
      attrs['class'] = _.result(@, 'className') if @className
      $el = Backbone.$('<' + _.result(@, 'tagName') + '>').attr attrs
      @setElement $el, false
    else
      @setElement _.result(@, 'el'), false

View = Backbone.View


# Backbone.Router
# ---------------

# Routers map faux-URLs to actions, and fire events when routes are
# matched. Creating a new one sets its `routes` hash, if not set statically.

# Cached regular expressions for matching named param parts and splatted
# parts of route strings.
optionalParam = /\((.*?)\)/g
namedParam    = /(\(\?)?:\w+/g
splatParam    = /\*\w+/g
escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g

class Backbone.Router
  _.extend @::, Events
  
  constructor: (options = {}) ->
    @routes = options.routes if options.routes
    @_bindRoutes()
    @initialize.apply @, arguments
  
  # Initialize is an empty function by default. Override it with your own
  # initialization logic.
  initialize: ->
    # pass

  # Manually bind a single named route to a callback. For example:
  #
  #     this.route('search/:query/p:num', 'search', function(query, num) {
  #       ...
  #     });
  #
  route: (route, name, callback) ->
    route = @_routeToRegExp(route) if !_.isRegExp(route)
    if _.isFunction name
      callback = name
      name = ''
    callback = @[name] if !callback
    router = @
    Backbone.history.route route, (fragment) ->
      args = router._extractParameters route, fragment
      callback?.apply router, args
      router.trigger.apply router, ['route:' + name].concat(args)
      router.trigger 'route', name, args
      Backbone.history.trigger 'route', router, name, args
    @

  # Simple proxy to `Backbone.history` to save a fragment into the history.
  navigate: (fragment, options) ->
    Backbone.history.navigate fragment, options
    @

  # Bind all defined routes to `Backbone.history`. We have to reverse the
  # order of the routes here to support behavior where the most general
  # routes can be defined at the bottom of the route map.
  _bindRoutes: ->
    return if !@routes
    @routes = _.result @, 'routes'
    routes = _.keys @routes
    route = routes.pop()
    while route?
      @route route, @routes[route]
      route = routes.pop()

  # Convert a route string into a regular expression, suitable for matching
  # against the current location hash.
  _routeToRegExp: (route) ->
    route = route
      .replace(escapeRegExp, '\\$&')
      .replace(optionalParam, '(?:$1)?')
      .replace(namedParam, (match, optional) -> if optional then match else '([^\/]+)')
      .replace(splatParam, '(.*?)')
    new RegExp "^#{route}$"

  # Given a route, and a URL fragment that it matches, return the array of
  # extracted decoded parameters. Empty or unmatched parameters will be
  # treated as `null` to normalize cross-browser behavior.
  _extractParameters: (route, fragment) ->
    params = route.exec(fragment).slice(1)
    _.map params, (param) -> if param then decodeURIComponent(param) else null

Router = Backbone.Router


# Backbone.History
# ----------------

# Handles cross-browser history management, based on either
# [pushState](http:#diveintohtml5.info/history.html) and real URLs, or
# [onhashchange](https:#developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
# and URL fragments. If the browser supports neither (old IE, natch),
# falls back to polling.

# Cached regex for stripping a leading hash/slash and trailing space.
routeStripper = /^[#\/]|\s+$/g

# Cached regex for stripping leading and trailing slashes.
rootStripper = /^\/+|\/+$/g

# Cached regex for detecting MSIE.
isExplorer = /msie [\w.]+/

# Cached regex for removing a trailing slash.
trailingSlash = /\/$/

class Backbone.History
  _.extend @::, Events
  
  # Has the history handling already been started?
  @started: false
  
  # The default interval to poll for hash changes, if necessary, is
  # twenty times a second.
  interval: 50
  
  constructor: ->
    @handlers = []
    _.bindAll @, 'checkUrl'
    # Ensure that `History` can be used outside of the browser.
    if typeof window != 'undefined'
      @location = window.location
      @history = window.history

  # Gets the true hash value. Cannot use location.hash directly due to bug
  # in Firefox where location.hash will always be decoded.
  getHash: (window) ->
    match = (window or @).location.href.match /#(.*)$/
    if match then match[1] else ''

  # Get the cross-browser normalized URL fragment, either from the URL,
  # the hash, or the override.
  getFragment: (fragment, forcePushState) ->
    if !fragment?
      if @_hasPushState or !@_wantsHashChange or forcePushState
        fragment = @location.pathname
        root = @root.replace trailingSlash, ''
        fragment = fragment.substr(root.length) if !fragment.indexOf root
      else
        fragment = @getHash()
    fragment.replace routeStripper, ''
  
  # Start the hash change handling, returning `true` if the current URL matches
  # an existing route, and `false` otherwise.
  start: (options) ->
    throw new Error("Backbone.history has already been started") if History.started
    History.started = true

    # Figure out the initial configuration. Do we need an iframe?
    # Is pushState desired ... is it available?
    @options = _.extend {}, {root: '/'}, @options, options
    @root = @options.root
    @_wantsHashChange = @options.hashChange != false
    @_wantsPushState = !!@options.pushState
    @_hasPushState = !!(@options.pushState and @history and @history.pushState)
    fragment = @getFragment()
    docMode = document.documentMode
    oldIE = (isExplorer.exec(navigator.userAgent.toLowerCase()) and (!docMode or docMode <= 7))

    # Normalize root to always include a leading and trailing slash.
    @root = ('/' + @root + '/').replace rootStripper, '/'

    if oldIE and @_wantsHashChange
      @iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow
      @navigate fragment

    # Depending on whether we're using pushState or hashes, and whether
    # 'onhashchange' is supported, determine how we check the URL state.
    if @_hasPushState
      Backbone.$(window).on 'popstate', @checkUrl
    else if @_wantsHashChange and ('onhashchange' in window) and !oldIE
      Backbone.$(window).on 'hashchange', @checkUrl
    else if @_wantsHashChange
      @_checkUrlInterval = setInterval @checkUrl, @interval

    # Determine if we need to change the base url, for a pushState link
    # opened by a non-pushState browser.
    @fragment = fragment
    loc = @location
    atRoot = loc.pathname.replace(/[^\/]$/, '$&/') == @root

    # If we've started off with a route from a `pushState`-enabled browser,
    # but we're currently in a browser that doesn't support it...
    if @_wantsHashChange and @_wantsPushState and !@_hasPushState and !atRoot
      @fragment = @getFragment null, true
      @location.replace @root + @location.search + '#' + @fragment
      # Return immediately as browser will do redirect to new url
      return true
    # Or if we've started out with a hash-based route, but we're currently
    # in a browser where it could be `pushState`-based instead...
    else if @_wantsPushState and @_hasPushState and atRoot and loc.hash
      @fragment = @getHash().replace routeStripper, ''
      @history.replaceState {}, document.title, @root + @fragment + loc.search

    @loadUrl() if !@options.silent
  
  # Disable Backbone.history, perhaps temporarily. Not useful in a real app,
  # but possibly useful for unit testing Routers.
  stop: ->
    Backbone.$(window).off('popstate', @checkUrl).off 'hashchange', @checkUrl
    clearInterval @_checkUrlInterval
    History.started = false

  # Add a route to be tested when the fragment changes. Routes added later
  # may override previous routes.
  route: (route, callback) -> @handlers.unshift({route: route, callback: callback})

  # Checks the current URL to see if it has changed, and if it has,
  # calls `loadUrl`, normalizing across the hidden iframe.
  checkUrl: (e) ->
    current = @getFragment()
    if current == @fragment and @iframe
      current = @getFragment @getHash(@iframe)
    return false if current == @fragment
    @navigate(current) if @iframe
    @loadUrl() or @loadUrl @getHash()
  
  # Attempt to load the current URL fragment. If a route succeeds with a
  # match, returns `true`. If no defined routes matches the fragment,
  # returns `false`.
  loadUrl: (fragmentOverride) ->
    @fragment = @getFragment fragmentOverride
    fragment = @fragment
    matched = _.any @handlers, (handler) ->
      if handler.route.test fragment
        handler.callback fragment
        true
    matched

  # Save a fragment into the hash history, or replace the URL state if the
  # 'replace' option is passed. You are responsible for properly URL-encoding
  # the fragment in advance.
  #
  # The options object can contain `trigger: true` if you wish to have the
  # route callback be fired (not usually desirable), or `replace: true`, if
  # you wish to modify the current URL without adding an entry to the history.
  navigate: (fragment, options) ->
    return false if !History.started
    options = {trigger: options} if !options or options == true
    fragment = @getFragment fragment or ''
    return if @fragment == fragment
    @fragment = fragment
    url = @root + fragment

    # If pushState is available, we use it to set the fragment as a real URL.
    if @_hasPushState
      @history[if options.replace then 'replaceState' else 'pushState'] {}, document.title, url
    # If hash changes haven't been explicitly disabled, update the hash
    # fragment to store history.
    else if @_wantsHashChange
      @_updateHash @location, fragment, options.replace
      if @iframe and (fragment != @getFragment(@getHash @iframe))
        # Opening and closing the iframe tricks IE7 and earlier to push a
        # history entry on hash-tag change.  When replace is true, we don't
        # want this.
        @iframe.document.open().close() if !options.replace
        @_updateHash @iframe.location, fragment, options.replace
    # If you've told us that you explicitly don't want fallback hashchange-
    # based history, then `navigate` becomes a page refresh.
    else
      return @location.assign url
    
    @loadUrl fragment if options.trigger

  # Update the hash location, either replacing the current entry, or adding
  # a new one to the browser history.
  _updateHash: (location, fragment, replace) ->
    if replace
      href = location.href.replace /(javascript:|#).*$/, ''
      location.replace href + '#' + fragment
    else
      # Some browsers require that `hash` contains a leading #.
      location.hash = '#' + fragment

History = Backbone.History

# Create the default Backbone.history.
Backbone.history = new History


# Helpers
# -------

# Helper function to correctly set up the prototype chain, for subclasses.
# Similar to `goog.inherits`, but uses a hash of prototype properties and
# class properties to be extended.
extend = (protoProps, staticProps) ->
  parent = @
  # The constructor function for the new subclass is either defined by you
  # (the "constructor" property in your `extend` definition), or defaulted
  # by us to simply call the parent's constructor.
  if protoProps and _.has protoProps, 'constructor'
    child = protoProps.constructor
  else
    child = -> parent.apply @, arguments
  # Add static properties to the constructor function, if supplied.
  _.extend child, parent, staticProps
  # Set the prototype chain to inherit from `parent`, without calling
  # `parent`'s constructor function.
  class Surrogate
    constructor: ->
      @constructor = child
  Surrogate.prototype = parent.prototype
  child.prototype = new Surrogate
  # Add prototype properties (instance properties) to the subclass,
  # if supplied.
  _.extend(child.prototype, protoProps) if protoProps
  # Set a convenience property in case the parent's prototype is needed
  # later.
  child.__super__ = parent.prototype
  child

# Set up inheritance for the model, collection, router, view and history.
Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend

# Throw an error when a URL is needed, and none is supplied.
urlError = ->
  throw new Error 'A "url" property or function must be specified'

# Wrap an optional error callback with a fallback error event.
wrapError = (model, options) ->
  error = options.error
  options.error = (resp) ->
    error(model, resp, options) if error
    model.trigger 'error', model, resp, options
