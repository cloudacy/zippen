import {PassThrough} from 'stream'
import {deflateRaw} from 'zlib'
import crc32 from 'crc32-ts'
import {WriteStream, PathLike} from 'fs'

// Reference: https://github.com/thejoshwolfe/yazl/blob/master/index.js

// Specification for development: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT

// https://docs.microsoft.com/en-us/windows/desktop/api/Winbase/nf-winbase-filetimetodosdatetime
export function dateToFatDate(date: Date) {
  return date.getDay() | ((date.getMonth() + 1) << 5) | ((date.getFullYear() - 1980) << 9)
}

// https://docs.microsoft.com/en-us/windows/desktop/api/Winbase/nf-winbase-filetimetodosdatetime
export function dateToFatTime(date: Date) {
  return (date.getSeconds() >> 1) | (date.getMinutes() << 5) | (date.getHours() << 11)
}

/*

+------------------------------------------+---------+
| local file header signature (0x04034b50) | 4 bytes |
| version needed to extract (4.4.3)        | 2 bytes |
| general purpose bit flag (4.4.4)         | 2 bytes |
| compression method (4.4.5)               | 2 bytes |
| last mod file time (4.4.6)               | 2 bytes |
| last mod file date (4.4.6)               | 2 bytes |
| crc-32 (4.4.7)                           | 4 bytes |
| compressed size (4.4.8)                  | 4 bytes |
| uncompressed size (4.4.9)                | 4 bytes |
| file name length (4.4.10)                | 2 bytes |
| extra field length (4.4.11)              | 2 bytes |
| file name (4.4.17)                       | x bytes |
| extra field                              | x bytes |
+------------------------------------------+---------+

*/

export function localFileHeader(buf: Buffer, date: Date, name: string, extra: string) {
  buf.writeUInt32LE(0x04034b50, 0)
  buf.writeUInt16LE(0x0200, 4) // version needed to extract: 2.0 = DEFALTE compression
  buf.writeUInt16LE(0b0000100000000000, 6) // general purpose big flags: 11 = name/comment UTF-8 encoded
  buf.writeUInt16LE(0x0008, 8) // compression method: 8 = DEFLATE
  buf.writeUInt16LE(dateToFatTime(date), 10) // last modified time
  buf.writeUInt16LE(dateToFatDate(date), 12) // last modified date
  buf.writeUInt32LE(0x00000000, 14) // crc-32
  buf.writeUInt32LE(0x00000000, 18) // compressed size
  buf.writeUInt32LE(0x00000000, 22) // uncompressed size
  buf.writeUInt16LE(name.length, 26) // file name length
  buf.writeUInt16LE(extra.length, 28) // extra field length
  buf.write(name, 30, name.length, 'utf-8') // file name
  buf.write(extra, 30 + name.length, extra.length, 'utf-8') // extra field
}



export class Zip {
  stream: PassThrough = new PassThrough()
  cursor: number = 0
  entries: Array<Entry> = []

  constructor(writeStream?: WriteStream) {
    if (writeStream) {
      this.stream.pipe(writeStream)
    }
  }

  addEntry(e: Entry) {
    this.entries.push(e)
  }
}

export class Entry {
  directory: boolean
  crc32: number
  uncompressedSize: number
  compressedSize: number

  descriptorSize = 16

  constructor(path: PathLike, directory: boolean = false) {
    const filenameBuffer = Buffer.from(path.toString())
    this.directory = directory
  }

  getDescriptionBuffer() {
    const buffer = Buffer.alloc(this.descriptorSize)
    buffer.writeUInt32LE(0x08074b50, 0)
    // crc-32
    console.log('crc', this.crc32)
    buffer.writeUInt32LE(this.crc32, 4)
    // compressed size
    buffer.writeInt32LE(this.compressedSize, 8)
    // uncompressed size
    buffer.writeInt32LE(this.uncompressedSize, 12)

    return buffer
  }
}

export function write(zip: Zip, buffer: Buffer) {
  zip.stream.write(buffer)
  zip.cursor += buffer.length
}

export function deflate(buf: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    deflateRaw(buf, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

export async function addString(zip: Zip, str: string, path: PathLike) {
  const buf = Buffer.from(str)

  const entry = new Entry(path)
  console.log(crc32)
  entry.uncompressedSize = buf.length
  entry.crc32 = crc32(buf, true)
  zip.addEntry(entry)

  const compressedBuffer = await deflate(buf)
  entry.compressedSize = compressedBuffer.length
  write(zip, compressedBuffer)
  write(zip, entry.getDescriptionBuffer())
}

export function end(zip: Zip) {
  zip.stream.end()
}
