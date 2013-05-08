###*
  Backbone.Router
  ---------------

  Routers map faux-URLs to actions, and fire events when routes are
  matched. Creating a new one sets its `routes` hash, if not set statically.
###

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
