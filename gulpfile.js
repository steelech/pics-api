var gulp = require('gulp');
var spawn = require('child_process').spawn;
var nodemon = require('gulp-nodemon');

gulp.task('default', ['mongo', 'api']);

gulp.task('api', () => {
  nodemon({
    script: 'app.js',
    nodeArgs: ['--debug']
  });
});

gulp.task('mongo', () => {
  var mongoServer = spawn('mongod', ['--dbpath', 'data']);
  mongoServer.stdout.on('data', data => {
    console.log(data.toString());
  });
  mongoServer.stderr.on('data', data => {
    console.log('Error: ', data.toString());
  });
  mongoServer.on('exit', code => {
    console.log('mongo server process exited with status ' + code.toString());
  });
});
