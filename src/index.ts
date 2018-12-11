import {PassThrough} from 'stream'
import {deflateRaw} from 'zlib'
import crc32 from 'crc32-ts'

export class Zip {
  stream: PassThrough
  cursor: number
  entries = []

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

  constructor(directory: boolean = false) {
    this.directory = directory
  }

  getDescriptionBuffer() {
    const buffer = Buffer.from(this.descriptorSize.toString())
    buffer.writeUInt32LE(0x08074b50, 0)
    // crc-32
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

export function addString(zip: Zip, str: string) {
  const buf = Buffer.from(str)

  const entry = new Entry()
  console.log(crc32)
  entry.uncompressedSize = buf.length
  entry.crc32 = crc32(buf)
  zip.addEntry(entry)

  deflateRaw(buf, (err, res) => {
    entry.compressedSize = res.length
    write(zip, res)
    write(zip, entry.getDescriptionBuffer())
  })
}

export function end(zip: Zip) {
  zip.stream.end()
}
