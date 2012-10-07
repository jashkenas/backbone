require 'rubygems'

HEADER = /((^\s*\/\/.*\n)+)/

desc "build backbone.js from source files"
task :build do
  `./build > backbone.js`
end

desc "rebuild the backbone-min.js files for distribution"
task :min => :build do
  begin
    require 'closure-compiler'
  rescue LoadError
    puts "closure-compiler not found.\nInstall it by running 'gem install closure-compiler'"
    exit
  end
  source = File.read 'backbone.js'
  header = source.match(HEADER)
  File.open('backbone-min.js', 'w+') do |file|
    file.write header[1].squeeze(' ') + Closure::Compiler.new.compress(source)
  end
end

desc "build the docco documentation"
task :doc do
  check 'docco', 'docco', 'https://github.com/jashkenas/docco'
  system 'docco backbone.js && docco examples/todos/todos.js examples/backbone-localstorage.js'
end

desc "run JavaScriptLint on the source"
task :lint do
  check 'jsl', 'JavaScript Lint', 'http://www.javascriptlint.com/'
  system "jsl -nofilelisting -nologo -conf docs/jsl.conf -process backbone.js"
end

desc "test the CoffeeScript integration and run dev server"
task :test do
  check 'coffee', 'CoffeeScript', 'http://coffeescript.org/'
  system "coffee test/*.coffee"
  puts 'open localhost:3000/test/ in a browser to run tests'
  system 'node dev_server.js'
end

# Check for the existence of an executable.
def check(exec, name, url)
  return unless `which #{exec}`.empty?
  puts "#{name} not found.\nInstall it from #{url}"
  exit
end
