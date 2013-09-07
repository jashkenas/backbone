guard 'shell' do
  watch(/backbone.js/) do |m|
    n 'Running tests', 'Backbone'

    output = `npm test`
    match = output.match(/Took (\d+)ms to run (\d+) tests. (\d+) passed, (\d+) failed/).to_a
    result = match.shift
    time, tests_count, passed_count, failed_count = match.map(&:to_i)

    if failed_count > 0
      n "#{failed_count} of #{tests_count} tests failed", 'Backbone', :failed
      output
    else
      n "#{passed_count} tests passed", 'Backbone', :success
      result
    end
  end
end
