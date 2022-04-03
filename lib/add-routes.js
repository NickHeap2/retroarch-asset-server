const JSZip = require('jszip')
const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const util = require('util')
require('colors')

module.exports = {
  addRoutes
}

let baseGames = []
let baseFolder = ''
let coresDirs = ''
let verboseLogging = false

function resultDescriptionMapper (game) {
  return `${game.description}        [${game.manufacturer} ${game.year}]--${game.name}.zip`
}
function resultNameMapper (game) {
  return `${game.name} (${game.description})        [${game.manufacturer} ${game.year}].zip`
}
function resultYearMapper (game) {
  return `[${game.year}] ${game.description}        [${game.manufacturer}]--${game.name}.zip`
}
function resultManufacturerMapper (game) {
  return `[${game.manufacturer}] ${game.description}        [${game.year}]--${game.name}.zip`
}

function addRoutes (app, options) {
  baseGames = options.mameData.baseGames
  baseFolder = options.baseFolder
  coresDirs = options.coresDirs
  verboseLogging = options.verboseLogging

  // base index
  app.get('/assets/cores/.index-dirs', async (req, res) => {
    logReq(req)
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream'
    })
    res.end(coresDirs)
    logRes(res)
  })

  // first directories - redirect to path with slash
  app.get('/assets/cores/:corename', async (req, res) => {
    const coreName = req.params.corename

    logReq(req)

    res.redirect(301, `/assets/cores/${coreName}/`)
    logRes(res)
  })

  // serve the rom list up
  app.get('/assets/cores/:corename/.index', async (req, res) => {
    const coreName = req.params.corename

    logReq(req)

    res.writeHead(200, {
      'Content-Type': 'application/octet-stream'
    })

    const sortedList = getGameList(coreName)
    res.end(sortedList)

    logMessage(`Returning rom list for ${coreName}`)
    logRes(res)
  })

  // say there are no directories
  app.get('/assets/cores/:corename/.index-dirs', async (req, res) => {
    logReq(req)
    res.sendStatus(404)
    logRes(res)
  })

  // return the zip file wrapped in a directory
  app.get('/assets/cores/:corename/:gamename', async (req, res) => {
    logReq(req)

    const coreName = req.params.corename
    const gameName = req.params.gamename

    const gameEntry = gameGameFromDesc(coreName, gameName)
    const downloadFile = path.join(baseFolder, `${gameEntry.name}.zip`)
    logMessage(`Sending ROM ${downloadFile}`)

    const zipData = await getFileData(downloadFile)
    if (!zipData) {
      res.sendStatus(404)
      logRes(res)
      return
    }

    let biosData
    if (gameEntry.needsBios) {
      logMessage(`  Attaching BIOS ${gameEntry.needsBios}`)

      const downloadBiosFile = path.join(baseFolder, `${gameEntry.needsBios}.zip`)
      biosData = await getFileData(downloadBiosFile)
    }

    const zip = new JSZip()
    zip
      .folder('Arcade')
      .file(`${gameEntry.name}.zip`, zipData)

    // attach a bios file?
    if (biosData) {
      zip
        .folder('Arcade')
        .file(`${gameEntry.needsBios}.zip`, biosData)
    }

    const base64 = await zip.generateAsync({ type: 'base64' })

    const bufferData = Buffer.from(base64, 'base64')
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-disposition': `attachment; filename=${gameName}`
    })
    res.end(bufferData)
    logRes(res)
  })

  // catch any other routes
  app.get('*', async (req, res) => {
    logReq(req)
    console.error(`Missing handler for ${req.url}!`.red)

    res.sendStatus(404)
    logRes(res)
  })
}

async function getFileData (fileName) {
  try {
    await fsPromises.access(fileName, fs.constants.R_OK)
  } catch (error) {
    console.error(error.message.red)
    return undefined
  }

  let zipData
  try {
    zipData = await fsPromises.readFile(fileName)
  } catch (error) {
    console.error(error.message.red)
    return undefined
  }

  return zipData
}

function getGameList (coreName) {
  let sortedList
  switch (coreName) {
    case 'Arcade by Description':
      sortedList = baseGames
        .sort((a, b) => a.description > b.description)
        .map(resultDescriptionMapper).join('\n')
      break
    case 'Arcade by Manufacturer':
      sortedList = baseGames
        .sort((a, b) => a.manufacturer > b.manufacturer)
        .map(resultManufacturerMapper).join('\n')
      break
    case 'Arcade by ROM name':
      sortedList = baseGames
        .sort((a, b) => a.name > b.name)
        .map(resultNameMapper).join('\n')
      break
    case 'Arcade by Year':
      sortedList = baseGames
        .filter((game) => game.year !== '0')
        .sort((a, b) => a.year > b.year)
        .map(resultYearMapper).join('\n')
      break
  }

  return sortedList
}

function gameGameFromDesc (coreName, gameName) {
  let gameEntry
  switch (coreName) {
    case 'Arcade by Description':
      gameEntry = baseGames.find((game) => resultDescriptionMapper(game) === gameName)
      break
    case 'Arcade by Manufacturer':
      gameEntry = baseGames.find((game) => resultManufacturerMapper(game) === gameName)
      break
    case 'Arcade by ROM name':
      gameEntry = baseGames.find((game) => resultNameMapper(game) === gameName)
      break
    case 'Arcade by Year':
      gameEntry = baseGames.find((game) => resultYearMapper(game) === gameName)
      break
  }
  return gameEntry
}

function logReq (req) {
  if (!verboseLogging) {
    return
  }

  const logFormat = {
    headers: req.headers,
    url: req.url,
    method: req.method,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    params: req.params,
    query: req.query,
    body: req.body
  }
  console.log('REQ'.green)
  console.log(util.inspect(logFormat).yellow)
}

function logRes (res) {
  if (!verboseLogging) {
    return
  }

  const logFormat = {
    statusCode: res.statusCode,
    statusMessage: res.statusMessage
  }
  console.log('RES'.green)
  console.log(util.inspect(logFormat).yellow)
}

function logMessage (message) {
  console.log(`  ${message}`.blue)
}
