var args = phantom.args;

if (args.length < 1 || args.length > 2) {
    console.log("Usage: " + phantom.scriptName + " <URL> <timeout>");
    phantom.exit(1);
}

var page = new WebPage();

page.onConsoleMessage = function(msg) {
    if (msg.slice(0,8) === 'WARNING:')
        return;

    console.log(msg);
};

page.open(args[0], function(status) {
    if (status !== 'success') {
        console.error("Unable to access network");
        return phantom.exit(1);
    }

    page.evaluate(logQUnit);

    var timeout = parseInt(args[1] || 60000, 10);
    var start = Date.now();
    var interval = setInterval(function() {
        if (Date.now() > start + timeout) {
            console.error("Tests timed out");
            return phantom.exit(124);
        }
        
        var qunitDone = page.evaluate(function() {
            return window.qunitDone;
        });

        if (qunitDone) {
            clearInterval(interval);
            phantom.exit(qunitDone.failed > 0);
        }
    }, 500);
});

function logQUnit() {
    var testErrors = [];
    var assertionErrors = [];

    console.log("Running: " + JSON.stringify(QUnit.urlParams));

    QUnit.moduleDone(function(context) {
        if (context.failed) {
            console.error("Module Failed: " + context.name + "\n" + testErrors.join("\n"));
            testErrors = [];
        }
    });

    QUnit.testDone(function(context) {
        if (context.failed) {
            testErrors.push("  Test Failed: " + context.name + assertionErrors.join("    "));
            assertionErrors = [];
        }
    });

    QUnit.log(function(context) {
        if (context.result)
            return;

        var msg = "\n    Assertion Failed:";
        if (context.message) {
            msg += " " + context.message;
        }

        if (context.expected) {
            msg += "\n      Expected: " + context.expected + ", Actual: " + context.actual;
        }

        assertionErrors.push(msg);
    });

    QUnit.done(function(context) {
        var stats = [
            "Time: " + context.runtime + "ms",
            "Total: " + context.total,
            "Passed: " + context.passed,
            "Failed: " + context.failed
        ];
    
        console.log(stats.join(", "));
        window.qunitDone = context;
    });
}
