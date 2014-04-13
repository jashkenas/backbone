/*jshint node: true*/
/*global module*/

module.exports = function (grunt) {
    "use strict";

    var fileOrder = ['src/backbone.js', 'src/core/backbone.extend.js', 'src/core/backbone.urlError.js',
        'src/core/backbone.wrapError.js', 'src/core/backbone.ajax.js', 'src/core/backbone.sync.js',
        'src/core/backbone.events.js', 'src/core/backbone.model.js', 'src/core/backbone.collection.js',
        'src/core/backbone.router.js', 'src/core/backbone.history.js', 'src/core/backbone.view.js'];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: fileOrder,
                dest: 'dist/backbone.js'
            }
        },
        uglify: {
            options: {
                report: 'min'
            },
            backbone: {
                src: fileOrder,
                dest: 'dist/backbone.min.js'
            }
        },
        qunit: {
            options: {
                inject: 'test/vendor/phantom.js'
            },
            files: ['test/index_modules.html']
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('dist', ['concat', 'uglify']);
    grunt.registerTask('test', ['qunit']);
};
