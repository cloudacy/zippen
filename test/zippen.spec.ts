import {inflateRawSync, deflateRawSync} from 'zlib'
import {describe, it, expect} from 'vitest'

import {Zip} from '../src/zip.js'
import {unzip} from '../src/unzip.js'

describe('zipping', () => {
  it('deflates and inflates buffers', () => {
    expect(inflateRawSync(deflateRawSync(Buffer.from('foo'))).toString('utf-8') === 'foo').to.be.true
  })

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
    const res = unzip(zip.build())
    expect((res.entries[0].data as Buffer).toString('utf-8') === 'foo').to.be.true
  })
})
