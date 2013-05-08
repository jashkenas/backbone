###*
Helpers
-------

Helper function to correctly set up the prototype chain, for subclasses.
Similar to `goog.inherits`, but uses a hash of prototype properties and
class properties to be extended.
###
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
