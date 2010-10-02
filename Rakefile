require 'rubygems'
require 'closure-compiler'

desc "rebuild the backbone-min.js files for distribution"
task :build do
  source = File.read 'backbone.js'
  File.open('backbone-min.js', 'w+') {|f| f.write Closure::Compiler.new.compress(source) }
end