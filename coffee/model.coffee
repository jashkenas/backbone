###*
  Backbone.Model
  --------------

  Backbone **Models** are the basic data object in the framework --
  frequently representing a row in a table in a database on your server.
  A discrete chunk of data and a bunch of useful, related methods for
  performing computations and transformations on that data.

  Create a new model with the specified attributes. A client id (`cid`)
  is automatically generated and assigned for you.
###
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
