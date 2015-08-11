var gulp = require('gulp');
var ts = require('gulp-typescript');
var replace = require('gulp-replace'); 
var merge = require('merge2');
var mocha = require('gulp-spawn-mocha');
var concat = require('gulp-concat');

var tsProject = ts.createProject('tsconfig.json', { sortOutput: true });

var REF_REGEXP = /^\/\/\/\s*<reference\s+path=['"].*['"]\s*\/>\s*$/gm;
var IMPORT_REGEXP = /^import\s+.*\;$/gm;  
var EXPORT_DECLARE_REGEXP = /^export\s+declare\s+module\s+.*\s*{/gm;
var DTS_BUILD_START_REGEXP = /\/\*\* #dts-build/gm
var DTS_BUILD_END_REGEXP = /#dts-build \*\//gm

gulp.task('build', function() {

    //build conactinated version of source
    //no module and node exports
    
    var tsResult =  tsProject.src()
        .pipe(ts(tsProject));

    return merge([
        tsResult.js
        .pipe(replace(REF_REGEXP, ''))
        .pipe(concat('index.js'))
        .pipe(gulp.dest('dist')),           
        tsResult.dts
        .pipe(replace(REF_REGEXP, ''))
        .pipe(replace(IMPORT_REGEXP, ''))
        .pipe(replace(DTS_BUILD_START_REGEXP, ''))
        .pipe(replace(DTS_BUILD_END_REGEXP, ''))
        .pipe(replace(EXPORT_DECLARE_REGEXP, 'declare module "da-rabbitmq-rx" {'))
        .pipe(concat('index.d.ts'))
        .pipe(gulp.dest('dist'))
    ]);        
});

gulp.task('build:module', ['build'], function() {
    
    //build module version from `conactinated` version
    /*
    gulp.src("dist/index.d.ts")
    .pipe(replace('//', build))
    .pipe(replace(EXPORT_DECLARE_REGEXP, 'export '))
    .pipe(concat('index.d.ts'))
    .pipe(gulp.dest('dist'));
    */    
})

gulp.task('default', ['build:module'], function() {
  gulp.watch("src/**.ts", ['build:module']);
});


gulp.task('test',  function () {
    return gulp.src('test/**.js')
        .pipe(mocha());
});