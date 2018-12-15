'use strict'

import {addString, Zip, end} from '../src'
import {createWriteStream} from 'fs'

describe('Minimal Zip with test.txt', () => {
  const dir = './tmp'
  let zip: Zip

  before(() => {
    const wstream = createWriteStream('test.zip')
    zip = new Zip(wstream)
  })

  it('should deflate a string', async () => {
    await addString(zip, 'test')
    end(zip)
  })
})
