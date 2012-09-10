module.exports = function(grunt) {

  grunt.registerTask('default', 'qunit');

  grunt.initConfig({
    qunit: {
      index: 'test/index.html'
    }
  });

};
