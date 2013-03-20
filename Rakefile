desc "rebuild the backbone-min.js files for distribution"
task :build do
  check 'uglifyjs', 'UglifyJS', 'https://github.com/mishoo/UglifyJS2'
  system 'uglifyjs backbone.js --source-map backbone-min.map -o backbone-min.js'
end

desc "build the docco documentation"
task :doc do
  check 'docco', 'docco', 'https://github.com/jashkenas/docco'
  system 'docco backbone.js && docco examples/todos/todos.js examples/backbone.localstorage.js'
end

desc "run JavaScriptLint on the source"
task :lint do
  check 'jsl', 'JavaScript Lint', 'http://www.javascriptlint.com/'
  system "jsl -nofilelisting -nologo -conf docs/jsl.conf -process backbone.js"
end

# Check for the existence of an executable.
def check(exec, name, url)
  return unless `which #{exec}`.empty?
  puts "#{name} not found.\nInstall it from #{url}"
  exit
end
