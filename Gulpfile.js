var gulp = require('gulp');
var requirejs = require('gulp-requirejs');
var uglify = require('gulp-uglify');
var runSequence = require('run-sequence');
var rename = require('gulp-rename');

gulp.task('requirejs', function() {
	return requirejs({
		baseUrl: 'public/res',
		name: 'main',
		out: 'main.js',
		mainConfigFile: 'public/res/main.js',
		// optimize: 'uglify2', // 压缩
		inlineText: true,
		paths: {
			mathjax: 'empty:'
		},
		excludeShallow: [
			'css/css-builder',
			'less/lessc-server',
			'less/lessc'
		]
	})
	
	.pipe(rename({ suffix: '-v2' }))
	.pipe(gulp.dest('./public/res-min/'))

	// 压缩
	.pipe(uglify({
		output: {
			beautify: false,
			indent_level: 1
		}
	}))
	.pipe(rename({ suffix: '.min' }))
	.pipe(gulp.dest('./public/res-min/'));
});

gulp.task('minify',function() {
	return gulp.src('./public/res-min/main-v2.js')
	.pipe(uglify({
		output: {
			beautify: false,
			indent_level: 1
		}
	}))
	.pipe(rename({ suffix: '.min' }))
	.pipe(gulp.dest('./public/res-min/'));
});

gulp.task('default', function(cb) {
	runSequence('requirejs');
});