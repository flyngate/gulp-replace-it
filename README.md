# Installation

Install package with NPM and add it to your development dependencies:
```sh
npm install --save-dev gulp-replace-it
```

# Usage

```node
var replace = require('gulp-replace-it');

gulp.task('replace', function () {
    return gulp.src('./template.js')
        .pipe(replace({
            placeholderTemplate: '/* _ */',
            with: {
                token: 'hello world'
            }
        }))
        .pipe(gulp.dst('./result.js'));
});
```

Having the following `template.js`:

```
console.log(/* token */);
```

you'll get `console.log('hello world')` in your `result.js`.


`gulp-replace-it` also supports buffers and streams:

```node
var fs = require('fs');
var buffer = fs.readFileSync('./license');
var stream = gulp.src('./inner.js');

gulp.src('./template.js')
    .pipe(replace({
        with: {
            license: buffer,
            code: stream
        }
    })
    .pipe(gulp.dst('./result.js'));
```

`license`:

```node
/* MIT LICENSE */
```

`inner.js`:

```node
console.log('hello world');
```

`template.js`:

```node
{{ license }}
function main() {
    {{ code }}
}
main();
```

`result.js`:

```node
/* MIT LICENSE */
function main() {
    console.log('hello world');
}
main();
```

# Options

- `placeholderTemplate` _optional_
    A pattern for placeholder. Can't contain alphabetical characters.
    Examples: `/* _ */`, `# _ #`, `// _ \\`.
    `{{ _ }}` is default value.

- `with`
    an object that stores token/data mapping .

# License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
