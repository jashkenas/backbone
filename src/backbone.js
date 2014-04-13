/*jslint browser: true, passfail: true, maxerr: 10, maxlen: 120 */
/*global define, document, window, _, $, require, exports, Zepto, ender*/

(function (root, factory) {
    "use strict";

    /**
     * partial init to use module system with amd
     * @type {{previousBackbone: ({previousBackbone: , modules: Array, registerModule: Function}|*|Backbone|Backbone),
     * modules: Array, registerModule: Function}}
     */
    root.Backbone = {
        // Save the previous value of the `Backbone` variable, so that it can be
        // restored later on, if `noConflict` is used.
        previousBackbone: root.Backbone,
        modules: [],
        /**
         * the module will be cached in amd mode to load every module after the defininition of Backbone
         * in non amd mode the module will be loaded immediately
         * @param moduleName
         * @param moduleDependencies
         * @param moduleImplementation
         */
        registerModule: function (moduleName, moduleDependencies, moduleImplementation) {
            if (this.loadModule !== undefined) {
                this.loadModule(moduleName, moduleDependencies, moduleImplementation);
            } else {
                this.modules.push({
                    moduleName: moduleName,
                    moduleDependencies: moduleDependencies,
                    moduleImplementation: moduleImplementation
                });
            }
        }
    };

    // Set up Backbone appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {
        define(['underscore', 'jquery', 'exports'], function (_, $, exports) {
            // Export global even in AMD case in case this script is loaded with
            // others that may still expect a global Backbone.
            factory(root, root.Backbone, _, $);
        });

        // Next for Node.js or CommonJS. jQuery may not be needed as a module.
    } else if (typeof exports !== 'undefined') {
        var _ = require('underscore');
        factory(root, exports, _);

        // Finally, as a browser global.
    } else {
        factory(root, root.Backbone, root._, (root.jQuery || root.Zepto || root.ender || root.$));
    }

}(this, function (root, Backbone, _, $) {
    "use strict";

    var array = [],
        getDependencies = function (moduleDependencies) {
            var length = moduleDependencies.length,
                i,
                dependencies = [];

            for (i = 0; i < length; i += 1) {
                dependencies.push(getDependency(moduleDependencies[i]));
            }

            return dependencies;
        },
        /**
         * search for dependency in namespaces
         * @param dependencyName
         * @returns {*}
         */
        getDependency = function (dependencyName) {
            var parent = Backbone,
                parts = dependencyName.split('.'),
                length = parts.length,
                i;

            if (parts[0] === "Backbone" || parts[0] === "backbone") {
                parts = parts.slice(1);
            }

            length = parts.length;

            for (i = 0; i < length; i++) {
                if (parent[parts[i]] === undefined) {
                    parent[parts[i]] = {};
                }
                parent = parent[parts[i]];
            }

            return parent;
        };

    Backbone.slice = array.slice;

    Backbone.root = root;
    Backbone._ = _;

    // Initial Setup
    // -------------

    // Current version of the library. Keep in sync with `package.json`.
    Backbone.VERSION = '1.1.2';

    // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
    // the `$` variable.
    Backbone.$ = $;

    // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
    // to its previous owner. Returns a reference to this Backbone object.
    Backbone.noConflict = function () {
        root.Backbone = Backbone.previousBackbone;
        return this;
    };

    // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
    // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
    // set a `X-Http-Method-Override` header.
    Backbone.emulateHTTP = false;

    // Turn on `emulateJSON` to support legacy servers that can't deal with direct
    // `application/json` requests ... will encode the body as
    // `application/x-www-form-urlencoded` instead and will send the model in a
    // form param named `model`.
    Backbone.emulateJSON = false;

    /**
     * load module and create namespace for module
     * @param moduleName
     * @param moduleDependencies
     * @param moduleImplementation
     */
    Backbone.loadModule = function (moduleName, moduleDependencies, moduleImplementation) {
        var dependencies = getDependencies(moduleDependencies),
            i,
            parts = moduleName.split('.'),
            parent = Backbone,
            pl;

        if (parts[0] === "Backbone" || parts[0] === "backbone") {
            parts = parts.slice(1);
        }

        pl = parts.length

        for (i = 0; i < pl; i++) {
            if (parent[parts[i]] === undefined) {
                parent[parts[i]] = {};
            }
            if (i < (pl - 1)) {
                parent = parent[parts[i]];
            }
            moduleName = parts[i];
        }

        if (_.isEmpty(parent[moduleName])) {
            parent[moduleName] = moduleImplementation.apply(this, dependencies);
        }
    };

    /**
     * will be executed in amd mode to load all modules
     */
    Backbone.loadModules = function () {
        var modules = Backbone.modules,
            i,
            len = modules.length,
            module;

        for (i = 0; i < len; i += 1) {
            module = modules[i];
            Backbone.loadModule(module.moduleName, module.moduleDependencies, module.moduleImplementation);
        }
    };

    if(Backbone.modules.length > 0){
        Backbone.loadModules();
    }

    /**
     * delete cached modules
     */
    delete Backbone.modules;

    return Backbone;
}));
