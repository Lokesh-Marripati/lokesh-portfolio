// node.js Packages / Dependencies
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const clean = require('gulp-clean');

// Dynamic imports for ESM modules
const loadImagemin = async () => (await import('gulp-imagemin')).default;
const loadJpegtran = async () => (await import('imagemin-jpegtran')).default;
const loadPngquant = async () => (await import('imagemin-pngquant')).default;
const loadGifsicle = async () => (await import('imagemin-gifsicle')).default;

// Paths
var paths = {
    root: { 
        www: './public_html'
    },
    src: {
        root: 'public_html/assets',
        html: 'public_html/**/*.html',
        css: 'public_html/assets/css/*.css',
        js: 'public_html/assets/js/*.js',
        vendors: 'public_html/assets/vendors/**/*.*',
        imgs: 'public_html/assets/imgs/**/*.+(png|jpg|gif|svg)',
        scss: 'public_html/assets/scss/**/*.scss'
    },
    dist: {
        root: 'public_html/dist',
        css: 'public_html/dist/css',
        js: 'public_html/dist/js',
        imgs: 'public_html/dist/imgs',
        vendors: 'public_html/dist/vendors'
    }
}

// Copy HTML to dist
gulp.task('copy-html', function() {
    return gulp.src(paths.src.html)
    .pipe(gulp.dest(paths.dist.root));
});

// Compile SCSS and move to dist
gulp.task('sass', function() {
    return gulp.src(paths.src.scss)
    .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError)) 
    .pipe(autoprefixer())
    .pipe(gulp.dest(paths.dist.css))
    .pipe(browserSync.stream());
});

// Minify + Combine CSS
gulp.task('css', function() {
    return gulp.src(paths.dist.css + '/*.css')
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(concat('johndoe.css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.dist.css))
    .pipe(browserSync.stream());
});

// Minify + Combine JS
gulp.task('js', function() {
    return gulp.src(paths.src.js)
    .pipe(uglify())
    .pipe(concat('johndoe.js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.dist.js))
    .pipe(browserSync.stream());
});

// Compress images
gulp.task('img', async function() {
    try {
        const imagemin = await loadImagemin();
        const jpegtran = await loadJpegtran();
        const pngquant = await loadPngquant();
        const gifsicle = await loadGifsicle();

        return gulp.src(paths.src.imgs)
        .pipe(imagemin([
            gifsicle({ interlaced: true }),
            jpegtran({ progressive: true }),
            pngquant({ quality: [0.6, 0.8] }),
            imagemin.svgo()
        ]))
        .pipe(gulp.dest(paths.dist.imgs));
    } catch (err) {
        console.error('Image compression failed:', err);
    }
});

// Copy vendors to dist
gulp.task('vendors', function(){
    return gulp.src(paths.src.vendors)
    .pipe(gulp.dest(paths.dist.vendors))
});

// Clean dist
gulp.task('clean', function () {
    return gulp.src(paths.dist.root, { allowEmpty: true, read: false })
        .pipe(clean());
});

// Prepare all assets for production
gulp.task('build', gulp.series('clean', 'sass', 'css', 'js', 'vendors', 'img', 'copy-html'));

// Watch for changes and reload
gulp.task('watch', function() {
    browserSync.init({
        server: {
            baseDir: paths.dist.root
        } 
    });
    gulp.watch(paths.src.scss, gulp.series('sass', 'css'));
    gulp.watch(paths.src.js, gulp.series('js'));
    gulp.watch(paths.src.html, gulp.series('copy-html')).on('change', browserSync.reload);
});

// Default task
gulp.task('default', gulp.series('build', 'watch'));
