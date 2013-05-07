module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    coffee:
      compileJoined:
        options:
          join: true
        files:
          # concat then compile into single file
          'backbone.js': [
            'coffee/backbone.coffee'
            'coffee/events.coffee'
            'coffee/model.coffee'
            'coffee/collection.coffee'
            'coffee/view.coffee'
            'coffee/router.coffee'
            'coffee/history.coffee'
            'coffee/helpers.coffee'
          ]
    uglify:
      options:
        mangle: true
      my_target:
        options:
          sourceMap: 'backbone-min.map'
          # the location to find your original source
          #sourceMapRoot: 'http://example.com/path/to/src/'
          # input sourcemap from a previous compilation
          #sourceMapIn: 'example/coffeescript-sourcemap.js'
        files:
          'backbone-min.js': ['backbone.js']
  
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
