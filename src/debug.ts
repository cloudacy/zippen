'use strict'

import {fatDateTimeToJsDate} from './unzip'

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
 * Prints out a readable version of the current local file header from the given zip file buffer.
 *
 * @param buf Buffer holding the content of a zip file
 * @param off Starting byte offset to read the local file header
 * @returns New byte offset
 */
export function debugLocalFileHeader(buf: Buffer, off: number) {
  let r: number = 0

  console.log('- Local file header:')

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Version needed to extract:', r)

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - General purpose bit flag:', '0x' + r.toString(16))

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Compression method:', '0x' + r.toString(16))

  r = buf.readUInt16LE(off)
  const fatTime = r
  off += 2

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Last modification:', fatDateTimeToJsDate(r, fatTime))

  r = buf.readUInt32LE(off)
  off += 4
  console.log('  - CRC-32:', '0x' + r.toString(16))

  r = buf.readUInt32LE(off)
  const dataSize = r
  off += 4
  console.log('  - Compressed size:', r)

  r = buf.readUInt32LE(off)
  off += 4
  console.log('  - Uncompressed size:', r)

  r = buf.readUInt16LE(off)
  const nameLength = r
  off += 2
  console.log('  - File name length:', r)

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Extra field length:', r)

  console.log('  - File name:', '"' + buf.toString('utf-8', off, off + nameLength) + '"')
  off += nameLength

  console.log('  - Extra field:', '0x' + buf.toString('hex', off, off + r))
  //for (let off2 = off; off2 < off + r;) {
  //  console.log('    - Header:', buf.readUInt16LE(off))
  //  off2 += 2
  //  console.log('    - Body:', )
  //}

  off += r

  return off + dataSize
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
export function debugDataDescriptor(buf: Buffer, off: number) {
  let r: number = 0

  console.log('- Data Descriptor:')

  r = buf.readUInt32LE(off)
  off += 4
  console.log('  - CRC-32:', '0x' + r.toString(16))

  r = buf.readUInt32LE(off)
  off += 4
  console.log('  - Compressed size:', r)

  r = buf.readUInt32LE(off)
  off += 4
  console.log('  - Uncompressed size:', r)

  return off
}

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
 * Prints out a readable version of the current central directory from the given zip file buffer.
 *
 * @param buf Buffer holding the content of a zip file
 * @param off Starting byte offset to read the central directory
 * @returns New byte offset
 */
export function debugCentralDirectory(buf: Buffer, off: number) {
  let r: number = 0

  console.log('- Central Directory:')

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Version made by:', r)

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Version needed to extract:', r)

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - General purpose bit flag:', '0x' + r.toString(16))

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Compression method:', '0x' + r.toString(16))

  r = buf.readUInt16LE(off)
  const fatTime = r
  off += 2

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Last modification date:', fatDateTimeToJsDate(r, fatTime))

  r = buf.readUInt32LE(off)
  off += 4
  console.log('  - CRC-32:', '0x' + r.toString(16))

  r = buf.readUInt32LE(off)
  off += 4
  console.log('  - Compressed size:', r)

  r = buf.readUInt32LE(off)
  off += 4
  console.log('  - Uncompressed size:', r)

  r = buf.readUInt16LE(off)
  const nameLength = r
  off += 2
  console.log('  - File name length:', r)

  r = buf.readUInt16LE(off)
  const extraFieldLength = r
  off += 2
  console.log('  - Extra field length:', r)

  r = buf.readUInt16LE(off)
  const commentLength = r
  off += 2
  console.log('  - Comment length:', r)

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Disk number start:', r)

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Internal file attributes:', '0x' + r.toString(16))

  r = buf.readUInt32LE(off)
  off += 4
  console.log('  - External file attributes:', '0x' + r.toString(16))

  r = buf.readUInt32LE(off)
  off += 4
  console.log('  - Relative offset of local header:', r)

  console.log('  - File name:', buf.toString('utf-8', off, off + nameLength))
  off += nameLength

  console.log('  - Extra field:', buf.toString('hex', off, off + extraFieldLength))
  off += extraFieldLength

  console.log('  - Comment:', buf.toString('utf-8', off, off + commentLength))
  off += commentLength

  return off
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
 * Prints out a readable version of the current end of central directory from the given zip file buffer.
 *
 * @param buf Buffer holding the content of a zip file
 * @param off Starting byte offset to read the end of central directory
 * @returns New byte offset
 */
export function debugEndOfCentralDirectory(buf: Buffer, off: number) {
  let r: number = 0

  console.log('- End of Central Directory:')

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Number of this disk:', r)

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Number of the disk with the start of the central directory:', r)

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Total number of entries in the central directory on this disk:', r)

  r = buf.readUInt16LE(off)
  off += 2
  console.log('  - Total number of entries in the central directory:', r)

  r = buf.readUInt32LE(off)
  off += 4
  console.log('  - Size of the central directory:', r)

  r = buf.readUInt32LE(off)
  off += 4
  console.log('  - Offset of start of central directory with respect to the starting disk number:', r)

  r = buf.readUInt16LE(off)
  const commentLength = r
  off += 2
  console.log('  - ZIP Comment length:', r)

  console.log('  - ZIP Comment:', buf.toString('utf-8', off, off + commentLength))
  off += commentLength

  return off
}

/**
 * Prints out a readable version of the given zip file buffer.
 *
 * @param buf Buffer holding the content of a zip file
 */
export function debug(buf: Buffer) {
  let off = 0
  let r = 0

  while (off < buf.byteLength) {
    r = buf.readUInt32LE(off)
    off += 4

    if (r === 0x04034b50) {
      off = debugLocalFileHeader(buf, off)
    } else if (r === 0x08074b50) {
      off = debugDataDescriptor(buf, off)
    } else if (r === 0x02014b50) {
      off = debugCentralDirectory(buf, off)
    } else if (r === 0x06054b50) {
      off = debugEndOfCentralDirectory(buf, off)
    } else {
      console.error('none fitted for: ', '0x' + r.toString(16))
    }
  }
}
