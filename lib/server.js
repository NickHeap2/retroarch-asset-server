const express = require('express')
const cors = require('cors')
const routes = require('./add-routes')
const mameDataParser = require('./mame-data-parser')
require('colors')

module.exports = {
  startServer
}

async function startServer (options) {
  if (options.verboseLogging) {
    console.log('  Verbose logging is on'.blue)
  }

  const app = express()
  app.use(cors())

  console.log(`Parsing ${options.mameDatFile} for ROM details...`.green)
  const mameData = await mameDataParser.parseDatFile(options.mameDatFile)
  console.log(`  Found ${mameData.baseGames.length} base ROMs...`.blue)
  console.log(`  Found ${mameData.bios.length} BIOS ROMs...`.blue)

  const routeOptions = {
    // coresDirs: 'Arcade\n',
    coresDirs: 'Arcade by Description\nArcade by Manufacturer\nArcade by ROM name\nArcade by Year\n',
    baseFolder: options.baseFolder,
    mameData,
    verboseLogging: options.verboseLogging
  }
  routes.addRoutes(app, routeOptions)

  console.log(`  Serving ROMs from ${options.baseFolder}`.blue)

  console.log(`Listening on http://localhost:${options.serverPort}...`.green)
  app.listen(options.serverPort)
}
