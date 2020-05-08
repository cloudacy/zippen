/// <reference types="node" />
import { Zip } from './zip';
export declare function fatDateTimeToJsDate(date: number, time: number): Date;
export declare function unzipEntry(zip: Zip, buf: Buffer, off: number): number;
export declare function unzip(buf: Buffer): Zip;
