/*jslint browser: true, passfail: true, maxerr: 10, maxlen: 120 */
/*global Backbone*/

// Wrap an optional error callback with a fallback error event.
Backbone.registerModule('Backbone.wrapError', [],
    function () {
        "use strict";

        return function (model, options) {
            var error = options.error;
            options.error = function (resp) {
                if (error) {
                    error(model, resp, options);
                }
                model.trigger('error', model, resp, options);
            };
        };
    });
