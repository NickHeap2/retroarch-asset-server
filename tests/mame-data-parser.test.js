describe('mame-data-parser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const game1941 = {
    description: '1941 - Counter Attack (World)',
    manufacturer: 'Capcom',
    name: '1941',
    year: '1990'
  }

  it('can parse a dat file', async () => {
    const mameDataParser = require('../lib/mame-data-parser')
    const mameDatFile = './MAME 078.dat'

    const mameData = await mameDataParser.parseDatFile(mameDatFile)
    expect(mameData).toBeDefined()
    expect(mameData).toHaveProperty('baseGames')
    expect(mameData.baseGames.length).toEqual(2681)
    expect(mameData).toHaveProperty('cloneGames')
    expect(mameData.cloneGames.length).toEqual(2039)

    expect(mameData.baseGames[1]).toBeDefined()
    expect(mameData.baseGames[1]).toEqual(game1941)
  })
})
