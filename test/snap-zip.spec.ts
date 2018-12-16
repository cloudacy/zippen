'use strict'

import {Zip} from '../src/main'

describe('ZIP file with abc.txt', () => {
  const zip = new Zip()
  zip.addEntry('abc.txt', new Date('2018-12-15T15:11:22.494Z'), Buffer.from('abc\n'))
  zip.write('abc-t.zip')
})
