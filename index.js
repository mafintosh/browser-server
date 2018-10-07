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

      // wait until webstream is pulling to send data
      if (ws._wants) {
        sendChunk()
      } else {
        self.once('_wants', sendChunk)
      }

      function sendChunk () {
        ws._wants = false

        var m = {
          id: e.data.id,
          data: data
        }

        // Transfer memory to serviceWorker instead of cloning if possible
        if (data && data.buffer instanceof ArrayBuffer) {
          navigator.serviceWorker.controller.postMessage(m, [data.buffer])
        } else {
          navigator.serviceWorker.controller.postMessage(m)
        }

        cb()
      }
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
    ws._wants = true
    self.emit('_wants')
  })

  navigator.serviceWorker.register('/worker.js').then(function () {
    return navigator.serviceWorker.ready
  }).then(function (reg) {
    self.emit('ready')
  })
}
