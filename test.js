'use strict';

var File = require('gulp-util').File;
var should = require('should');
var replace = require('.');

function streamFromString(str) {
  var stream = new require('stream').Readable({
    read: function () {}
  });
  stream.push(str);
  stream.push(null);
  return stream;
}

function makeFile(contents) {
  if (typeof contents === 'string') {
    contents = new Buffer(contents);
  }
  return new File({
    contents: contents
  });
}


describe('matcher', function () {
  var data = {
    '{{ _ }}': {
      ok: ['{{thing}}', '{{ thing}}', '{{thing }}', '{{ \t thing  }}'],
      error: ['{{}}', '{{ . }}', '{{ \n thing }}', '{{ thing thing }}']
    },
    '<_>': {
      ok: ['< thing >', '< thing > <thing> ']
    }
  };

  var matcher = replace[Symbol.for('matcher')];

  Object.keys(data).forEach(function(template) {
    var match = matcher(template);

    var test = function (key, msg, assert) {
      (data[template][key] || []).forEach(function (placeholder) {
        it(msg + ' ' + placeholder, function() {
          assert(match(placeholder));
        });
      });
    };

    test('ok', 'should match', function (x) { should(x).be.ok() });
    test('error', 'should not match', function (x) { should(x).not.be.ok() });
  });

  it('fails for invalid template', function () {
    matcher('a_a').should.not.be.ok();
  });
});

describe('replace({ ... })', function () {
  var test = function (stream, input, expected) {
    var file = makeFile(input);

    stream.on('data', function (newFile) {
      var result = newFile.contents;
      should(Buffer.isBuffer(result)).be.true();
      should(result.toString()).be.exactly(expected);
    });

    stream.write(file);
    stream.end();
  }

  var replacement = 'fucking';
  var fuckingTest = function (src) {
    var stream = replace({
      with: {
        thing: src
      }
    });

    var input = 'hello {{ thing }} world';
    var expected = input.replace('{{ thing }}', replacement);
    test(stream, input, expected);
  }

  it('should work with strings', function () {
    fuckingTest(replacement);
  });

  it('should work with streams', function () {
    fuckingTest(streamFromString(replacement));
  });

  it('should work with buffers', function () {
    fuckingTest(new Buffer(replacement, 'utf8'))
  });

  it('should properly replace placeholders like $ _ $', function () {
    var stream = replace({
      placeholderTemplate: '$ _ $',
      with: {
        one: 'hey',
        two: 'hello'
      }
    });

    test(stream, '$ one $ two $ two $', 'hey two hello')
  });

  it('should insert one stream into several places', function () {
    var src = streamFromString('blah');
    var stream = replace({
      with: {
        one: src,
        two: src
      }
    });

    test(stream, '{{ one }} and {{ two }}', 'blah and blah');
  });

  it('should process multiline input', function () {
    var stream = replace({
      with: {
        thing: 'hello'
      }
    });

    test(stream, '  {{ thing }}  \n  {{thing}}', '  hello  \n  hello')
  });

  it('should work as through stream without arguments', function () {
    var stream = replace();

    test(stream, '\n\n\n\n', '\n\n\n\n');
  })
});
