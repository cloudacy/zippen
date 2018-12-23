'use strict'

import {Zip} from '../src/main'

describe('ZIP file with abc.txt', () => {
  const zip = new Zip()
  zip.addEntry('abc.txt', Buffer.from('abc\n'), new Date('2018-12-15T15:11:22.494Z'))
  zip.write('abc-t.zip')
})
