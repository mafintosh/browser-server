# browser-server

A HTTP "server" in the browser that uses a service worker to allow you to easily send back your own stream of data.

```
npm install browser-server
```

## Usage

First generate the service worker, using the browser-server command line tool

```
npm install -g browser-server
# /demo is the prefix you want to intercept
browser-server /demo > worker.js
```

Then create a simple app and browserify it

``` js
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
```

Then browserify this app

```
browserify app.js > bundle.js
```

And make a index.html page like this


``` html
<!DOCTYPE html>
<html>
<body>
<script src="bundle.js"></script>
</body>
</html>
```

Make sure the worker.js file is also stored in the same folder.

Now serve the folder using a http server, fx

```
npm install -g http-server
http-server .
```

Now if you open index.html you should see the server intercepting the request and returning hello world.

Works for all http apis, including video/audio tags!

## License

MIT
