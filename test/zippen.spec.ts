'use strict'

import {Zip} from '../src/zip'
import {debug} from '../src/unzip'
import {readFileSync} from 'fs'

describe('zip generation', () => {
  it('creates a simple Zip file', () => {
    const zip = new Zip()
    zip.addEntry('abc.txt', new Date('2018-12-15T15:11:22.494Z'), Buffer.from('abc\n'))
    zip.write('abc-t.zip')
  })
})

describe('zip debugging', () => {
  it('debugs a zip file', () => {
    const b2: Buffer = readFileSync('abc-t.zip')
    debug(b2)
  })
})
