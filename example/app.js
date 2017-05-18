var createServer = require('browser-server')
var server = createServer()

server.on('request', function (req, res) {
  console.log('intercepting request', req)
  res.end('hello world')
})

server.on('ready', function () {
  fetch('/demo/test.txt').then(function (r) {
    return r.text()
  }).then(function (txt) {
    console.log('fetch returned', txt)
  })
})
