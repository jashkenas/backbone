###*
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
###

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
