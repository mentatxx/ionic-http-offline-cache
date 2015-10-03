var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

gulp.task('default', function() {
  return gulp.src(['./src/HttpOfflineCache.js', './src/HttpOfflineCacheStorage.js'])
      .pipe(concat('HttpOfflineCache.min.js'))
      .pipe(uglify())
      .pipe(gulp.dest('./dist/'));
});