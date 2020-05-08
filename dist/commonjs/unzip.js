'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const zlib_1 = require("zlib");
const zip_1 = require("./zip");
function fatDateTimeToJsDate(date, time) {
    return new Date(((date & 0xfe00) >> 9) + 1980, ((date & 0x01e0) >> 5) - 1, date & 0x001f, (time & 0xf800) >> 11, (time & 0x07e0) >> 5, (time & 0x001f) << 1);
}
exports.fatDateTimeToJsDate = fatDateTimeToJsDate;
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
function unzipEntry(zip, buf, off) {
    let r = 0;
    r = buf.readUInt16LE(off);
    off += 2;
    // console.log('  - Version needed to extract:', r)
    r = buf.readUInt16LE(off);
    off += 2;
    // console.log('  - General purpose bit flag:', '0x' + r.toString(16))
    r = buf.readUInt16LE(off);
    off += 2;
    // console.log('  - Compression method:', '0x' + r.toString(16))
    r = buf.readUInt16LE(off);
    const fatTime = r;
    off += 2;
    r = buf.readUInt16LE(off);
    off += 2;
    const mtime = fatDateTimeToJsDate(r, fatTime);
    // console.log('  - Last modification:', fatDateTimeToJsDate(r, fatTime))
    r = buf.readUInt32LE(off);
    off += 4;
    // console.log('  - CRC-32:', '0x' + r.toString(16))
    r = buf.readUInt32LE(off);
    const comprDataSize = r;
    off += 4;
    // console.log('  - Compressed size:', r)
    r = buf.readUInt32LE(off);
    const dataSize = r;
    off += 4;
    // console.log('  - Uncompressed size:', r)
    r = buf.readUInt16LE(off);
    const nameLength = r;
    off += 2;
    // console.log('  - File name length:', r)
    r = buf.readUInt16LE(off);
    const extraLength = r;
    off += 2;
    // console.log('  - Extra field length:', r)
    const path = buf.toString('utf-8', off, off + nameLength);
    // console.log('  - File name:', '"' + buf.toString('utf-8', off, off + nameLength) + '"')
    off += nameLength;
    off += extraLength;
    // console.log('  - Extra field:', '0x' + buf.toString('hex', off, off + r))
    const comprData = Buffer.alloc(comprDataSize);
    buf.copy(comprData, 0, off, off + comprDataSize);
    const data = zlib_1.inflateRawSync(comprData);
    zip.addEntry(path, mtime, data);
    return off + comprDataSize;
}
exports.unzipEntry = unzipEntry;
function unzip(buf) {
    const zip = new zip_1.Zip();
    let off = 0;
    let r = 0;
    while (off < buf.byteLength) {
        r = buf.readUInt32LE(off);
        off += 4;
        if (r === 0x04034b50) {
            off = unzipEntry(zip, buf, off);
        }
        else {
            break;
        }
    }
    return zip;
}
exports.unzip = unzip;
//# sourceMappingURL=unzip.js.map