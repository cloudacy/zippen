import {deflateRawSync, deflateRaw} from 'zlib'
import crc32 from '../../crc32-ts/src/index'

// Reference: https://github.com/thejoshwolfe/yazl/blob/master/index.js

// Specification for development: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT

/*
hexdump of abc.zip
           signature |vnte |bits | compr|time |date |
00000000  50 4b 03 04|14 00|08 00| 08 00|6b 81|8f 4d|00 00  |PK........k..M..|
                                                    | file
00000010  00 00 00 00 00 00 00 00  00 00 07 00 10 00|61 62  |..............ab|
          name          |
00000020  63 2e 74 78 74|55 58 0c  00 a1 19 15 5c 9a 19 15  |c.txtUX.....\...|
                        |deflated file data|descr. sig.|
00000030  5c f5 01 14 00|4b 4c 4a  e6 02 00|50 4b 07 08|4e  |\....KLJ...PK..N|
           crc32  |comp. size |unc. size   |cfh sig.   |vm
00000040  81|88 47|06 00 00 00|04  00 00 00|50 4b 01 02|15  |..G........PK...|
          b |vntex|bits |compr|ti  me|date |crc32      |
00000050  03|14 00|08 00|08 00|6b  81|8f 4d|4e 81 88 47|06  |.......k..MN..G.|
        comp size |unc. size  |namlen|exlen|cmlen|dskn.|inatt
00000060  00 00 00|04 00 00 00|07  00|0c 00|00 00|00 00|00  |................|
            |ext. attr  |offset      |file name           |
00000070  00|00 40 a4 81|00 00 00  00|61 62 63 2e 74 78 74| |..@......abc.txt|
          extra field                         |eocd sig.  |
00000080  55 58 08 00 a1 19 15 5c  9a 19 15 5c|50 4b 05 06  |UX.....\...\PK..|
          dskn.|dskn.|entn.|entn.| cdsize     |socd offs. dn.
00000090  00 00 00 00 01 00 01 00| 41 00 00 00|4b 00 00 00| |........A...K...|
          comln|
000000a0  00 00|                                            |..|
000000a2
*/

/*
ZIP structure:

[local file header 1]
[encryption header 1]
[file data 1]
[data descriptor 1]
...
[local file header n]
[encryption header n]
[file data n]
[data descriptor n]
[archive decryption header]
[archive extra data record]
[central directory header 1]
...
[central directory header n]
[zip64 end of central directory record]
[zip64 end of central directory locator]
[end of central directory record]
*/

// https://docs.microsoft.com/en-us/windows/desktop/api/Winbase/nf-winbase-filetimetodosdatetime
export function dateToFatDate(date: Date) {
  return date.getDate() | ((date.getMonth() + 1) << 5) | ((date.getFullYear() - 1980) << 9)
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
export function localFileHeader(buf: Buffer, name: string, date: Date, extra: string = '') {
  buf.writeUInt32LE(0x04034b50, 0)
  buf.writeUInt16LE(0x0405, 4) // version needed to extract: 2.0 = DEFALTE compression
  buf.writeUInt16LE(0b0000100000001000, 6) // general purpose big flags: 3 = use data descriptor, 11 = name/comment UTF-8 encoded
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

/*
data needs to be the UNCOMPRESSED content of the file to add

+-------------------------------------+---------+
| signature (0x08074b50 - unofficial) | 4 bytes |
| crc-32                              | 4 bytes |
| compressed size                     | 4 bytes |
| uncompressed size                   | 4 bytes |
+-------------------------------------+---------+
*/
export function dataDescriptor(buf: Buffer, data: Buffer, dataUncompressedLength: number) {
  buf.writeUInt32LE(0x08074b50, 0)
  buf.writeUInt32LE(crc32(data, true), 4) // crc32
  buf.writeUInt32LE(data.byteLength, 8)
  buf.writeUInt32LE(dataUncompressedLength, 12)
}

/*
+-------------------------------------------+---------+
| archive extra data signature (0x08064b50) | 4 bytes |
| extra field length                        | 4 bytes |
| extra field data                          | x bytes |
+-------------------------------------------+---------+
*/
export function archiveExtraData(buf: Buffer, extra: string) {
  buf.writeUInt32LE(0x08064b50, 0)
  const len = Buffer.from(extra).length // get the byte-length not the character-length
  buf.writeUInt32LE(len, 4)
  buf.write(extra, 8, len, 'utf-8')
}

/*
+--------------------------------------------+---------+
| central file header signature (0x02014b50) | 4 bytes |
| version made by                            | 2 bytes |
| version needed to extract                  | 2 bytes |
| general purpose bit flag                   | 2 bytes |
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
export function centralDirectory(buf: Buffer, date: Date) {
  buf.writeUInt32LE(0x02014b50, 0) // central file header signature
  buf.writeUInt16LE(0x0000, 4) // version made by: TODO
  buf.writeUInt16LE(0x0000, 6) // version needed to extract: TODO
  buf.writeUInt16LE(0b0000100000001000, 8) // general purpose big flags: 3 = use data descriptor, 11 = name/comment UTF-8 encoded
  buf.writeUInt16LE(dateToFatTime(date), 10) // last mod file time
  buf.writeUInt16LE(dateToFatDate(date), 12) // last mod file date
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
export function endCentralDirectory(buf: Buffer, entryNum: number, entriesLen: number) {
  buf.writeUInt32LE(0x06054b50, 0) // end of central dir signature
  buf.writeUInt16LE(0x0000, 4) // number of this disk
  buf.writeUInt16LE(0x0000, 6) // number of the disk with the start of the central directory
  buf.writeUInt16LE(entryNum, 8) // total number of entries in the central directory on this disk
  buf.writeUInt16LE(entryNum, 10) // total number of entries in the central directory
  buf.writeUInt32LE(entriesLen, 12) // size of the central directory: bytelength of all the central directories summed up
  buf.writeUInt32LE(entriesLen, 16) // offset of start of central directory with respect to the starting disk number: TODO: this is not quite correct a test zip printed 10 bytes more
  buf.writeUInt16LE(0x0000, 20) // comment length
  // no comment
}

const fixedLocalFileHeaderLength = 30
const fixedDataDescriptorLength = 16
const fixedCentralDirectoryLength = 44

export class Zip {
  entries: Array<Entry> = []

  addEntry(path: string, data: Buffer, directory: boolean) {
    this.entries.push(new Entry(path, data, directory))
  }

  build() {

    /*for (const e of this.entries) {

    }*/
  }
}

export class Entry {
  path: string
  data: Buffer
  compressedData: Buffer

  constructor(path: string, data: Buffer, directory: boolean) {
    this.path = path
    this.data = data
    if (directory) {
      this.compressedData = deflateRawSync(data)
    }
  }
}
