module.exports = function(grunt) {
    grunt.initConfig({
      watch: {
        options: {
          livereload: true,
        },
        all: {
          files: ['*.*'],
        },
      },
    });

    grunt.loadNpmTasks('grunt-contrib-watch');


};
