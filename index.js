var events = require('events')
var inherits = require('inherits')
var stream = require('readable-stream')
var status = require('http-status')

module.exports = BrowserServer

function BrowserServer () {
  if (!(this instanceof BrowserServer)) return new BrowserServer()
  events.EventEmitter.call(this)

  if (navigator.serviceWorker) {
    this._start()
  }
}

inherits(BrowserServer, events.EventEmitter)

BrowserServer.prototype._start = function () {
  var streams = []
  var self = this

  function onopen (e) {
    var ws = new stream.Writable()
    var headers = {}
    var first = true

    ws._callback = null
    ws._pending = null
    ws._wants = false

    ws.statusCode = 200

    ws.setHeader = function (name, val) {
      headers[name] = val
    }

    ws.getHeader = function (name, val) {
      return headers[name]
    }

    ws.on('finish', function () {
      ws._write(null, null, function () {})
    })

    ws._write = function (data, enc, cb) {
      if (first) {
        first = false
        navigator.serviceWorker.controller.postMessage({
          id: e.data.id,
          status: ws.statusCode,
          statusText: status[ws.statusCode],
          headers: headers
        })
      }

      if (ws._wants) {
        ws._wants = false

        var m = {
          id: e.data.id,
          data: data
        }

        navigator.serviceWorker.controller.postMessage(m)
        cb()
        return
      }

      ws._pending = data
      ws._callback = cb
    }

    streams[e.data.id] = ws
    self.emit('request', e.data, ws)
  }

  navigator.serviceWorker.addEventListener('message', function (e) {
    if (e.data.type === 'open') {
      onopen(e)
      return
    }

    var ws = streams[e.data.id]

    if (ws._callback) {
      var data = ws._pending
      var cb = ws._callback

      ws._pending = ws._callback = null

      var m = {
        id: e.data.id,
        data: data
      }

      navigator.serviceWorker.controller.postMessage(m)
      cb()
      return
    }

    ws._wants = true
  })

  navigator.serviceWorker.register('/worker.js').then(function () {
    return navigator.serviceWorker.ready
  }).then(function() {
    if (!navigator.serviceWorker.controller) {
      console.error('Service worker registered, Reload the browser')
      console.error('If you know how to avoid this open a PR on https://github.com/mafintosh/browser-server and help me')
      return
    }
    self.emit('ready')
  })
}
