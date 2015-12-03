var gulp = require('gulp'),
    watch = require('gulp-watch'),
    server = require( 'gulp-develop-server');

gulp.task('server:start', function() {
    server.listen( { path: './server.js' } );
});

gulp.task('server:restart', function() {
    gulp.watch( [ './*.js', './workers/*.js', './helpers/*.js' ], server.restart );
});

gulp.task('default', ['server:start', 'server:restart']);