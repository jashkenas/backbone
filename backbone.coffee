#     Backbone.js 0.9.10

#     (c) 2010-2013 Jeremy Ashkenas, DocumentCloud Inc.
#     Backbone may be freely distributed under the MIT license.
#     For all details and documentation:
#     http://backbonejs.org

do (root = this) ->

  # Initial Setup
  # -------------

  # Save the previous value of the `Backbone` variable, so that it can be
  # restored later on, if `noConflict` is used.
  previousBackbone = root.Backbone

  # Create a local reference to array methods.
  push = Array::push
  slice = Array::slice
  splice = Array::splice

  # The top-level namespace. All public Backbone classes and modules will
  # be attached to this. Exported for both CommonJS and the browser.
  Backbone = if exports? then exports else root.Backbone = {}

  # Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '0.9.10'

  # Require Underscore, if we're on the server, and it's not already present.
  _ = root._ or require? 'underscore'

  # For Backbone's purposes, jQuery, Zepto, or Ender owns the `$` variable.
  Backbone.$ = root.jQuery or root.Zepto or root.ender

  # Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  # to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = ->
    root.Backbone = previousBackbone
    @

  # Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  # will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  # set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false

  # Turn on `emulateJSON` to support legacy servers that can't deal with direct
  # `application/json` requests ... will encode the body as
  # `application/x-www-form-urlencoded` instead and will send the model in a
  # form param named `model`.
  Backbone.emulateJSON = false

  # Backbone.Events
  # ---------------

  # Regular expression used to split event strings.
  eventSplitter = /\s+/

  # Implement fancy features of the Events API such as multiple event
  # names `"change blur"` and jQuery-style event maps `{change: action}`
  # in terms of the existing API.
  eventsApi = (obj, action, name, rest) ->
    return true unless name

    # Handle event maps.
    if typeof name is 'object'
      for key, value of name
        obj[action].apply obj, [key, value].concat(rest)
      false

    # Handle space separated event names.
    else if eventSplitter.test name
      for name in name.split eventSplitter
        obj[action].apply obj, [name].concat(rest)
      false
    else
      true

  # Optimized internal dispatch function for triggering events. Tries to
  # keep the usual cases speedy (most Backbone events have 3 arguments).
  triggerEvents = (events, args) ->
    [a1, a2, a3] = args
    switch args.length
      when 0 then ev.callback.call ev.ctx for ev in events
      when 1 then ev.callback.call ev.ctx, a1 for ev in events
      when 2 then ev.callback.call ev.ctx, a1, a2 for ev in events
      when 3 then ev.callback.call ev.ctx, a1, a2, a3 for ev in events
      else ev.callback.apply ev.ctx, args for ev in events

  # A module that can be mixed in to *any object* in order to provide it with
  # custom events. You may bind with `on` or remove with `off` callback
  # functions to an event `trigger`-ing an event fires all callbacks in
  # succession.
  #
  #     var object = {}
  #     _.extend(object, Backbone.Events)
  #     object.on('expand', function(){ alert('expanded') })
  #     object.trigger('expand')
  #
  Events = Backbone.Events =

    # Bind one or more space separated events, or an events map,
    # to a `callback` function. Passing `"all"` will bind the callback to
    # all events fired.
    on: (name, callback, context) ->
      return @ unless eventsApi(@, 'on', name, [callback, context]) and callback
      @_events ||= {}
      events = @_events[name] ||= []
      events.push callback: callback, context: context, ctx: context or @
      @

    # Bind events to only be triggered a single time. After the first time
    # the callback is invoked, it will be removed.
    once: (name, callback, context) ->
      return @ unless eventsApi(@, 'once', name, [callback, context]) and callback
      self = @
      once = _.once ->
        self.off name, once
        callback.apply @, arguments
      once._callback = callback
      @on name, once, context

    # Remove one or many callbacks. If `context` is null, removes all
    # callbacks with that function. If `callback` is null, removes all
    # callbacks for the event. If `name` is null, removes all bound
    # callbacks for all events.
    off: (name, callback, context) ->
      return @ unless @_events and eventsApi @, 'off', name, [callback, context]
      unless name or callback or context
        @_events = {}
        return @

      names = if name then [name] else _.keys @_events
      for name in names
        if events = @_events[name]
          @_events[name] = retain = []
          if callback or context
            for ev in events
              if ((callback and callback isnt ev.callback and
                                callback isnt ev.callback._callback) or
                  (context and context isnt ev.context))
                retain.push ev
          delete @_events[name] unless retain.length
      @

    # Trigger one or many events, firing all bound callbacks. Callbacks are
    # passed the same arguments as `trigger` is, apart from the event name
    # (unless you're listening on `"all"`, which will cause your callback to
    # receive the true name of the event as the first argument).
    trigger: (name) ->
      return @ unless @_events
      args = slice.call arguments, 1
      return @ unless eventsApi @, 'trigger', name, args
      events = @_events[name]
      allEvents = @_events.all
      triggerEvents events, args if events
      triggerEvents allEvents, arguments if allEvents
      @

    # Tell this object to stop listening to either specific events ... or
    # to every object it's currently listening to.
    stopListening: (obj, name, callback) ->
      listeners = @_listeners
      return @ unless listeners
      deleteListener = !name and !callback
      callback = @ if typeof name is 'object'
      (listeners = {})[obj._listenerId] = obj if obj
      for id of listeners
        listeners[id].off name, callback, @
        delete @_listeners[id] if deleteListener
      @

  listenMethods = listenTo: 'on', listenToOnce: 'once'

  # An inversion-of-control versions of `on` and `once`. Tell *this* object to
  # listen to an event in another object ... keeping track of what it's
  # listening to.
  _.each listenMethods, (implementation, method) ->
    Events[method] = (obj, name, callback) ->
      listeners = @_listeners ||= {}
      id = obj._listenerId ||= _.uniqueId 'l'
      listeners[id] = obj
      callback = @ if typeof name is 'object'
      obj[implementation] name, callback, @
      @

  # Aliases for backwards compatibility.
  Events.bind   = Events.on
  Events.unbind = Events.off

  # Allow the `Backbone` object to serve as a global event bus, for folks who
  # want global "pubsub" in a convenient place.
  _.extend Backbone, Events

  # Backbone.Model
  # --------------

  # Create a new model, with defined attributes. A client id (`cid`)
  # is automatically generated and assigned for you.
  Model = class Backbone.Model

    constructor: (attributes, options) ->
      attrs = attributes or {}
      @cid = _.uniqueId 'c'
      @attributes = {}
      @collection = options.collection if options?.collection
      attrs = @parse(attrs, options) or {} if options?.parse
      if defaults = _.result @, 'defaults'
        attrs = _.defaults {}, attrs, defaults
      @set attrs, options
      @changed = {}
      @initialize.apply @, arguments

    _.extend @::, Events

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

    # Return a copy of the model's `attributes` object.
    toJSON: (options) ->
      _.clone @attributes

    # Proxy `Backbone.sync` by default.
    sync: ->
      Backbone.sync.apply @, arguments

    # Get the value of an attribute.
    get: (attr) ->
      @attributes[attr]

    # Get the HTML-escaped value of an attribute.
    escape: (attr) ->
      _.escape @get(attr)

    # Returns `true` if the attribute contains a value that is not null
    # or undefined.
    has: (attr) ->
      @get(attr)?

    # Set a hash of model attributes on the object, firing `"change"` unless
    # you choose to silence it.
    set: (key, val, options) ->
      return @ unless key?

      # Handle both `"key", value` and `{key: value}` -style arguments.
      if typeof key is 'object'
        [attrs, options] = [key, val]
      else
        (attrs = {})[key] = val

      options ||= {}

      # Run validation.
      return false unless @_validate attrs, options

      # Extract attributes and options.
      unset      = options.unset
      silent     = options.silent
      changes    = []
      changing   = @_changing
      @_changing = true

      unless changing
        @_previousAttributes = _.clone @attributes
        @changed = {}
      [current, prev] = [@attributes, @_previousAttributes]

      # Check for changes of `id`.
      @id = attrs[@idAttribute] if _.has attrs, @idAttribute

      # For each `set` attribute, update or delete the current value.
      for attr, val of attrs
        changes.push attr unless _.isEqual current[attr], val
        if _.isEqual prev[attr], val then delete @changed[attr] else @changed[attr] = val
        if unset then delete current[attr] else current[attr] = val

      # Trigger all relevant attribute changes.
      unless silent
        @_pending = true if changes.length
        for change in changes
          @trigger "change:#{change}", @, current[change], options

      return @ if changing
      unless silent
        while @_pending
          @_pending = false
          @trigger 'change', @, options

      @_pending  = false
      @_changing = false
      @

    # Remove an attribute from the model, firing `"change"` unless you choose
    # to silence it. `unset` is a noop if the attribute doesn't exist.
    unset: (attr, options) ->
      @set attr, undefined, _.extend({}, options, unset: true)

    # Clear all attributes on the model, firing `"change"` unless you choose
    # to silence it.
    clear: (options) ->
      attrs = {}
      attrs[key] = undefined for key of @attributes
      @set attrs, _.extend({}, options, unset: true)

    # Determine if the model has changed since the last `"change"` event.
    # If you specify an attribute name, determine if that attribute has changed.
    hasChanged: (attr) ->
      if attr? then _.has @changed, attr else !_.isEmpty @changed

    # Return an object containing all the attributes that have changed, or
    # false if there are no changed attributes. Useful for determining what
    # parts of a view need to be updated and/or what attributes need to be
    # persisted to the server. Unset attributes will be set to undefined.
    # You can also pass an attributes object to diff against the model,
    # determining if there *would be* a change.
    changedAttributes: (diff) ->
      unless diff
        return if @hasChanged() then _.clone @changed else false
      changed = false
      old = if @_changing then @_previousAttributes else @attributes
      for attr, val of diff
        continue if _.isEqual old[attr], val
        (changed ||= {})[attr] = val
      changed

    # Get the previous value of an attribute, recorded at the time the last
    # `"change"` event was fired.
    previous: (attr) ->
      return null unless attr? and @_previousAttributes
      @_previousAttributes[attr]

    # Get all of the attributes of the model at the time of the previous
    # `"change"` event.
    previousAttributes: ->
      _.clone @_previousAttributes

    # Fetch the model from the server. If the server's representation of the
    # model differs from its current attributes, they will be overriden,
    # triggering a `"change"` event.
    fetch: (options) ->
      options = if options? then _.clone options else {}
      options.parse = true if options.parse is undefined
      success = options.success
      options.success = (resp) =>
        return false unless @set @parse(resp, options), options
        success? @, resp, options
        @trigger 'sync', @, resp, options
      wrapError @, options
      @sync 'read', @, options

    # Set a hash of model attributes, and sync the model to the server.
    # If the server returns an attributes hash that differs, the model's
    # state will be `set` again.
    save: (key, val, options = {}) ->
      attributes = @attributes

      # Handle both `"key", value` and `{key: value}` -style arguments.
      if !key? or typeof key is 'object'
        [attrs, options] = [key, val]
      else
        (attrs = {})[key] = val

      # If we're not waiting and attributes exist, save acts as `set(attr).save(null, opts)`.
      if attrs and !options?.wait and !@set attrs, options
        return false

      options = _.extend {validate: true}, options

      # Do not persist invalid models.
      return false unless @_validate attrs, options

      # Set temporary attributes if `{wait: true}`.
      if attrs and options.wait
        @attributes = _.extend {}, attributes, attrs

      # After a successful server-side save, the client is (optionally)
      # updated with the server-side state.
      options.parse = true if options.parse is undefined
      success = options.success
      options.success = (resp) =>
        # Ensure attributes are restored during synchronous saves.
        @attributes = attributes
        serverAttrs = @parse resp, options
        serverAttrs = _.extend(attrs || {}, serverAttrs) if options.wait
        if _.isObject(serverAttrs) and !@set(serverAttrs, options)
          return false
        success? @, resp, options
        @trigger 'sync', @, resp, options

      wrapError @, options

      method = if @isNew() then 'create' else if options.patch then 'patch' else 'update'
      options.attrs = attrs if method is 'patch'
      xhr = @sync method, @, options

      # Restore attributes.
      @attributes = attributes if attrs and options.wait

      xhr

    # Destroy this model on the server if it was already persisted.
    # Optimistically removes the model from its collection, if it has one.
    # If `wait: true` is passed, waits for the server to respond before removal.
    destroy: (options) ->
      options = if options? then _.clone options else {}
      success = options.success
      destroy = => @trigger 'destroy', @, @collection, options

      options.success = (resp) =>
        destroy() if options.wait or @isNew()
        success? @, resp, options
        @trigger 'sync', @, resp, options unless @isNew()

      if @isNew()
        options.success()
        return false
      wrapError @, options

      xhr = @sync 'delete', @, options
      destroy() unless options.wait
      xhr

    # Default URL for the model's representation on the server -- if you're
    # using Backbone's restful methods, override this to change the endpoint
    # that will be called.
    url: ->
      base = _.result(@, 'urlRoot') or _.result(@collection, 'url') or urlError()
      return base if @isNew()
      base + (if base.charAt(base.length - 1) is '/' then '' else '/') + encodeURIComponent(@id)

    # **parse** converts a response into the hash of attributes to be `set` on
    # the model. The default implementation is just to pass the response along.
    parse: (resp, options) ->
      resp

    # Create a new model with identical attributes to this one.
    clone: ->
      new @constructor @attributes

    # A model is new if it has never been saved to the server, and lacks an id.
    isNew: ->
      !@id?

    # Check if the model is currently in a valid state.
    isValid: (options) ->
      !@validate? @attributes, options

    # Run validation against the next complete set of model attributes,
    # returning `true` if all is well. Otherwise, fire an
    # `"invalid"` event and call the invalid callback, if specified.
    _validate: (attrs, options) ->
      return true unless options?.validate and @validate?
      attrs = _.extend {}, @attributes, attrs
      error = @validationError = @validate(attrs, options) || null
      return true unless error
      @trigger 'invalid', @, error, (options || {})
      false

  # Backbone.Collection
  # -------------------

  # Provides a standard collection class for our sets of models, ordered
  # or unordered. If a `comparator` is specified, the Collection will maintain
  # its models in sort order, as they're added and removed.
  Collection = class Backbone.Collection

    constructor: (models, options = {}) ->
      @model = options.model if options.model
      @comparator = options.comparator unless options.comparator is undefined
      @_reset()
      @initialize.apply @, arguments
      @reset models, _.extend({silent: true}, options) if models

    _.extend @::, Events

    # The default model for a collection is just a **Backbone.Model**.
    # This should be overridden in most cases.
    model: Model

    # Initialize is an empty function by default. Override it with your own
    # initialization logic.
    initialize: ->

    # The JSON representation of a Collection is an array of the
    # models' attributes.
    toJSON: (options) ->
      @map (model) -> model.toJSON options

    # Proxy `Backbone.sync` by default.
    sync: ->
      Backbone.sync.apply @, arguments

    # Add a model, or list of models to the set.
    add: (models, options = {}) ->
      models = if _.isArray models then models.slice() else [models]
      add = []
      at = options.at
      sort = @comparator and !at? and options.sort isnt false
      sortAttr = if _.isString @comparator then @comparator else null
      modelMap = {}

      # Turn bare objects into model references, and prevent invalid models
      # from being added.
      for attrs in models
        continue unless model = @_prepareModel attrs, options

        # If a duplicate is found, prevent it from being added and
        # optionally merge it into the existing model.
        if existing = @get model
          modelMap[existing.cid] = true
          if options.merge
            existing.set (if attrs is model then model.attributes else attrs), options
            doSort = true if sort and !doSort and existing.hasChanged sortAttr
          continue

        continue if options.add is false

        # This is a new model, push it to the `add` list.
        add.push model

        # Listen to added models' events, and index models for lookup by
        # `id` and by `cid`.
        model.on 'all', @_onModelEvent, @
        @_byId[model.cid] = model
        @_byId[model.id] = model if model?

      if options.remove
        remove = []
        for model in @models
          remove.push model unless modelMap[model.cid]
        @remove remove, options if remove.length

      # See if sorting is needed, update `length` and splice in new models.
      if add.length
        doSort = true if sort
        @length += add.length
        if at?
          splice.apply @models, [at, 0].concat(add)
        else
          push.apply @models, add

      # Silently sort the collection if appropriate.
      @sort silent: true if doSort

      return @ if options.silent

      # Trigger `add` events.
      model.trigger 'add', model, @, options for model in add

      # Trigger `sort` if the collection was sorted.
      @trigger 'sort', @, options if doSort

      @

    # Remove a model, or a list of models from the set.
    remove: (models, options = {}) ->
      models = if _.isArray models then models.slice() else [models]
      for model in models
        continue unless model = @get model
        delete @_byId[model.id]
        delete @_byId[model.cid]
        index = @indexOf model
        @models.splice index, 1
        @length--
        unless options.silent
          options.index = index
          model.trigger 'remove', model, @, options
        @_removeReference model
      @

    # Add a model to the end of the collection.
    push: (model, options) ->
      model = @_prepareModel model, options
      @add model, _.extend({at: @length}, options)
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
    slice: (begin, end) ->
      @models.slice begin, end

    # Get a model from the set by id.
    get: (obj) ->
      @_byId[if obj.id? then obj.id else obj.cid or obj] if obj?

    # Get the model at the given index.
    at: (index) ->
      @models[index]

    # Return models with matching attributes. Useful for simple cases of
    # `filter`.
    where: (attrs, first) ->
      if _.isEmpty attrs
        return if first then undefined else []
      @[if first then 'find' else 'filter'] (model) ->
        for key of attrs
          return false unless attrs[key] is model.get key
        true

    # Return the first model with matching attributes. Useful for simple cases
    # of `find`.
    findWhere: (attrs) ->
      @where attrs, true

    # Force the collection to re-sort itself. You don't need to call this under
    # normal circumstances, as the set will maintain sort order as each item
    # is added.
    sort: (options = {}) ->
      unless @comparator
        throw new Error 'Cannot sort a set without a comparator'

      # Run sort based on type of `comparator`.
      if _.isString(@comparator) or @comparator.length is 1
        @models = @sortBy(@comparator, @)
      else
        @models.sort _.bind(@comparator, @)

      @trigger 'sort', @, options unless options.silent
      @

    # Pluck an attribute from each model in the collection.
    pluck: (attr) ->
      _.invoke @models, 'get', attr

    # Smartly update a collection with a change set of models, adding,
    # removing, and merging as necessary.
    update: (models, options) ->
      options = _.extend {merge: true, remove: true}, options
      models = @parse models, options if options.parse
      @add models, options
      @

    # When you have more items than you want to add or remove individually,
    # you can reset the entire set with a new list of models, without firing
    # any `add` or `remove` events. Fires `reset` when finished.
    reset: (models, options) ->
      options = if options then _.clone options else {}
      models = @parse models, options if options.parse
      @_removeReference model for model in @models
      options.previousModels = @models
      @_reset()
      @add models, _.extend({silent: true}, options) if models
      @trigger 'reset', @, options unless options.silent
      @

    # Fetch the default set of models for this collection, resetting the
    # collection when they arrive. If `update: true` is passed, the response
    # data will be passed through the `update` method instead of `reset`.
    fetch: (options) ->
      options = if options then _.clone options else {}
      options.parse = true if options.parse is undefined
      success = options.success
      options.success = (resp) =>
        @[if options.update then 'update' else 'reset'] resp, options
        success? @, resp, options
        @trigger 'sync', @, resp, options
      wrapError @, options
      @sync 'read', @, options

    # Create a new instance of a model in this collection. Add the model to the
    # collection immediately, unless `wait: true` is passed, in which case we
    # wait for the server to agree.
    create: (model, options) ->
      options = if options then _.clone options else {}
      return false unless model = @_prepareModel(model, options)
      @add model, options unless options.wait
      success = options.success
      options.success = (resp) =>
        @add model, options if options.wait
        success? model, resp, options
      model.save null, options
      model

    # **parse** converts a response into a list of models to be added to the
    # collection. The default implementation is just to pass it through.
    parse: (resp, options) ->
      resp

    # Create a new collection with an identical list of models as this one.
    clone: ->
      new @constructor @models

    # Reset all internal state. Called when the collection is reset.
    _reset: ->
      @length = 0
      @models = []
      @_byId  = {}

    # Prepare a model or hash of attributes to be added to this collection.
    _prepareModel: (attrs, options = {}) ->
      if attrs instanceof Model
        attrs.collection = @ unless attrs.collection
        return attrs

      options.collection = @
      model = new @model attrs, options
      unless model._validate attrs, options
        @trigger 'invalid', @, attrs, options
        return false

      model

    # Internal method to remove a model's ties to a collection.
    _removeReference: (model) ->
      delete model.collection if @ is model.collection
      model.off 'all', @_onModelEvent, @

    # Internal method called every time a model in the set fires an event.
    # Sets need to update their indexes when models change ids. All other
    # events simply proxy through. "add" and "remove" events that originate
    # in other collections are ignored.
    _onModelEvent: (event, model, collection, options) ->
      return if (event is 'add' or event is 'remove') and collection isnt @
      @remove model, options if event is 'destroy'
      if model and event is "change:#{model.idAttribute}"
        delete @_byId[model.previous model.idAttribute]
        @_byId[model.id] = model if model.id?
      @trigger.apply @, arguments

    sortedIndex: (model, value = @comparator, context) ->
      iterator = if _.isFunction value then value else (model) -> model.get value
      _.sortedIndex @models, model, iterator, context

  # Underscore methods that we want to implement on the Collection.
  methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
    'isEmpty', 'chain']

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
      iterator = if _.isFunction value then value else (model) -> model.get value
      _[method] @models, iterator, context

  # Backbone.Router
  # ---------------
  #

  # Cached regular expressions for matching named param parts and splatted
  # parts of route strings.
  optionalParam = /\((.*?)\)/g
  namedParam    = /(\(\?)?:\w+/g
  splatParam    = /\*\w+/g
  escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g

  # Routers map faux-URLs to actions, and fire events when routes are
  # matched. Creating a new one sets its `routes` hash, if not set statically.
  Router = class Backbone.Router

    constructor: (options = {}) ->
      @routes = options.routes if options.routes
      @_bindRoutes()
      @initialize.apply @, arguments

    _.extend @::, Events

    # Initialize is an empty function by default. Override it with your own
    # initialization logic.
    initialize: ->

    # Manually bind a single named route to a callback. For example:
    #
    #     this.route('search/:query/p:num', 'search', function(query, num) {
    #       ...
    #     })
    #
    route: (route, name, callback = @[name]) ->
      route = @_routeToRegExp route unless _.isRegExp route
      Backbone.history.route route, (fragment) =>
        args = @_extractParameters route, fragment
        callback?.apply @, args
        @trigger.apply @, ['route:' + name].concat(args)
        @trigger 'route', name, args
        Backbone.history.trigger 'route', @, name, args
      @

    # Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: (fragment, options) ->
      Backbone.history.navigate fragment, options
      @

    # Bind all defined routes to `Backbone.history`. We have to reverse the
    # order of the routes here to support behavior where the most general
    # routes can be defined at the bottom of the route map.
    _bindRoutes: ->
      return unless @routes
      routes = _.keys @routes
      @route route, @routes[route] while (route = routes.pop())?

    # Convert a route string into a regular expression, suitable for matching
    # against the current location hash.
    _routeToRegExp: (route) ->
      ///
      ^
      #{route
        .replace(escapeRegExp, '\\$&')
        .replace(optionalParam, '(?:$1)?')
        .replace(namedParam, (match, optional) -> if optional then match else '([^\/]+)')
        .replace(splatParam, '(.*?)')}
      $
      ///

    # Given a route, and a URL fragment that it matches, return the array of
    # extracted parameters.
    _extractParameters: (route, fragment) ->
      route.exec(fragment).slice(1)

  # Backbone.History
  # ----------------

  # Cached regex for stripping a leading hash/slash and trailing space.
  routeStripper = /^[#\/]|\s+$/g

  # Cached regex for stripping leading and trailing slashes.
  rootStripper = /^\/+|\/+$/g

  # Cached regex for detecting MSIE.
  isExplorer = /msie [\w.]+/

  # Cached regex for removing a trailing slash.
  trailingSlash = /\/$/

  # Handles cross-browser history management, based on URL fragments. If the
  # browser does not support `onhashchange`, falls back to polling.
  History = class Backbone.History

    # Has the history handling already been started?
    @started = false

    constructor: ->
      @handlers = []
      _.bindAll @, 'checkUrl'

      # Ensure that `History` can be used outside of the browser.
      if window?
        @location = window.location
        @history = window.history

    _.extend @::, Events

    # The default interval to poll for hash changes, if necessary, is
    # twenty times a second.
    interval: 50

    # Gets the true hash value. Cannot use location.hash directly due to bug
    # in Firefox where location.hash will always be decoded.
    getHash: (window) ->
      match = (window || @).location.href.match /#(.*)$/
      if match then match[1] else ''

    # Get the cross-browser normalized URL fragment, either from the URL,
    # the hash, or the override.
    getFragment: (fragment, forcePushState) ->
      unless fragment?
        if @hasPushState or !@_wantsHashChange or forcePushState
          fragment = @location.pathname
          root = @root.replace(trailingSlash, '')
          fragment = fragment.substr root.length unless root in fragment
        else
          fragment = @getHash()
      fragment.replace routeStripper, ''

    # Start the hash change handling, returning `true` if the current URL matches
    # an existing route, and `false` otherwise.
    start: (options) ->
      throw new Error "Backbone.history has already been started" if History.started
      History.started = true

      # Figure out the initial configuration. Do we need an iframe?
      # Is pushState desired ... is it available?
      @options          = _.extend {}, {root: '/'}, @options, options
      @root             = @options.root
      @_wantsHashChange = @options.hashChange isnt false
      @_wantsPushState  = !!@options.pushState
      @_hasPushState    = !!(@options.pushState and @history and @history.pushState)
      fragment          = @getFragment()
      docMode           = document.documentMode
      oldIE             = isExplorer.exec(navigator.userAgent.toLowerCase()) and (!docMode or docMode <= 7)

      # Normalize root to always include a leading and trailing slash.<F2>
      @root = "/#{@root}/".replace rootStripper, '/'

      if oldIE and @_wantsHashChange
        @iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow
        @navigate fragment

      # Depending on whether we're using pushState or hashes, and whether
      # 'onhashchange' is supported, determine how we check the URL state.
      if @_hasPushState
        Backbone.$(window).on('popstate', @checkUrl)
      else if @_wantsHashChange and ('onhashchange' of window) and !oldIE
        Backbone.$(window).on('hashchange', @checkUrl)
      else if @_wantsHashChange
        @_checkUrlInterval = setInterval @checkUrl, @interval

      # Determine if we need to change the base url, for a pushState link
      # opened by a non-pushState browser.
      @fragment = fragment
      loc = @location
      atRoot = loc.pathname.replace(/[^\/]$/, '$&/') is @root

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

      @loadUrl() unless @options.silent

    # Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    # but possibly useful for unit testing Routers.
    stop: ->
      Backbone.$(window).off('popstate', @checkUrl).off('hashchange', @checkUrl)
      clearInterval @_checkUrlInterval
      History.started = false

    # Add a route to be tested when the fragment changes. Routes added later
    # may override previous routes.
    route: (route, callback) ->
      @handlers.unshift route: route, callback: callback

    # Checks the current URL to see if it has changed, and if it has,
    # calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: (e) ->
      current = @getFragment()
      current = @getFragment @getHash(@iframe) if current is @fragment and @iframe
      return false if current is @fragment
      @navigate current if @iframe
      @loadUrl() or @loadUrl @getHash()

    # Attempt to load the current URL fragment. If a route succeeds with a
    # match, returns `true`. If no defined routes matches the fragment,
    # returns `false`.
    loadUrl: (fragmentOverride) ->
      fragment = @fragment = @getFragment fragmentOverride
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
      return false unless History.started
      options = trigger: options if !options or options is true
      fragment = @getFragment fragment or ''
      return if @fragment is fragment
      @fragment = fragment
      url = @root + fragment

      # If pushState is available, we use it to set the fragment as a real URL.
      if @_hasPushState
        @history[if options.replace then 'replaceState' else 'pushState'] {}, document.title, url

      # If hash changes haven't been explicitly disabled, update the hash
      # fragment to store history.
      else if @_wantsHashChange
        @_updateHash @location, fragment, options.replace
        if @iframe and (fragment isnt @getFragment @getHash(@iframe))
          # Opening and closing the iframe tricks IE7 and earlier to push a
          # history entry on hash-tag change.  When replace is true, we don't
          # want this.
          @iframe.document.open().close() unless options.replace
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

  # Create the default Backbone.history.
  Backbone.history = new History

  # Backbone.View
  # -------------

  # Cached regex to split keys for `delegate`.
  delegateEventSplitter = /^(\S+)\s*(.*)$/

  # List of view options to be merged as properties.
  viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events']

  # Creating a Backbone.View creates its initial element outside of the DOM,
  # if an existing element is not provided...
  View = class Backbone.View

    constructor: (options) ->
      @cid = _.uniqueId 'view'
      @_configure options || {}
      @_ensureElement()
      @initialize.apply @, arguments
      @delegateEvents()

    _.extend @::, Events

    # The default `tagName` of a View's element is `"div"`.
    tagName: 'div'

    # jQuery delegate for element lookup, scoped to DOM elements within the
    # current view. This should be prefered to global lookups where possible.
    $: (selector) ->
      @$el.find selector

    # Initialize is an empty function by default. Override it with your own
    # initialization logic.
    initialize: ->

    # **render** is the core function that your view should override, in order
    # to populate its element (`this.el`), with the appropriate HTML. The
    # convention is for **render** to always return `this`.
    render: ->
      @

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
      @$el = if element instanceof Backbone.$ then element else Backbone.$ element
      @el = @$el[0]
      @delegateEvents() if delegate isnt false
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
      return @ unless events or events = _.result @, 'events'
      @undelegateEvents()
      for key, method of events
        method = @[events[key]] unless _.isFunction method
        throw new Error "Method '#{events[key]}' does not exist" unless method
        match = key.match delegateEventSplitter
        [eventName, selector] = [match[1], match[2]]
        method = _.bind method, @
        eventName += '.delegateEvents' + @cid
        if selector is ''
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

    # Performs the initial configuration of a View with a set of options.
    # Keys with special meaning *(model, collection, id, className)*, are
    # attached directly to the view.
    _configure: (options) ->
      options = _.extend {}, _.result(@, 'options'), options if @options
      _.extend @, _.pick(options, viewOptions)
      @options = options

    # Ensure that the View has a DOM element to render into.
    # If `this.el` is a string, pass it through `$()`, take the first
    # matching element, and re-assign it to `el`. Otherwise, create
    # an element from the `id`, `className` and `tagName` properties.
    _ensureElement: ->
      if @el
        @setElement _.result(@, 'el'), false
      else
        attrs = _.extend {}, _.result(@, 'attributes')
        attrs.id = _.result @, 'id' if @id
        attrs['class'] = _.result @, 'className' if @className
        $el = Backbone.$("<#{_.result(@, 'tagName')}>").attr(attrs)
        @setElement $el, false

  # Backbone.sync
  # -------------

  # Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  methodMap =
    create: 'POST'
    update: 'PUT'
    patch:  'PATCH'
    delete: 'DELETE'
    read:   'GET'

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
  Backbone.sync = (method, model, options = {}) ->
    type = methodMap[method]

    # Default options, unless specified.
    _.defaults options,
      emulateHTTP: Backbone.emulateHTTP
      emulateJSON: Backbone.emulateJSON

    # Default JSON-request options.
    params = type: type, dataType: 'json'

    # Ensure that we have a URL.
    unless options.url
      params.url = _.result(model, 'url') or urlError()

    # Ensure that we have the appropriate request data.
    if !options.data? and model and (method is 'create' or method is 'update' or method is 'patch')
      params.contentType = 'application/json'
      params.data = JSON.stringify(options.attrs or model.toJSON(options))

    # For older servers, emulate JSON by encoding the request into an HTML-form.
    if options.emulateJSON
      params.contentType = 'application/x-www-form-urlencoded'
      params.data = if params.data then model: params.data else {}

    # For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    # And an `X-HTTP-Method-Override` header.
    if options.emulateHTTP and (type is 'PUT' or type is 'DELETE' or type is 'PATCH')
      params.type = 'POST'
      params.data._method = type if options.emulateJSON
      beforeSend = options.beforeSend
      options.beforeSend = (xhr) ->
        xhr.setRequestHeader 'X-HTTP-Method-Override', type
        return beforeSend.apply @, arguments if beforeSend

    # Don't process data on a non-GET request.
    unless params.type is 'GET' or options.emulateJSON
      params.processData = false

    # Make the request, allowing the user to override any Ajax options.
    xhr = options.xhr = Backbone.ajax _.extend(params, options)
    model.trigger 'request', model, xhr, options
    xhr

  # Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  Backbone.ajax = ->
    Backbone.$.ajax.apply Backbone.$, arguments

  # Helpers
  # -------

  # Helper function to correctly set up the prototype chain, for subclasses.
  # Similar to `goog.inherits`, but uses a hash of prototype properties and
  # class properties to be extended.
  extend = (protoProps, staticProps) ->
    class extends @
      _.extend @, staticProps
      _.extend @::, protoProps
      @extend: extend

  # Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend

  # Throw an error when a URL is needed, and none is supplied.
  urlError = ->
    throw new Error 'A "url" property or function must be specified'

  # Wrap an optional error callback with a fallback error event.
  wrapError = (model, options) ->
    error = options.error
    options.error = (resp) ->
      error model, resp, options if error
      model.trigger 'error', model, resp, options
