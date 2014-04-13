(function () {

    module("Backbone.Core");

    test("create testModule", 1, function () {
        Backbone.registerModule('testModule', [], function () {
            "use strict";
            return "testModule";
        });

        equal((Backbone.testModule !== undefined), true, "should be defined");
    });

    test("create Module.testModule", 1, function () {
        Backbone.registerModule('Module.testModule', [], function () {
            "use strict";
            return "Module.testModule";
        });

        equal((Backbone.Module.testModule !== undefined), true, "should be defined");
    });

    test("create Module.testModule2 with dependencies", 2, function () {
        Backbone.registerModule('Module.testModule2', ['Module.testModule'], function () {
            "use strict";
            return "first instance";
        });

        equal((Backbone.Module.testModule2 !== undefined), true, "should be defined");

        Backbone.registerModule('Module.testModule2', [], function () {
            "use strict";
            return "second instance";
        });

        equal((Backbone.Module.testModule2 === "first instance" ), true, "modules can not be overridden");
    });

    test("test if dependency injection works", 2, function () {
        Backbone.registerModule('Module.testModule3', [],
            function (a, b) {
                "use strict";
                return 'Module.testModule3';
            });
        Backbone.registerModule('testModule2', [],
            function (a, b) {
                "use strict";
                return 'testModule2';
            });
        Backbone.registerModule('Module.testModule4', ['Module.testModule3', 'testModule2'],
            function (a, b) {
                "use strict";
                return {
                    a: a,
                    b: b
                };
            });

        equal((Backbone.Module.testModule4.a === "Module.testModule3" ), true, "should be Module.testModule3");
        equal((Backbone.Module.testModule4.b === "testModule2" ), true, "should be testModule2");
    });

})();
