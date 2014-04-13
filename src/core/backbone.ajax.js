/*jslint browser: true, passfail: true, maxerr: 10, maxlen: 120 */
/*global Backbone*/

// Set the default implementation of `Backbone.ajax` to proxy through to `$`.
// Override this if you'd like to use a different library.
Backbone.registerModule('Backbone.ajax', ['Backbone'],
    function (Backbone) {
        "use strict";

        return function () {
            return Backbone.$.ajax.apply(Backbone.$, arguments);
        };
    });