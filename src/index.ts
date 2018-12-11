import {PassThrough} from 'stream'
import {deflateRaw} from 'zlib'
import crc32 from 'crc32-ts'
import { WriteStream, PathLike } from 'fs';

// Reference: https://github.com/thejoshwolfe/yazl/blob/master/index.js

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
    const buffer = Buffer.allocUnsafe(this.descriptorSize)
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
  return new Promise((resolve, reject)=> {
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
