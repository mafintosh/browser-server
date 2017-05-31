#!/usr/bin/env node

var fs = require('fs')
var parseArgs = require('minimist')

var src = fs.readFileSync(__dirname + '/worker.js', 'utf-8')
var argv = parseArgs(process.argv)

// Prefix as argument
if (argv['_'][2]) { 
  src = src.replace('/browser-server/', process.argv[2])
}

// --prefix
if (argv['prefix']) { 
  src = src.replace('/browser-server/', argv['prefix'])
}

// --exclude
var exclude = argv['exclude'] || []
if (!(exclude instanceof Array)) {
  exclude = [exclude]
}
src = src.replace('{{exclude}}', JSON.stringify(exclude))

process.stdout.write(src)
