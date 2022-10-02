/// <reference types="node" resolution-mode="require"/>
export declare type ZipEntry = {
    path: string;
    date: Date;
    data?: Buffer;
    compressedData?: Buffer;
    pathByteLength: number;
    crc: number;
    localFileHeaderOffset: number;
};
/**
 * Encodes given date to a the MSDOS Date format.
 * Details: https://docs.microsoft.com/en-us/windows/desktop/api/Winbase/nf-winbase-filetimetodosdatetime
 *
 * @param date The date object to be encoded
 * @returns Encoded date of the given date object
 */
export declare function dateToFatDate(date: Date): number;
/**
 * Encodes given date to the MSDOS Time format.
 * Details: https://docs.microsoft.com/en-us/windows/desktop/api/Winbase/nf-winbase-filetimetodosdatetime
 *
 * @param date The date object to be encoded
 * @returns Encoded time of the given date object
 */
export declare function dateToFatTime(date: Date): number;
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
export declare function localFileHeader(buf: Buffer, off: number, path: string, pathLength: number, date: Date, data?: Buffer, compressedData?: Buffer): number;
/**
 * Writes a data descriptor entry to the given buffer (buf) at offset (off) with given parameters.
 *
 * @param buf The buffer, on which the local file header will be written on
 * @param off Starting byte offset to use to write the local file header
 * @param data A buffer holding ONLY the uncompressed data
 * @param compressedData A buffer holding ONLY the compressed data
 */
export declare function dataDescriptor(buf: Buffer, off: number, data?: Buffer, compressedData?: Buffer): number;
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
export declare function centralDirectory(buf: Buffer, off: number, path: string, pathLength: number, date: Date, localFileHeaderOffset: number, data?: Buffer, compressedData?: Buffer): number;
/**
 * Writes an end of central directory entry to the given buffer (buf) at offset (off) with given parameters.
 *
 * @param buf The buffer, on which the local file header will be written on
 * @param off Starting byte offset to use to write the local file header
 * @param entryCount The total number of entries stored in the zip container
 * @param entriesLength TODO
 */
export declare function endCentralDirectory(buf: Buffer, off: number, entries: ZipEntry[], entriesLength: number): number;
export declare class Zip {
    buffer: Buffer;
    entries: Array<ZipEntry>;
    offset: number;
    /**
     * Add an entry (file / directory) to the zip file
     *
     * @param path Relative path of the file (including directories, filename, file extension, ...) - e.g. foo/bar.txt
     * @param data A buffer holding ONLY the uncompressed data
     * @param date Last modification date and time
     */
    addEntry(path: string, date: Date, data: Buffer | undefined): void;
    /**
     * Generate a zip buffer based on all previously added entries
     *
     * @returns Buffer holding the final zip file
     */
    build(): Buffer;
    /**
     * Store the zip buffer to the given path
     *
     * @param path Path where the new zip file should be stored
     */
    write(path: string | number | Buffer | URL): void;
}
