require 'rubygems'
require 'closure-compiler'

desc "rebuild the backbone-min.js files for distribution"
task :build do
  source = File.read 'backbone.js'
  File.open('backbone-min.js', 'w+') {|f| f.write Closure::Compiler.new.compress(source) }
end

desc "build the docco documentation"
task :doc do
  system [
    'docco backbone.js',
    'docco examples/todos/todos.js examples/backbone-localstorage.js'
  ].join(' && ')
end

desc "run JavaScriptLint on the source"
task :lint do
  system "jsl -nofilelisting -nologo -conf docs/jsl.conf -process backbone.js"
end