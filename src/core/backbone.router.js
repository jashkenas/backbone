/*jslint browser: true, passfail: true, maxerr: 10, maxlen: 120 */
/*global Backbone*/

// Backbone.Router
// ---------------

// Routers map faux-URLs to actions, and fire events when routes are
// matched. Creating a new one sets its `routes` hash, if not set statically.
Backbone.registerModule('Backbone.Router', ['Backbone', '_', 'Backbone.Events'],
    function (Backbone, _, Events) {
        "use strict";

        // Cached regular expressions for matching named param parts and splatted
        // parts of route strings.
        var optionalParam = /\((.*?)\)/g,
            namedParam = /(\(\?)?:\w+/g,
            splatParam = /\*\w+/g,
            escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g,
            Router = Backbone.Router = function (options) {
                var opt = options || {};
                if (opt.routes) {
                    this.routes = opt.routes;
                }
                this._bindRoutes();
                this.initialize.apply(this, arguments);
            };

        // Set up all inheritable **Backbone.Router** properties and methods.
        _.extend(Router.prototype, Events, {

            // Initialize is an empty function by default. Override it with your own
            // initialization logic.
            initialize: function () {
            },

            // Manually bind a single named route to a callback. For example:
            //
            //     this.route('search/:query/p:num', 'search', function(query, num) {
            //       ...
            //     });
            //
            route: function (route, name, callback) {
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
                var router = this;
                Backbone.history.route(route, function (fragment) {
                    var args = router._extractParameters(route, fragment);
                    if (router.execute(callback, args, name) !== false) {
                        router.trigger.apply(router, ['route:' + name].concat(args));
                        router.trigger('route', name, args);
                        Backbone.history.trigger('route', router, name, args);
                    }
                });
                return this;
            },

            // Execute a route handler with the provided parameters.  This is an
            // excellent place to do pre-route setup or post-route cleanup.
            execute: function (callback, args, name) {
                if (callback) {
                    callback.apply(this, args);
                }
            },

            // Simple proxy to `Backbone.history` to save a fragment into the history.
            navigate: function (fragment, options) {
                Backbone.history.navigate(fragment, options);
                return this;
            },

            // Bind all defined routes to `Backbone.history`. We have to reverse the
            // order of the routes here to support behavior where the most general
            // routes can be defined at the bottom of the route map.
            _bindRoutes: function () {
                if (!this.routes) {
                    return;
                }
                this.routes = _.result(this, 'routes');
                var route, routes = _.keys(this.routes);
                while ((route = routes.pop()) !== undefined) {
                    this.route(route, this.routes[route]);
                }
            },

            // Convert a route string into a regular expression, suitable for matching
            // against the current location hash.
            _routeToRegExp: function (route) {
                route = route.replace(escapeRegExp, '\\$&')
                    .replace(optionalParam, '(?:$1)?')
                    .replace(namedParam, function (match, optional) {
                        return optional ? match : '([^/?]+)';
                    })
                    .replace(splatParam, '([^?]*?)');
                return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
            },

            // Given a route, and a URL fragment that it matches, return the array of
            // extracted decoded parameters. Empty or unmatched parameters will be
            // treated as `null` to normalize cross-browser behavior.
            _extractParameters: function (route, fragment) {
                var params = route.exec(fragment).slice(1);
                return _.map(params, function (param, i) {
                    // Don't decode the search params.
                    if (i === params.length - 1) {
                        return param || null;
                    }
                    return param ? decodeURIComponent(param) : null;
                });
            }

        });

        Router.extend = Backbone.extend;

        return Router;
    });
