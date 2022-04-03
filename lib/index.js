#!/usr/bin/env node
const { program } = require('commander')
const server = require('./server')
const { exit } = require('process')
const { existsSync } = require('fs')
require('colors')

const version = process.env.npm_package_version || require('../package.json').version

program
  .name('retroarch-asset-server')
  .version(version)
  .requiredOption('-d, --dat-file <datfile>', 'MAME dat file to serve')
  .requiredOption('-r, --rom-folder <romfolder>', 'ROM folder for roms defined in dat file')
  .option('-p, --port <port>', 'Port for server to listen on', 5050)
  .option('-v, --verbose', 'Verbose logging', false)
program.parse(process.argv)
const options = program.opts()

// check if dat file exists
if (!existsSync(options.datFile)) {
  console.error(`Dat file ${options.datFile} does not exist!`.red)
  exit(1)
}

// check if rom folder exists
if (!existsSync(options.romFolder)) {
  console.error(`ROM folder ${options.romFolder} does not exist!`.red)
  exit(1)
}

const serverOptions = {
  mameDatFile: options.datFile,
  baseFolder: options.romFolder,
  serverPort: options.port,
  verboseLogging: options.verbose
}

console.log(`RetroArch Asset Server (${version}) starting...`.green)
server.startServer(serverOptions)
