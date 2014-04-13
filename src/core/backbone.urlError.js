/*jslint browser: true, passfail: true, maxerr: 10, maxlen: 120 */
/*global Backbone*/

// Wrap an optional error callback with a fallback error event.
Backbone.registerModule('Backbone.urlError', [],
    function () {
        "use strict";

        return function () {
            throw new Error('A "url" property or function must be specified');
        };
    });
