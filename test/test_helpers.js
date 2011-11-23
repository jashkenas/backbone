function waitFor(state_fn, duration) {
  if(duration === undefined) duration = 1000;

  var started_at = new Date;
  var nextActions = [];

  var interval_id = setInterval(function() {
    if (((new Date) - started_at > duration) || (state_fn())) {
      clearInterval(interval_id);
      $(nextActions).each(function(_, fn) { fn(); });
    }
  }, 10);
  return({then: function(fn) {nextActions.push(fn);}});
}
