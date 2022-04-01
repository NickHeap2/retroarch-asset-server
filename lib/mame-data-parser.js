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

function parseMameData (datafile) {
  const gameMapper = function (game) {
    const description = game.description ? game.description[0] : ''
    const manufacturer = game.manufacturer ? game.manufacturer[0] : ''
    const year = game.year ? game.year[0] : ''

    return {
      name: cleanseText(game.$.name),
      description: cleanseText(description),
      manufacturer: cleanseText(manufacturer),
      year: cleanseText(year)
    }
  }
  const header = datafile.header
  const baseGames = datafile.game
    .filter((game) => game.$.cloneof === undefined)
    .map(gameMapper)
  const cloneGames = datafile.game
    .filter((game) => game.$.cloneof !== undefined)
    .map(gameMapper)

  return {
    header,
    baseGames,
    cloneGames
  }
}
