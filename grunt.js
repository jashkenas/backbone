var fs = require('fs');
var exec = require('child_process').exec;

var HEADER = /^(.*\n){6}/;
var source = fs.readFileSync('backbone.js','utf8');

module.exports = function(grunt) {

  grunt.initConfig({
    meta: {
      banner: source.match(HEADER)[0]
    },
    min: {
      dist: {
        src: ['<banner>', 'backbone.js'],
        dest: 'backbone-min.js'
      }
    },
    lint: {
      files: ['backbone.js']
    },
    jshint: {
      options: {
        regexdash: true,
        supernew: true,
        boss: true,
        eqnull: true,
        browser: true,
        expr: true,
        shadow: true
      }
    },
    qunit: {
      files: ['test/index.html']
    },
    docco: {
      all: {
        src: [
          'backbone.js',
          'examples/todos/todos.js',
          'examples/backbone-localstorage.js'
        ]
      }
    },
    watch: {
      all: {
        files: ['backbone.js', 'test/*.js'],
        tasks: 'qunit lint'
      }
    }
  });

  grunt.registerTask('coffee', 'test the CoffeeScript integration', function(){
    var done = this.async();
    exec('which coffee', function(err, stdout, stderr){
      if( err || stderr ){
        grunt.fail.fatal('CoffeeScript not found. Install it from http://coffeescript.org/');
      }
      exec('coffee test/*.coffee', function(err, stdout, stderr){
        if( stderr ) grunt.fail.fatal(stderr);
        grunt.log.writeln(stdout);
        done();
      });
    });
  });

  grunt.registerTask('default', 'lint qunit');

  grunt.registerTask('release', 'lint qunit coffee docco min');

  grunt.loadNpmTasks('grunt-docco');
};
