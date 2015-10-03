var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function() {
  return gulp.src(['./src/HttpOfflineCache.js', './src/HttpOfflineCacheStorage.js'])
      .pipe(sourcemaps.init())
      .pipe(concat('HttpOfflineCache.min.js'))
      .pipe(uglify())
      .pipe(sourcemaps.write('.', {includeContent: false, sourceRoot: '../../js'}))
      .pipe(gulp.dest('./dist/'));
});