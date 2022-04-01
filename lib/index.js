const express = require('express')
const cors = require('cors')
const routes = require('./add-routes')
const mameDataParser = require('./mame-data-parser')
require('colors')

const app = express()
app.use(cors())

const mameDatFile = './MAME 078.dat'
const coresDirs = 'Arcade\n'
const baseFolder = './roms'

const options = {
  coresDirs,
  baseFolder
}

console.log(`Parsing ${mameDatFile} for ROM details...`.green)
mameDataParser.parseDatFile(mameDatFile)
  .then((mameData) => {
    console.log(`  Found ${mameData.baseGames.length} ROM details...`.blue)
    options.mameData = mameData
    routes.addRoutes(app, options)

    console.log('Listening on http://localhost:5050...'.green)
    app.listen(5050)
  })
