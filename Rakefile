require 'rubygems'
require 'closure-compiler'

desc "rebuild the backbone-min.js files for distribution"
task :build do
  files   = Dir['lib/*.js']
  source  = files.map {|f| File.read f }.join "\n\n"
  File.open('backbone.js', 'w+') {|f| f.write source }
  File.open('backbone-min.js', 'w+') {|f| f.write Closure::Compiler.new.compress(source) }
end