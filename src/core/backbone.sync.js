/*jslint browser: true, passfail: true, maxerr: 10, maxlen: 120 */
/*global Backbone, ActiveXObject*/

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
Backbone.registerModule('Backbone.sync', ['Backbone', '_', 'Backbone.urlError'],
    function (Backbone, _, urlError) {
        "use strict";

        var noXhrPatch = window !== undefined && !!window.ActiveXObject && !(window.XMLHttpRequest &&
                (new XMLHttpRequest()).dispatchEvent),

        // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
            methodMap = {
                'create': 'POST',
                'update': 'PUT',
                'patch': 'PATCH',
                'delete': 'DELETE',
                'read': 'GET'
            };

        return function (method, model, options) {
            var type = methodMap[method],
                opt = options || {},
                params,
                beforeSend,
                error,
                xhr;

            // Default options, unless specified.
            _.defaults(opt, {
                emulateHTTP: Backbone.emulateHTTP,
                emulateJSON: Backbone.emulateJSON
            });

            // Default JSON-request options.
            params = {type: type, dataType: 'json'};

            // Ensure that we have a URL.
            if (!opt.url) {
                params.url = _.result(model, 'url') || urlError();
            }

            // Ensure that we have the appropriate request data.
            if (opt.data === undefined && model && (method === 'create' || method === 'update' || method === 'patch')) {
                params.contentType = 'application/json';
                params.data = JSON.stringify(opt.attrs || model.toJSON(opt));
            }

            // For older servers, emulate JSON by encoding the request into an HTML-form.
            if (opt.emulateJSON) {
                params.contentType = 'application/x-www-form-urlencoded';
                params.data = params.data ? {model: params.data} : {};
            }

            // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
            // And an `X-HTTP-Method-Override` header.
            if (opt.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
                params.type = 'POST';
                if (opt.emulateJSON) {
                    params.data._method = type;
                }
                beforeSend = opt.beforeSend;
                opt.beforeSend = function (xhr) {
                    xhr.setRequestHeader('X-HTTP-Method-Override', type);
                    if (beforeSend) {
                        return beforeSend.apply(this, arguments);
                    }
                };
            }

            // Don't process data on a non-GET request.
            if (params.type !== 'GET' && !opt.emulateJSON) {
                params.processData = false;
            }

            // If we're sending a `PATCH` request, and we're in an old Internet Explorer
            // that still has ActiveX enabled by default, override jQuery to use that
            // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
            if (params.type === 'PATCH' && noXhrPatch) {
                params.xhr = function () {
                    return new ActiveXObject("Microsoft.XMLHTTP");
                };
            }

            // Pass along `textStatus` and `errorThrown` from jQuery.
            error = opt.error;
            opt.error = function (xhr, textStatus, errorThrown) {
                opt.textStatus = textStatus;
                opt.errorThrown = errorThrown;
                if (error) {
                    error.apply(this, arguments);
                }
            };

            // Make the request, allowing the user to override any Ajax options.
            xhr = opt.xhr = Backbone.ajax(_.extend(params, opt));
            model.trigger('request', model, xhr, opt);
            return xhr;
        };

    });
