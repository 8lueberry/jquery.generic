var path = require('path');

var date = new Date();

var configure = function(grunt) {
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    //
    // system paths
    //
    paths: {
      lib: path.join(__dirname, 'lib'),
    },

    //
    // banner
    //
    banner: {
      js: '' +
        '/*\n' +
        ' * Generic - jQuery Plugin\n' +
        ' *\n' +
        ' * Example and documentation at: http://danlevan.github.io/jquery.generic\n' +
        ' *\n' +
        ' * Copyright (c) 2014 Dan LE VAN\n' +
        ' *\n' +
        ' * Version: <%= pkg.version %> (' + date.toDateString() + ')\n' +
        ' * Requires: jQuery v1.7+\n' +
        ' *' +
        ' * Licensed under the MIT license:\n' +
        ' *   https://raw.github.com/danlevan/jquery.generic/master/LICENSE\n' +
        ' */\n',
    },

    // grunt-contrib-clean
    clean: {
      lib: [
        '<%= paths.lib %>',
      ]
    },

    // grunt-contrib-concat
    concat: {
      options: {
        banner: '<%= banner.js %>',
      },

      box: {
        src: ['src/genericBox.js'],
        dest: '<%= paths.lib %>/jquery.genericBox.js',
      },
    },

    // grunt-contrib-jshint
    jshint: {
      options: {
        jshintrc: true,
      },

      lib: [
        'src/genericBox.js',
      ],
    },

    // grunt-contrib-uglify
    uglify: {
      options: {
        banner: '<%= banner.js %>',
      },

      box: {
        options: {
          sourceMap: true,
        },
        files: {
          '<%= paths.lib %>/jquery.genericBox.min.js': [
          'src/genericBox.js', ]
        },
      }
    },
  });

  // find all of the task which start with `grunt-` and load them
  require('matchdep')
    .filterDev(['grunt-*', '!grunt-cli'])
    .forEach(grunt.loadNpmTasks);

  // tasks
  grunt.registerTask(
    'default',
    'Build release',
    [
      'jshint',
      'clean:lib',
      'concat:box',
      'uglify:box',
    ]
  );
};


// Export the configuration
module.exports = configure;
