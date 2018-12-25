'use strict'

import {Zip} from '../src/zip'
import {debug} from '../src/unzip'
import {readFileSync} from 'fs'

describe('zip generation', () => {
  it('creates a simple Zip file', () => {
    const zip = new Zip()
    zip.addEntry('abc.txt', new Date(), readFileSync('abc.txt'))
    zip.addEntry('def.txt', new Date(), readFileSync('def.txt'))
    zip.write('abc-t.zip')
  })
})

describe('zip debugging', () => {
  it('debugs a zip file', () => {
    const b: Buffer = readFileSync('abc-t.zip')
    debug(b)
    const b2: Buffer = readFileSync('abc.zip')
    debug(b2)
  })
})
