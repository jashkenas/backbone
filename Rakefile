require 'rubygems'
require 'closure-compiler'

HEADER = /((^\s*\/\/.*\n)+)/

desc "rebuild the backbone-min.js files for distribution"
task :build do
  source = File.read 'backbone.js'
  header = source.match(HEADER)
  File.open('backbone-min.js', 'w+') do |file|
    file.write header[1].squeeze(' ') + Closure::Compiler.new.compress(source)
  end
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

desc "test the CoffeeScript integration"
task :test do
  system "coffee test/*.coffee"
end