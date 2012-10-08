var appName = 'backbone',       // Change this to your app name.
    sourceDir = 'src';   // Change this to... uh, your source directory.


var http = require('http'),
    fs = require('fs'),
    exec = require('child_process').exec,
    port = 3000,
    rootUrl = 'http://localhost:' + port,
    server,
    types;

types = {
  js: 'application/javascript',
  json: 'application/json',
  html: 'text/html',
  css: 'text/css',

  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  ico: 'image/x-icon',
};

server = http.createServer(function (req, res) {
  if (req.url.match(/^\/build[\/\w]*\.?\w*$/)) {
    exec('.' + req.url, {maxBuffer: 1024*1024}, function(err, stdout) {
      if (err) return notFound(err, req.url, res);
      res.writeHead(200, {'Content-Type': 'application/javascript'});
      res.end(stdout);
    });
  } else {
    findFile(req.url, function(err, fileBufferOrText, path) {
      if (err) return notFound(err, req.url, res);
      var ext = path.split('.').pop();
      if (ext === path) ext = 'html';
      var type = types[ext];
      if (!type) type = 'text/plain';
      if (path.match(new RegExp('^/' + sourceDir + '/'))) {
        fileBufferOrText = nodeWrap(path, fileBufferOrText);
      }
      res.writeHead(200, {'Content-Type': type});
      res.end(fileBufferOrText);
    });
  }
});

server.listen(port, 'localhost');
console.log('Serving ' + rootUrl);
server.on('error', console.log);

function notFound(err, path, res) {
  if (err !== true) console.log(err);
  if (!path.match(/favicon\.ico/)) console.log('404: ' + path);
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.end('404 Not Found\n');
}

function findFile(path, callback, lastCheck) {
  fs.stat('.' + path, function(err, stats) {
    if (err) {
      if (lastCheck) return callback(true);
      var re = /\/(\w*)\.js$/,
          match = re.exec(path);
      if (!match) return callback(true);
      var dir = match[1],
          replace = '/' + (dir ? dir + '/' : '') + 'index.js';
      findFile(path.replace(re, replace), callback, true);
      return;
    }

    if (stats.isDirectory()) {
      findFile(path + '/index.html', callback, true);
      return;
    }

    fs.readFile('.' + path, function(err, buffer) {
      callback(err, buffer, path);
    });
  });
}

function nodeWrap(path, buffer) {
  var prefix = new RegExp('^' + sourceDir + '/'),
      module = path.slice(1).replace(prefix, '').replace(/\.js$/, ''),
      fullModule = appName + '/' + module,
      compiled;
  if (module === 'index') fullModule = appName;
  compiled = 'define("' + fullModule + '", function(require, exports, module) {\n';
  compiled += buffer.toString('utf8');
  compiled += '\n});';
  return compiled;
}
