var _ = require('lodash');
var bower = require('gulp-bower');
var clean = require('gulp-clean');
var gulp = require('gulp');
var header = require('gulp-header');
var markdown = require('gulp-markdown');
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

  examples: 'dist/examples',
  docs: 'dist/docs',
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
gulp.task('default', ['dev']);

////////////////////////////////////////////////////////////////////////////////
// CLEAN
////////////////////////////////////////////////////////////////////////////////

gulp.task('clean-dist', function() {
  return gulp.src([
    path.join(paths.distribution, '*.js'),
  ], {read: false})
    .pipe(clean());
});

gulp.task('clean-dist-css', function() {
  return gulp.src([
    path.join(paths.distributionCss, '*.css'),
  ], {read: false})
    .pipe(clean());
});

gulp.task('clean-examples', function() {
  return gulp.src([
    path.join(paths.examples, '*'),
  ], {read: false})
    .pipe(clean());
});

gulp.task('clean-docs', function() {
  return gulp.src([
    path.join(paths.docs, '*'),
  ], {read: false})
    .pipe(clean());
});

////////////////////////////////////////////////////////////////////////////////
// Test
////////////////////////////////////////////////////////////////////////////////

gulp.task('test', function() {});

////////////////////////////////////////////////////////////////////////////////
// JS
////////////////////////////////////////////////////////////////////////////////

gulp.task('build-js', ['clean-dist', 'build-js-dev', 'build-js-min']);

gulp.task('build-js-dev', function() {
  return gulp.src('src/js/*.js')
    .pipe(header(banner, packageConfig))
    .pipe(rename(function(path) {
      path.basename = 'jquery.' + path.basename;
    }))
    .pipe(gulp.dest(paths.distribution));
});

gulp.task('build-js-min', function() {
  return gulp.src('src/js/*.js')
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

gulp.task('build-css', ['clean-dist-css'], function() {
  return gulp.src('src/css/*.styl')
    .pipe(stylusWork())
    .pipe(header(banner, packageConfig))
    .pipe(rename(function(path) {
      path.extname = '.css';
    }))
    .pipe(gulp.dest(paths.distributionCss));
});

function stylusWork() {
  return stylus({
    use: [nib()],
    compress: false,
  });
}

////////////////////////////////////////////////////////////////////////////////
// EXAMPLES
////////////////////////////////////////////////////////////////////////////////

gulp.task('build-examples', ['clean-examples', 'build-examples-html', 'build-examples-css']);

gulp.task('build-examples-html', function() {
  return gulp.src(
    [
      'src/examples/*.dot',
      '!src/examples/_example.dot',
    ],
    {read: false}
  )
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
});

gulp.task('build-examples-css', function() {
  return gulp.src('src/examples/*.styl')
    .pipe(stylusWork())
    .pipe(rename(function(path) {
      path.extname = '.css';
    }))
    .pipe(gulp.dest(paths.examples));
});

////////////////////////////////////////////////////////////////////////////////
// DOCS
////////////////////////////////////////////////////////////////////////////////

gulp.task('build-docs', ['clean-docs', 'build-docs-html', 'build-docs-css']);

gulp.task('build-docs-html', function() {
  return gulp.src(['docs/*.md'])
    .pipe(markdown())
    .pipe((function() {
      return through.obj(function(file, enc, cb) {

        var layoutPath = path.join(
          'src/docs',
          '_' + file.relative.replace('.html', '.dot')
        );

        template(
          layoutPath,
          {
            title: 'Test',
            body: String(file.contents),
            toc: '',
          },
          function(err, result) {
            if (err) {
              return cb(err);
            }

            file.contents = new Buffer(result);
            cb(null, file);
          }
        );
      });
    })())
    .pipe(gulp.dest(paths.docs));
});

gulp.task('build-docs-css', function() {
  return gulp.src('src/docs/*.styl')
    .pipe(stylusWork())
    .pipe(rename(function(path) {
      path.extname = '.css';
    }))
    .pipe(gulp.dest(paths.docs));
});

////////////////////////////////////////////////////////////////////////////////
// DEPENDENCIES
////////////////////////////////////////////////////////////////////////////////

gulp.task('dependencies', ['bower']);

gulp.task('bower', function() {
  return bower();
});

////////////////////////////////////////////////////////////////////////////////
// VERSIONING
////////////////////////////////////////////////////////////////////////////////

gulp.task('sync', function() {
  return gulp.src('bower.json')
    .pipe(sync())
    .pipe(gulp.dest('.'));
});

////////////////////////////////////////////////////////////////////////////////
// DEVELOPMENT
////////////////////////////////////////////////////////////////////////////////

gulp.task('watch', function() {
  gulp.watch('src/examples/*', ['build-examples']);
  gulp.watch('src/css/*.styl', ['build-css']);
  gulp.watch('src/js/*.js', ['build-js']);

  gulp.watch('docs/*', ['build-docs']);
  gulp.watch('src/docs/*', ['build-docs']);
});

gulp.task('dev', [
  'build-examples',
  'build-docs',
  'dependencies',
  'watch',
]);

////////////////////////////////////////////////////////////////////////////////
// RELEASE
////////////////////////////////////////////////////////////////////////////////

gulp.task('release', [
  'dependencies',
  'build-js',
  'build-css',
  'build-docs',
  'build-examples',
  //'sync',
]);
