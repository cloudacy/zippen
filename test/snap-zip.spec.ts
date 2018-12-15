'use strict'

import 'mocha'

//import {addString, Zip, end} from '../src'
//import {createWriteStream} from 'fs'

import {Zip} from '../src/main'
import {statSync, writeFileSync} from 'fs'
import {deflateRawSync} from 'zlib'

describe('ZIP file with abc.txt', () => {
  const zip = new Zip()
  zip.addEntry('abc.txt')
})

/*
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
*/
