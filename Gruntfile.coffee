module.exports = (grunt) ->
  grunt.loadNpmTasks 'grunt-coffeelint'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-qunit'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    coffeelint:
      app: ['coffee/*.coffee']
      options:
        max_line_length:
          level: 'warn'
    coffee:
      backbone:
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
      backbone:
        options:
          sourceMap: 'backbone-min.map'
        files:
          'backbone-min.js': ['backbone.js']
    qunit:
      files: ['test/*.html']
    watch:
      files: ['coffee/*.coffee']
      tasks: ['test']

  grunt.registerTask 'default', ['coffeelint', 'coffee']
  grunt.registerTask 'minify', ['default', 'uglify']
  grunt.registerTask 'test', ['default', 'qunit']
