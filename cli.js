#!/usr/bin/env node

var fs = require('fs')

var src = fs.readFileSync(__dirname + '/worker.js', 'utf-8')

if (process.argv[2]) {
  src = src.replace('/browser-server/', process.argv[2])
}

process.stdout.write(src)
