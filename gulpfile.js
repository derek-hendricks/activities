const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const amdOptimize = require('amd-optimize');

gulp.task('bundle', function ()
{
return gulp.src('./public/javascripts/**/*.js')
  .pipe(amdOptimize('/public/javascripts/main.js'))
  .pipe(concat('main-bundle.js'))
  .pipe(gulp.dest('dist'));
});

// gulp.task('compress', function() {
//   return gulp.src('./js/**/*.js')
//     .pipe(concat('main.js'))
//     .pipe(uglify())
//     .pipe(gulp.dest('./dist/'));
// });

// return gulp.src('**/*.js')