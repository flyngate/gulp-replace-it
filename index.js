'use strict';

var through = require('through2');
var Readable = require('stream').Readable;

var PLUGIN_NAME = 'gulp-replace-it';


function warn(msg) {
  console.log(PLUGIN_NAME + ' warning: ' + mgs);
}

function objectCache() {
  var cache = [];
  return {
    add: function (o, value) {
      if (!this.find(o)) cache.push([o, value])
    },
    find: function (x) {
      var value;
      cache.forEach(function (y) {
        if (x == y[0]) value = y[1];
      });
      return value || null;
    }
  }
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

function buildPattern(template) {
  var match = template.match(/_/g);
  if (typeof template === 'string' && match && match.length === 1) {
    template = escapeRegExp(template.replace(/\s/g, ''));
    var i = template.indexOf('_');
    var before = template.slice(0, i);
    var after = template.slice(i+1, template.length);
    if (!before.match(/\w/) && !after.match(/\w/)) {
      return before + '[\t ]*([A-Za-z_]+)[\t ]*' + after;
    }
  }
  return null;
}

function matcher(template) {
  var pattern = buildPattern(template);
  if (!pattern) {
    return false;
  } else {
    return function(str) {
      return str.match(new RegExp(pattern));
    }
  }
}

module.exports = function(opts) {
  var replaceWith = opts.with;
  var placeholderTemplate = opts.placeholderTemplate || '{{ _ }}';
  var doMatch = matcher(placeholderTemplate);

  var stream = through.obj(function (file, enc, cb) {
    if (!doMatch) {
      cb('Invalid placeholder template: ' + placeholderTemplate);
    } else if (file.isStream()) {
      cb('Streams are not supported');
    } else if (file.isBuffer()) {
      var result = [];

      var contents = file.contents.toString(enc);
      contents.split('\n').forEach(function(line) {
        var match = doMatch(line);
        while (match) {
          result.push(line.slice(0, match.index));
          result.push(replaceWith[match[1]] || match[0]);
          line = line.slice(match.index + match[0].length);
          match = doMatch(line);
        }
        result.push(line);
      });

      var streamCache = objectCache();

      result = result.map(function (x) {
        if (x instanceof Readable) {
          var streamContent = streamCache.find(x);
          if (!streamContent) {
            streamContent = x.read();
            streamCache.add(x, streamContent);
          }
          x = streamContent;
        }

        if (typeof x === 'string') {
          x = new Buffer(x, enc);
        }

        return x;
      }).filter(function (x) {
        if (!Buffer.isBuffer(x)) {
          warn('non-buffer object, ignoring');
          return false;
        }
        return true;
      });

      file.contents = Buffer.concat(result)
      cb(null, file);
    } else {
      cb('File is neither buffer nor stream');
    }
  });

  return stream;
}

// for testing purposes
module.exports[Symbol.for('matcher')] = matcher;
