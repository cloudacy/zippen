import {deflateRawSync} from 'zlib'
import crc32 from 'crc32-ts'
import {writeFileSync} from 'fs'

type ZipEntry = {
  path: string
  date: Date
  data?: Buffer // if data is set, it is a file, if not, it is a directory
  compressedData?: Buffer
  pathByteLength: number
  crc: number
}

const fixedLocalFileHeaderLength = 30
const fixedDataDescriptorLength = 16
const fixedCentralDirectoryLength = 46
const fixedEndCentralDirectoryLength = 22

/**
 * Encodes given date to a the MSDOS Date format.
 * Details: https://docs.microsoft.com/en-us/windows/desktop/api/Winbase/nf-winbase-filetimetodosdatetime
 *
 * @param date The date object to be encoded
 * @returns Encoded date of the given date object
 */
export function dateToFatDate(date: Date): number {
  return date.getDate() | ((date.getMonth() + 1) << 5) | ((date.getFullYear() - 1980) << 9)
}

/**
 * Encodes given date to the MSDOS Time format.
 * Details: https://docs.microsoft.com/en-us/windows/desktop/api/Winbase/nf-winbase-filetimetodosdatetime
 *
 * @param date The date object to be encoded
 * @returns Encoded time of the given date object
 */
export function dateToFatTime(date: Date): number {
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
/**
 * Writes a local file header entry to the given buffer (buf) at offset (off) with given parameters.
 *
 * @param buf The buffer, on which the local file header will be written on
 * @param off Starting byte offset to use to write the local file header
 * @param path Relative path of the file (including directories, filename, file extension, ...) - e.g. foo/bar.txt
 * @param pathLength The BYTElength of the given path
 * @param date Last modification date and time
 * @param data A buffer holding ONLY the uncompressed data
 * @param compressedData A buffer holding ONLY the compressed data
 */
export function localFileHeader(buf: Buffer, off: number, path: string, pathLength: number, date: Date, data?: Buffer, compressedData?: Buffer) {
  buf.writeUInt32LE(0x04034b50, off)
  buf.writeUInt16LE(20, off + 4) // version needed to extract: 2.0 = DEFLATE compression
  buf.writeUInt16LE(0x0000, off + 6) // general purpose big flags: 3 = use data descriptor, 11 = name/comment UTF-8 encoded
  buf.writeUInt16LE(0x0008, off + 8) // compression method: 8 = DEFLATE
  buf.writeUInt16LE(dateToFatTime(date), off + 10) // last modified time
  buf.writeUInt16LE(dateToFatDate(date), off + 12) // last modified date
  buf.writeUInt32LE(data ? crc32(data, true) : 0x00000000, off + 14) // crc-32 (0x0 -> will be set at data descriptor)
  buf.writeUInt32LE(compressedData ? compressedData.byteLength : 0x00000000, off + 18) // compressed size (0x0 -> will be set at data descriptor)
  buf.writeUInt32LE(data ? data.byteLength : 0x00000000, off + 22) // uncompressed size (0x0 -> will be set at data descriptor)
  buf.writeUInt16LE(pathLength, off + 26) // file name length
  buf.writeUInt16LE(0x0000, off + 28) // extra field length
  buf.write(path, off + 30, pathLength, 'utf-8') // file name

  return fixedLocalFileHeaderLength + pathLength
}

/*
data needs to be the UNCOMPRESSED content of the file to add

+-------------------------------------+---------+
| signature (0x08074b50 - unofficial) | 4 bytes |
| crc-32                              | 4 bytes |
| compressed size                     | 4 bytes |
| uncompressed size                   | 4 bytes |
+-------------------------------------+---------+
*/
/**
 * Writes a data descriptor entry to the given buffer (buf) at offset (off) with given parameters.
 *
 * @param buf The buffer, on which the local file header will be written on
 * @param off Starting byte offset to use to write the local file header
 * @param data A buffer holding ONLY the uncompressed data
 * @param compressedData A buffer holding ONLY the compressed data
 */
export function dataDescriptor(buf: Buffer, off: number, data?: Buffer, compressedData?: Buffer) {
  buf.writeUInt32LE(0x08074b50, off)
  buf.writeUInt32LE(data ? crc32(data, true) : 0x00000000, off + 4) // crc32
  buf.writeUInt32LE(compressedData ? compressedData.byteLength : 0x00000000, off + 8) // compressed size
  buf.writeUInt32LE(data ? data.byteLength : 0x00000000, off + 12) // uncompressed size

  return fixedDataDescriptorLength
}

/*
+-------------------------------------------+---------+
| archive extra data signature (0x08064b50) | 4 bytes |
| extra field length                        | 4 bytes |
| extra field data                          | x bytes |
+-------------------------------------------+---------+
*/
/*export function archiveExtraData(buf: Buffer, extra: string) {
  buf.writeUInt32LE(0x08064b50, 0)
  const len = Buffer.from(extra).length // get the byte-length not the character-length
  buf.writeUInt32LE(len, 4)
  buf.write(extra, 8, len, 'utf-8')
}*/

/*
+--------------------------------------------+---------+
| central file header signature (0x02014b50) | 4 bytes |
| version made by                            | 2 bytes |
| version needed to extract                  | 2 bytes |
| general purpose bit flag                   | 2 bytes |
| compression method                         | 2 bytes |
| last mod file time                         | 2 bytes |
| last mod file date                         | 2 bytes |
| crc-32                                     | 4 bytes |
| compressed size                            | 4 bytes |
| uncompressed size                          | 4 bytes |
| file name length                           | 2 bytes |
| extra field length                         | 2 bytes |
| file comment length                        | 2 bytes |
| disk number start                          | 2 bytes |
| internal file attributes                   | 2 bytes |
| external file attributes                   | 4 bytes |
| relative offset of local header            | 4 bytes |
| file name                                  | x bytes |
| extra field                                | x bytes |
| file comment                               | x bytes |
+--------------------------------------------+---------+
*/
/**
 * Writes a central directory entry to the given buffer (buf) at offset (off) with given parameters.
 *
 * @param buf The buffer, on which the local file header will be written on
 * @param off Starting byte offset to use to write the local file header
 * @param path Relative path of the file (including directories, filename, file extension, ...) - e.g. foo/bar.txt
 * @param pathLength The BYTElength of the given path
 * @param date Last modification date and time
 * @param data A buffer holding ONLY the uncompressed data
 * @param compressedData A buffer holding ONLY the compressed data
 */
export function centralDirectory(buf: Buffer, off: number, path: string, pathLength: number, date: Date, data?: Buffer, compressedData?: Buffer) {
  buf.writeUInt32LE(0x02014b50, off) // central file header signature
  buf.writeUInt16LE(45, off + 4) // version made by: TODO
  buf.writeUInt16LE(20, off + 6) // version needed to extract: 2.0 = DEFLATE compression
  buf.writeUInt16LE(0x0000, off + 8) // general purpose big flags: 3 = use data descriptor, 11 = name/comment UTF-8 encoded
  buf.writeUInt16LE(0x0008, off + 10) // compression method: 8 = DEFLATE
  buf.writeUInt16LE(dateToFatTime(date), off + 12) // last mod file time
  buf.writeUInt16LE(dateToFatDate(date), off + 14) // last mod file date
  buf.writeUInt32LE(data ? crc32(data, true) : 0x00000000, off + 16) // crc-32
  buf.writeUInt32LE(compressedData ? compressedData.byteLength : 0x00000000, off + 20) // compressed size
  buf.writeUInt32LE(data ? data.byteLength : 0x00000000, off + 24) // uncompressed size
  buf.writeUInt16LE(pathLength, off + 28) // file name length
  buf.writeUInt16LE(0x0000, off + 30) // extra field length
  buf.writeUInt16LE(0x0000, off + 32) // file comment length
  buf.writeUInt16LE(0x0000, off + 34) // disk number start
  buf.writeUInt16LE(0x0000, off + 36) // internal file attributes
  buf.writeUInt32LE(0x00000000, off + 38) // external file attributes
  buf.writeUInt32LE(0x00000000, off + 42) // relative offset of local header
  buf.write(path, off + 46, pathLength, 'utf-8') // file name

  return fixedCentralDirectoryLength + pathLength
}

/*
+-------------------------------------------------------------------------------+---------+
| end of central dir signature (0x06054b50)                                     | 4 bytes |
| number of this disk                                                           | 2 bytes |
| number of the disk with the start of the central directory                    | 2 bytes |
| total number of entries in the central directory on this disk                 | 2 bytes |
| total number of entries in the central directory                              | 2 bytes |
| size of the central directory                                                 | 4 bytes |
| offset of start of central directory with respect to the starting disk number | 4 bytes |
| .ZIP file comment length                                                      | 2 bytes |
| .ZIP file comment                                                             | x bytes |
+-------------------------------------------------------------------------------+---------+
*/
/**
 * Writes an end of central directory entry to the given buffer (buf) at offset (off) with given parameters.
 *
 * @param buf The buffer, on which the local file header will be written on
 * @param off Starting byte offset to use to write the local file header
 * @param entryCount The total number of entries stored in the zip container
 * @param entriesLength TODO
 */
export function endCentralDirectory(buf: Buffer, off: number, entryCount: number, entriesLength: number) {
  buf.writeUInt32LE(0x06054b50, off) // end of central dir signature
  buf.writeUInt16LE(0x0000, off + 4) // number of this disk
  buf.writeUInt16LE(0x0000, off + 6) // number of the disk with the start of the central directory
  buf.writeUInt16LE(entryCount, off + 8) // total number of entries in the central directory on this disk
  buf.writeUInt16LE(entryCount, off + 10) // total number of entries in the central directory
  buf.writeUInt32LE(entriesLength, off + 12) // size of the central directory: bytelength of all the central directories summed up
  buf.writeUInt32LE(entriesLength, off + 16) // offset of start of central directory with respect to the starting disk number: TODO: this is not quite correct a test zip printed 10 bytes more
  buf.writeUInt16LE(0x0000, off + 20) // comment length
  // no comment

  return fixedEndCentralDirectoryLength
}

export class Zip {
  buffer: Buffer
  entries: Array<ZipEntry> = []
  offset: number = 0

  /**
   * Add an entry (file / directory) to the zip file
   *
   * @param path Relative path of the file (including directories, filename, file extension, ...) - e.g. foo/bar.txt
   * @param data A buffer holding ONLY the uncompressed data
   * @param date Last modification date and time
   */
  addEntry(path: string, date: Date, data: Buffer | undefined) {
    this.entries.push({path, data, date, compressedData: data ? deflateRawSync(data) : undefined, pathByteLength: Buffer.from(path).byteLength, crc: data ? crc32(data, true) : 0})
  }

  /**
   * Generate a zip buffer based on all previously added entries
   *
   * @returns Buffer holding the final zip file
   */
  build(): Buffer {
    // calculate the resulting buffer size
    let bufSize = fixedEndCentralDirectoryLength + (fixedLocalFileHeaderLength + /*fixedDataDescriptorLength*/ + fixedCentralDirectoryLength) * this.entries.length
    for (let i = 0; i < this.entries.length; i++) {
      const e: ZipEntry = this.entries[i]
      bufSize += (e.pathByteLength << 1) + (e.compressedData ? e.compressedData.byteLength : 0)
    }

    // allocate a buffer based on the pre-calculated size
    this.buffer = Buffer.alloc(bufSize)

    // iterate through all entries and append them to the zip buffer
    let entriesLength = 0
    for (let i = 0; i < this.entries.length; i++) {
      const e: ZipEntry = this.entries[i]

      this.offset += localFileHeader(this.buffer, this.offset, e.path, e.pathByteLength, e.date, e.data, e.compressedData)

      if (e.compressedData) {
        e.compressedData.copy(this.buffer, this.offset, 0, e.compressedData.byteLength)
        this.offset += e.compressedData.byteLength
      }

      //this.offset += dataDescriptor(this.buffer, this.offset, e.data, e.compressedData)

      const n = centralDirectory(this.buffer, this.offset, e.path, e.pathByteLength, e.date, e.data, e.compressedData)

      this.offset += n
      entriesLength += n
    }

    this.offset += endCentralDirectory(this.buffer, this.offset, this.entries.length, entriesLength)

    return this.buffer
  }

  /**
   * Store the zip buffer to the given path
   *
   * @param path Path where the new zip file should be stored
   */
  write(path: string | number | Buffer | URL) {
    writeFileSync(path, this.build())
  }
}
