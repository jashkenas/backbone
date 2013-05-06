module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    coffee:
      compileJoined:
        options:
          join: true
        files:
          # 1:1 compile, identical output to join = false
          'backbone.js': 'backbone.coffee'
          # concat then compile into single file
          #'path/to/another.js': ['path/to/sources/*.coffee', 'path/to/more/*.coffee']
  
  grunt.loadNpmTasks 'grunt-contrib-coffee'
