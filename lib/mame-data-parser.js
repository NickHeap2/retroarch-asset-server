const fs = require('fs')
const xml2js = require('xml2js')
// const util = require('util')

module.exports = {
  parseDatFile
}

async function parseDatFile (datFileName) {
  const parser = new xml2js.Parser()

  const fileData = fs.readFileSync(datFileName).toString()
  const mameData = await parser.parseStringPromise(fileData)

  // console.log(util.inspect(mameData, false, null))

  const parsedMameData = parseMameData(mameData.datafile)

  return parsedMameData
}

function cleanseText (text) {
  return text.replace(/[<>:"/\\|?*]+/g, '')
}

function gameMapper (game) {
  let description = game.description ? game.description[0] : 'None'
  if (description === undefined || description === '') {
    description = 'None'
  }
  let manufacturer = game.manufacturer ? game.manufacturer[0] : 'Unknown'
  if (manufacturer === undefined || manufacturer === '') {
    manufacturer = 'Unknown'
  }
  let year = game.year ? game.year[0] : '0'
  if (year === undefined || year === '') {
    year = '0'
  }
  let needsBios
  if (game.$.romof !== undefined &&
      game.$.cloneof === undefined) {
    // console.log(`${game.$.name} needs BIOS ${game.$.romof}`)
    needsBios = game.$.romof
  }

  return {
    name: cleanseText(game.$.name),
    description: cleanseText(description),
    manufacturer: cleanseText(manufacturer),
    year: cleanseText(year),
    needsBios: needsBios
  }
}

function parseMameData (datafile) {
  const header = datafile.header
  const bios = datafile.game
    .filter((game) => game.$.isbios === 'yes')
    .map(gameMapper)
  const baseGames = datafile.game
    .filter((game) => game.$.cloneof === undefined)
    .map(gameMapper)
  const cloneGames = datafile.game
    .filter((game) => game.$.cloneof !== undefined)
    .map(gameMapper)

  return {
    header,
    bios,
    baseGames,
    cloneGames
  }
}
