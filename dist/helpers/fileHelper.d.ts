export function deletePhysicalFile(filePath: string): Promise<boolean>;
export function deleteMultipleFiles(filePaths: Array<string>): Promise<Object>;
export function isFileSizeValid(sizeInBytes: number, maxSizeInMB?: number): boolean;
export function formatFileSize(bytes: number): string;
export function getFileExtension(filename: string): string;
export function determineFileType(filename: string): string;
export function generateUniqueFilename(originalName: string): string;
export function fileExists(filePath: string): boolean;
export function ensureDirectoryExists(dirPath: string): void;
export function cleanupOldFiles(directory: string, daysOld?: number): Promise<number>;
export function isFileTypeAllowed(filename: string, allowedExtensions?: Array<string>): boolean;
declare namespace _default {
    export { deletePhysicalFile };
    export { deleteMultipleFiles };
    export { isFileSizeValid };
    export { formatFileSize };
    export { getFileExtension };
    export { determineFileType };
    export { generateUniqueFilename };
    export { fileExists };
    export { ensureDirectoryExists };
    export { cleanupOldFiles };
    export { isFileTypeAllowed };
}
export default _default;
//# sourceMappingURL=fileHelper.d.ts.map