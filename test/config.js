(function() {

  _.extend(window.QUnit.config, {
    
    urlConfig: [{
      id: "notrycatch",
      label: "No try-catch",
      tooltip: "Enabling this will run tests outside of a try-catch block. Makes debugging exceptions in IE reasonable. Stored as query-strings."
    }],
    
    noglobals: true
    
  });

})();