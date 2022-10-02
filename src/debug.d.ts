/// <reference types="node" resolution-mode="require"/>
/**
 * Prints out a readable version of the current local file header from the given zip file buffer.
 *
 * @param buf Buffer holding the content of a zip file
 * @param off Starting byte offset to read the local file header
 * @returns New byte offset
 */
export declare function debugLocalFileHeader(buf: Buffer, off: number): number;
export declare function debugDataDescriptor(buf: Buffer, off: number): number;
/**
 * Prints out a readable version of the current central directory from the given zip file buffer.
 *
 * @param buf Buffer holding the content of a zip file
 * @param off Starting byte offset to read the central directory
 * @returns New byte offset
 */
export declare function debugCentralDirectory(buf: Buffer, off: number): number;
/**
 * Prints out a readable version of the current end of central directory from the given zip file buffer.
 *
 * @param buf Buffer holding the content of a zip file
 * @param off Starting byte offset to read the end of central directory
 * @returns New byte offset
 */
export declare function debugEndOfCentralDirectory(buf: Buffer, off: number): number;
/**
 * Prints out a readable version of the given zip file buffer.
 *
 * @param buf Buffer holding the content of a zip file
 */
export declare function debug(buf: Buffer): void;
