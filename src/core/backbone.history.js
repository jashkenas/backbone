/*jslint browser: true, passfail: true, maxerr: 10, maxlen: 120 */
/*global Backbone, attachEvent, detachEvent*/

// Backbone.History
// ----------------

// Handles cross-browser history management, based on either
// [pushState](http://diveintohtml5.info/history.html) and real URLs, or
// [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
// and URL fragments. If the browser supports neither (old IE, natch),
// falls back to polling.
Backbone.registerModule('Backbone.History', ['Backbone', '_', 'Backbone.Events'],
    function (Backbone, _, Events) {
        "use strict";

        // Cached regex for stripping a leading hash/slash and trailing space.
        var routeStripper = /^[#\/]|\s+$/g,

        // Cached regex for stripping leading and trailing slashes.
            rootStripper = /^\/+|\/+$/g,

        // Cached regex for stripping urls of hash.
            pathStripper = /#.*$/,

            History = function () {
                this.handlers = [];
                _.bindAll(this, 'checkUrl');

                // Ensure that `History` can be used outside of the browser.
                if (window !== undefined) {
                    this.location = window.location;
                    this.history = window.history;
                }
            };

        // Has the history handling already been started?
        History.started = false;

        // Set up all inheritable **Backbone.History** properties and methods.
        _.extend(History.prototype, Events, {

            // The default interval to poll for hash changes, if necessary, is
            // twenty times a second.
            interval: 50,

            // Are we at the app root?
            atRoot: function () {
                var path = this.location.pathname.replace(/[^\/]$/, '$&/');
                return path === this.root && !this.location.search;
            },

            // Gets the true hash value. Cannot use location.hash directly due to bug
            // in Firefox where location.hash will always be decoded.
            getHash: function (window) {
                var match = (window || this).location.href.match(/#(.*)$/);
                return match ? match[1] : '';
            },

            // Get the pathname and search params, without the root.
            getPath: function () {
                var path = decodeURI(this.location.pathname + this.location.search),
                    root = this.root.slice(0, -1);

                if (path.indexOf(root) === 0) {
                    path = path.slice(root.length);
                }
                return path.slice(1);
            },

            // Get the cross-browser normalized URL fragment from the path or hash.
            getFragment: function (fragment) {
                if (fragment === null || fragment === undefined) {
                    if (this._hasPushState || !this._wantsHashChange) {
                        fragment = this.getPath();
                    } else {
                        fragment = this.getHash();
                    }
                }
                return fragment.replace(routeStripper, '');
            },

            // Start the hash change handling, returning `true` if the current URL matches
            // an existing route, and `false` otherwise.
            start: function (options) {
                if (History.started) {
                    throw new Error("Backbone.history has already been started");
                }

                History.started = true;

                // Figure out the initial configuration. Do we need an iframe?
                // Is pushState desired ... is it available?
                this.options = _.extend({root: '/'}, this.options, options);
                this.root = this.options.root;
                this._wantsHashChange = this.options.hashChange !== false;
                this._hasHashChange = (window.onhashchange !== undefined);
                this._wantsPushState = !!this.options.pushState;
                this._hasPushState = !!(this.options.pushState && this.history && this.history.pushState);
                this.fragment = this.getFragment();

                // Add a cross-platform `addEventListener` shim for older browsers.
                var addEventListener = window.addEventListener || function (eventName, listener) {
                        return attachEvent('on' + eventName, listener);
                    },
                    iframe,
                    body;

                // Normalize root to always include a leading and trailing slash.
                this.root = ('/' + this.root + '/').replace(rootStripper, '/');

                // Proxy an iframe to handle location events if the browser doesn't
                // support the `hashchange` event, HTML5 history, or the user wants
                // `hashChange` but not `pushState`.
                if (!this._hasHashChange && this._wantsHashChange && (!this._wantsPushState || !this._hasPushState)) {
                    iframe = document.createElement('iframe');
//                    iframe.src = 'javascript:0';
                    iframe.src = '';
                    iframe.style.display = 'none';
                    iframe.tabIndex = -1;
                    body = document.body;
                    // Using `appendChild` will throw on IE < 9 if the document is not ready.
                    this.iframe = body.insertBefore(iframe, body.firstChild).contentWindow;
                    this.navigate(this.fragment);
                }

                // Depending on whether we're using pushState or hashes, and whether
                // 'onhashchange' is supported, determine how we check the URL state.
                if (this._hasPushState) {
                    addEventListener('popstate', this.checkUrl, false);
                } else if (this._wantsHashChange && this._hasHashChange && !this.iframe) {
                    addEventListener('hashchange', this.checkUrl, false);
                } else if (this._wantsHashChange) {
                    this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
                }

                // Transition from hashChange to pushState or vice versa if both are
                // requested.
                if (this._hasPushState && this.atRoot()) {
                    this.navigate(this.getHash(), {replace: true});
                } else if (this._wantsHashChange && this._wantsPushState) {
                    // If we've started off with a route from a `pushState`-enabled
                    // browser, but we're currently in a browser that doesn't support it...
                    if (!this._hasPushState && !this.atRoot()) {
                        this.location.replace(this.root + '#' + this.getPath());
                        // Return immediately as browser will do redirect to new url
                        return true;

                        // Or if we've started out with a hash-based route, but we're currently
                        // in a browser where it could be `pushState`-based instead...
                    }
                }

                if (this.options.silent === undefined) {
                    return this.loadUrl();
                }
            },

            // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
            // but possibly useful for unit testing Routers.
            stop: function () {
                // Add a cross-platform `removeEventListener` shim for older browsers.
                var removeEventListener = window.removeEventListener || function (eventName, listener) {
                    return detachEvent('on' + eventName, listener);
                };

                // Remove window listeners.
                if (this._hasPushState) {
                    removeEventListener('popstate', this.checkUrl, false);
                } else if (this._wantsHashChange && this._hasHashChange && !this.iframe) {
                    removeEventListener('hashchange', this.checkUrl, false);
                }

                // Clean up the iframe if necessary.
                if (this.iframe) {
                    document.body.removeChild(this.iframe.frameElement);
                    this.iframe = null;
                }

                // Some environments will throw when clearing an undefined interval.
                if (this._checkUrlInterval) {
                    clearInterval(this._checkUrlInterval);
                }
                History.started = false;
            },

            // Add a route to be tested when the fragment changes. Routes added later
            // may override previous routes.
            route: function (route, callback) {
                this.handlers.unshift({route: route, callback: callback});
            },

            // Checks the current URL to see if it has changed, and if it has,
            // calls `loadUrl`, normalizing across the hidden iframe.
            checkUrl: function (e) {
                var current = this.getFragment();
                if (current === this.fragment && this.iframe) {
                    current = this.getHash(this.iframe);
                }
                if (current !== this.fragment) {
                    if (this.iframe) {
                        this.navigate(current);
                    }
                    this.loadUrl();
                }
            },

            // Attempt to load the current URL fragment. If a route succeeds with a
            // match, returns `true`. If no defined routes matches the fragment,
            // returns `false`.
            loadUrl: function (fragment) {
                fragment = this.fragment = this.getFragment(fragment);
                return _.any(this.handlers, function (handler) {
                    if (handler.route.test(fragment)) {
                        handler.callback(fragment);
                        return true;
                    }
                    return false;
                });
            },

            // Save a fragment into the hash history, or replace the URL state if the
            // 'replace' option is passed. You are responsible for properly URL-encoding
            // the fragment in advance.
            //
            // The options object can contain `trigger: true` if you wish to have the
            // route callback be fired (not usually desirable), or `replace: true`, if
            // you wish to modify the current URL without adding an entry to the history.
            navigate: function (fragment, options) {
                if (!History.started) {
                    return false;
                }
                if (!options || options === true) {
                    options = {trigger: !!options};
                }

                var url = this.root + (fragment = this.getFragment(fragment || ''));

                // Strip the hash for matching.
                fragment = fragment.replace(pathStripper, '');

                if (this.fragment === fragment) {
                    return;
                }

                this.fragment = fragment;

                // Don't include a trailing slash on the root.
                if (fragment === '' && url !== '/') {
                    url = url.slice(0, -1);
                }

                // If pushState is available, we use it to set the fragment as a real URL.
                if (this._hasPushState) {
                    this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

                    // If hash changes haven't been explicitly disabled, update the hash
                    // fragment to store history.
                } else if (this._wantsHashChange) {
                    this._updateHash(this.location, fragment, options.replace);
                    if (this.iframe && (fragment !== this.getHash(this.iframe))) {
                        // Opening and closing the iframe tricks IE7 and earlier to push a
                        // history entry on hash-tag change.  When replace is true, we don't
                        // want this.
                        if (!options.replace) {
                            this.iframe.document.open().close();
                        }

                        this._updateHash(this.iframe.location, fragment, options.replace);
                    }

                    // If you've told us that you explicitly don't want fallback hashchange-
                    // based history, then `navigate` becomes a page refresh.
                } else {
                    return this.location.assign(url);
                }
                if (options.trigger) {
                    return this.loadUrl(fragment);
                }
            },

            // Update the hash location, either replacing the current entry, or adding
            // a new one to the browser history.
            _updateHash: function (location, fragment, replace) {
                if (replace) {
                    var href = location.href.replace(/(javascript:|#).*$/, '');
                    location.replace(href + '#' + fragment);
                } else {
                    // Some browsers require that `hash` contains a leading #.
                    location.hash = '#' + fragment;
                }
            }

        });

        // Create the default Backbone.history.
        Backbone.history = new History();

        History.extend = Backbone.extend;

        return History;
    });
