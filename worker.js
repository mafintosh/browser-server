var streams = []
var prefix = '/browser-server/'

self.addEventListener('message', function (e) {
  if (e.data.id === -1 && e.data.prefix) {
    prefix = e.data.prefix
    return
  }

  var s = streams[e.data.id]
  if (s.started) s.ondata(e.data)
  else s.onstart(e.data)
})

self.addEventListener('fetch', function (e) {
  var path = '/' + e.request.url.split('/').slice(3).join('/')
  if (path.indexOf(prefix) !== 0) return

  var headers = {}

  e.request.headers.forEach(function (val, name) {
    headers[name] = val
  })

  var p = self.clients.get(e.clientId).then(function (client) {
    if (!client) {
      return fetch(e.request)
    }

    return new Promise(function (resolve, reject) {
      var pulling = false
      var controller
      // var encoder = new TextEncoder()
      var rs
      var id = streams.indexOf(null)
      if (id === -1) id = streams.push(null) - 1

      var req = {
        id: id,
        started: false,
        onstart: function (data) {
          if (data.skip) {
            streams[id] = null
            resolve(fetch(e.request))
            return
          }

          req.started = true
          rs = new ReadableStream({
            pull: function (c) {
              if (pulling) return
              pulling = true
              controller = c
              client.postMessage({
                type: 'pull',
                id: id
              })
            },
            cancel: function () {
              console.log('was cancelled')
            }
          })

          resolve(new Response(rs, {status: data.status, headers: data.headers, statusText: data.statusText}))
        },
        ondata: function (data) {
          pulling = false
          if (!data.data) {
            controller.close()
            streams[id] = null
          } else {
            controller.enqueue(data.data)
          }
        },
        onerror: function () {
          if (rs) rs.cancel()
          else reject(new Error('Request failed'))
          streams[id] = null
        }
      }

      streams[id] = req
      client.postMessage({
        type: 'open',
        id: id,
        path: path,
        headers: headers
      })
    })
  })

  e.respondWith(p)
})
