'use strict'

import {Zip} from '../src/zip'
import {debug} from '../src/unzip'
import {readFileSync, statSync} from 'fs'

describe('zip generation', () => {
  it('creates a simple Zip file', () => {
    const zip = new Zip()
    zip.addEntry('abc.txt', statSync('abc.txt').mtime, readFileSync('abc.txt'))
    zip.write('abc-t.zip')
  })
})

describe('zip debugging', () => {
  it('debugs a zip file', () => {
    const b1: Buffer = readFileSync('abc.zip')
    debug(b1)
    const b2: Buffer = readFileSync('abc-t.zip')
    debug(b2)
  })
})
