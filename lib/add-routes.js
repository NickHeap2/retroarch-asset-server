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

function resultNameMapper (game) {
  return `${game.description}        [${game.manufacturer}${game.year ? ' ' + game.year : ''}]--${game.name}.zip`
}

function addRoutes (app, options) {
  baseGames = options.mameData.baseGames
  baseFolder = options.baseFolder
  coresDirs = options.coresDirs

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
    logReq(req)

    const coreName = req.params.corename

    res.redirect(301, `/assets/cores/${coreName}/`)
    logRes(res)
  })

  // serve the rom list up
  app.get('/assets/cores/:corename/.index', async (req, res) => {
    logReq(req)

    res.writeHead(200, {
      'Content-Type': 'application/octet-stream'
    })
    res.end(baseGames.map(resultNameMapper).join('\n'))
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

    const gameName = req.params.gamename

    const zipName = baseGames.find((game) => resultNameMapper(game) === gameName).name + '.zip'
    const downloadFile = path.join(baseFolder, zipName)
    console.log(`Requested ROM is ${downloadFile}`.blue)

    try {
      await fsPromises.access(downloadFile, fs.constants.R_OK)
    } catch (error) {
      console.error(error.message.red)
      res.sendStatus(404)
      logRes(res)
      return
    }

    let zipData
    try {
      zipData = await fsPromises.readFile(downloadFile)
    } catch (error) {
      console.error(error.message.red)
      res.sendStatus(404)
      logRes(res)
      return
    }

    const zip = new JSZip()
    zip
      .folder('Arcade')
      .file(zipName, zipData)

    const base64 = await zip.generateAsync({ type: 'base64' })

    const bufferData = Buffer.from(base64, 'base64')
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-disposition': `attachment; filename=${zipName}`
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

function logReq (req) {
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
  const logFormat = {
    statusCode: res.statusCode,
    statusMessage: res.statusMessage
  }
  console.log('RES'.green)
  console.log(util.inspect(logFormat).yellow)
}
