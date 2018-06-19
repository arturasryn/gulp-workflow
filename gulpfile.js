const gulp         = require('gulp'),

      assets       = require('postcss-assets'),
      autoprefixer = require('autoprefixer'),
      babel        = require('gulp-babel'),
      browserSync  = require('browser-sync').create();
      concat       = require('gulp-concat'),
      cssnano      = require('cssnano'),
      del          = require('del'),
      deporder     = require('gulp-deporder'),
      htmlclean    = require('gulp-htmlclean'),
      imagemin     = require('gulp-imagemin'),
      mqpacker     = require('css-mqpacker'),
      newer        = require('gulp-newer'),
      nunjucks     = require('gulp-nunjucks'),
      path         = require('path'),
      postcss      = require('gulp-postcss'),
      sass         = require('gulp-sass'),
      sourcemaps   = require('gulp-sourcemaps'),
      uglify       = require('gulp-uglify'),

      config       = require('./config.json'),
      folder       = config.folder,
      settings     = config.env === 'production' ? config.prod : config.dev;

gulp.task('images', () =>
    gulp.src(folder.src + 'images/**/*')
        .pipe(newer(folder.build + 'images/'))
        .pipe(imagemin(config.imagemin))
        .pipe(gulp.dest(folder.build + 'images/'))
        .pipe(browserSync.stream())
);

gulp.task('html', ['images'], () => {
    let out  = folder.build,
        page = gulp.src(folder.src + '*.html')
                   // .pipe(newer(out))
                   .pipe(nunjucks.compile());

    if (settings.minifyHtml) {
        page = page.pipe(htmlclean());
    }

    return page.pipe(gulp.dest(out))
               .pipe(browserSync.stream());
});

gulp.task('js', () => {
    let jsbuild = gulp.src(folder.src + 'js/**/*')
                      .pipe(deporder())
                      .pipe(sourcemaps.init())
                      .pipe(babel(config.babel))
                      .pipe(concat('main.js'))


    if (settings.minifyJs) {
        jsbuild = jsbuild.pipe(uglify());
    }

    return jsbuild.pipe(sourcemaps.write('.'))
                  .pipe(gulp.dest(folder.build + 'js/'))
                  .pipe(browserSync.stream());
});

gulp.task('css', ['images'], () => {
    let postCssOpts = [
        assets({ loadPaths: ['images/'] }),
        autoprefixer(config.autoprefixer),
        mqpacker
    ];

    if (settings.minifyCss) {
        postCssOpts.push(cssnano);
    }

    return gulp.src(folder.src + 'scss/*.scss')
               .pipe(sourcemaps.init())
               .pipe(sass(config.sass))
               .pipe(postcss(postCssOpts))
               .pipe(sourcemaps.write('.'))
               .pipe(gulp.dest(folder.build + 'css/'))
               .pipe(browserSync.stream());
});

gulp.task('watch', function() {
    browserSync.init(config.browserSync);

    gulp.watch('images/**/*', { cwd: folder.src }, ['images']);
    gulp.watch('**/*.html', { cwd: folder.src }, ['html']);
    gulp.watch('js/**/*', { cwd: folder.src }, ['js']);
    gulp.watch('scss/**/*', { cwd: folder.src }, ['css']);

    gulp.watch('**/*', { cwd: folder.src }).on('change', (event) => {
        if(event.type === 'deleted') {
            let filePathFromSrc = path.relative(path.resolve(folder.src), event.path),
                destFilePath    = path.resolve(folder.build, filePathFromSrc);
            del.sync(destFilePath);
        }
    });
});

gulp.task('run', ['html', 'css', 'js']);
gulp.task('default', ['run', 'watch']);
