'use strict'

import {Zip} from '../src/zip'
import {unzip} from '../src/unzip'

describe('zipping', () => {
  it('creates a simple Zip file', () => {
    const zip = new Zip()
    zip.addEntry('foo.txt', new Date(), Buffer.from('foo'))
    zip.addEntry('bar.txt', new Date(), Buffer.from('bar'))
    zip.build()
  })
})

describe('unzipping', () => {
  it('unzips a zip file', () => {
    const zip = new Zip()
    zip.addEntry('foo.txt', new Date(), Buffer.from('foo'))
    unzip(zip.build())
  })
})
