var _ = require('lodash');
var bower = require('gulp-bower');
var clean = require('gulp-clean');
var gulp = require('gulp');
var header = require('gulp-header');
var nib = require('nib');
var path = require('path');
var packageConfig = require('./package.json');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var stylus = require('gulp-stylus');
var sync = require('gulp-config-sync');
var template = require('express-dot-engine').render;
var through = require('through2');
var uglify = require('gulp-uglify');
var util = require('util');

var now = new Date();

/**
 * General paths
 */
var paths = {
  distribution: 'dist',
  distributionCss: 'dist/css',

  examples: 'example',
  pages: 'pages',
  depencencies: 'lib',
};

/**
 * Banner to show on the generated files
 */
var banner = '' +
  '/*\n' +
  ' * Generic - jQuery Plugin\n' +
  ' *\n' +
  ' * Example and documentation at: <%= homepage %>\n' +
  ' *\n' +
  ' * Copyright (c) 2014 <%= author %>\n' +
  ' *\n' +
  ' * Version: <%= version %> (' + now.toDateString() + ')\n' +
  ' * Requires: jQuery v1.7+\n' +
  ' *' +
  ' * Licensed under the MIT license:\n' +
  ' *   https://raw.github.com/danlevan/jquery.generic/master/LICENSE\n' +
  ' */\n';

/**
 * Generates all the plugins
 */
gulp.task('default', ['dist']);

/**
 * Builds the dist files
 */
gulp.task('dist', [
  'clean',
  'build-js',
  'build-css',
  'build-pages',
  'sync',
]);

/**
 * Dev on the examples
 */
gulp.task('dev', [
  'build-examples',
  'build-pages',
  'dependencies',
  'watch',
]);

/**
 * Runs the tests
 */
gulp.task('test', function() {});

////////////////////////////////////////////////////////////////////////////////
// JS
////////////////////////////////////////////////////////////////////////////////

gulp.task('build-js', function() {

  // dev version
  gulp.src('src/js/*.js')
    .pipe(header(banner, packageConfig))
    .pipe(rename(function(path) {
      path.basename = 'jquery.' + path.basename;
    }))
    .pipe(gulp.dest(paths.distribution));

  // min version
  gulp.src('src/js/*.js')
    .pipe(rename(function(path) {
      path.basename = 'jquery.' + path.basename;
      path.extname = '.min.js';
    }))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(header(banner, packageConfig))
    .pipe(gulp.dest(paths.distribution));

});

////////////////////////////////////////////////////////////////////////////////
// CSS
////////////////////////////////////////////////////////////////////////////////

gulp.task('build-css', function() {

  gulp.src('src/css/*.styl')
    .pipe(stylus({
      use: [nib()],
      compress: false,
    }))
    .pipe(header(banner, packageConfig))
    .pipe(rename(function(path) {
      path.extname = '.css';
    }))
    .pipe(gulp.dest(paths.distributionCss));

});

////////////////////////////////////////////////////////////////////////////////
// EXAMPLES
////////////////////////////////////////////////////////////////////////////////

gulp.task('build-examples', function() {

  gulp.src('src/examples/*.dot', {read: false})
    .pipe((function() {
      return through.obj(function(file, enc, cb) {
        template(file.path, {}, function(err, result) {
          if (err) {
            return cb(err);
          }

          file.contents = new Buffer(result);
          cb(null, file);
        });
      });
    })())
    .pipe(rename(function(path) {
      path.extname = '.html';
    }))
    .pipe(gulp.dest(paths.examples));

  gulp.src('src/examples/*.styl')
    .pipe(stylus({
      use: [nib()],
      compress: false,
    }))
    .pipe(rename(function(path) {
      path.extname = '.css';
    }))
    .pipe(gulp.dest(paths.examples));
});

////////////////////////////////////////////////////////////////////////////////
// PAGES
////////////////////////////////////////////////////////////////////////////////

/**
 * Build the public pages from the docs and examples
 */
gulp.task('build-pages', function() {

});

////////////////////////////////////////////////////////////////////////////////
// CLEAN
////////////////////////////////////////////////////////////////////////////////

gulp.task('clean', ['clean-dist', 'clean-examples', 'clean-pages']);

/**
 * Cleans the distribution folder
 */
gulp.task('clean-dist', function() {
  return gulp.src(path.join(paths.distribution, '*'), {read: false})
    .pipe(clean({force: true}));
});

/**
 * Cleans the examples
 */
gulp.task('clean-examples', function() {
  return gulp.src(path.join(paths.examples, '*'), {read: false})
    .pipe(clean({force: true}));
});

/**
 * Cleans the pages
 */
gulp.task('clean-pages', function() {
  return gulp.src(path.join(paths.pages, '*'), {read: false})
    .pipe(clean({force: true}));
});

////////////////////////////////////////////////////////////////////////////////
// VERSIONING
////////////////////////////////////////////////////////////////////////////////

gulp.task('sync', function() {
  gulp.src('bower.json')
    .pipe(sync())
    .pipe(gulp.dest('.'));
});

////////////////////////////////////////////////////////////////////////////////
// DEVELOPMENT
////////////////////////////////////////////////////////////////////////////////

gulp.task('dependencies', ['bower']);

gulp.task('bower', function() {
  return bower()
    .pipe(gulp.dest(paths.depencencies));
});

/**
 * Watch for development
 */
gulp.task('watch', function() {
  gulp.watch('src/examples/*', ['build-examples']);
  gulp.watch('src/css/*.styl', ['build-css']);
  gulp.watch('src/js/*.js', ['build-js']);
});
