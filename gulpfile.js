var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

gulp.task('default', ['develop']);

gulp.task('develop', () => {
	nodemon({
		script: "server.js",
	});
});
