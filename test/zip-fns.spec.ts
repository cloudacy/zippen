'use strict'

import {existsSync, mkdirSync, rmdirSync, writeFileSync, unlinkSync} from 'fs'
import {expect} from 'chai'
import {deflate} from 'pako'
import {PassThrough} from 'stream'
import { addString, Zip } from '../src';

describe('Minimal Zip with test.txt', () => {
  const dir = './tmp'
  let zip: Zip

  before(() => {
    zip = new Zip()
  })

  it('should deflate a string', () => {
    addString(zip, 'test')
  })
})