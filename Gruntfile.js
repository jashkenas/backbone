'use strict';

module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            options: {
                curly: false,
                eqeqeq: false,
                latedef: false,
                eqnull: true,
                expr: true,
                supernew: true,
                evil: true
            },

            src: ['backbone.js'],
            node: ['index.js']
        },

        uglify: {
            options: {
                banner: '//     Backbone.js <%= pkg.version %>'+ '\n' +
                        '//     <%= pkg.url %>' + '\n' +
                        '//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.' + '\n' +
                        '//     Backbone may be freely distributed under the MIT license.'
            },

            src: {
                'backbone-min.js': ['backbone.js']
            }
        },

        qunit: {
            options: {

            },
            all: ['test/index.html']
        },

        docco: {
            annotated: {
                src: ['backbone.js', 'examples/todos/todos.js', 'examples/backbone-localstorage.js'],
                options: {
                    output: 'docs/'
                }
            }
        },

        coffee: {
            tests: {
                expand: true,
                cwd: 'test',
                src: ['*.coffee'],
                dest: 'test/compiled/',
                ext: '.js'
            }
        },
        
        watch: {
            src: {
                files: ['backbone.js', 'test/*.js', 'test/coffee.js'],
                tasks: ['coffee', 'qunit', 'uglify']
            }
        },

    });
    
    // shortcut task to test
    grunt.registerTask('test', ['coffee', 'qunit']);

    // shortcut task to generate docs
    grunt.registerTask('docs', ['docco']);

    //Load the plugin that provides the "docco" task.
    grunt.loadNpmTasks('grunt-docco');

    //Load the plugin that provides the "coffee" task.
    grunt.loadNpmTasks('grunt-contrib-coffee');

    //Load the plugin that provides the "qunit" task.
    grunt.loadNpmTasks('grunt-contrib-qunit');

    //Load the plugin that provides the "jshint" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    
    //Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    
    //Load the plugin that provides the "watch" task.
    grunt.loadNpmTasks('grunt-contrib-watch');


}