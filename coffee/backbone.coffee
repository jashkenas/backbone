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