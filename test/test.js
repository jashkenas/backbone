define('test', function(require) {
  ['noconflict', 'events', 'model', 'collection',
                'router', 'view', 'sync', 'speed'].map(function(reqId) {
    return require(reqId);
  }).forEach(function(test) {
    test();
  });
});
