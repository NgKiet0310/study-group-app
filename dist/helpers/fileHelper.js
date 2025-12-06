import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Xóa file vật lý an toàn
 * @param {string} filePath - Đường dẫn file (relative hoặc absolute)
 * @returns {Promise<boolean>} - true nếu xóa thành công, false nếu thất bại
 */
export const deletePhysicalFile = async (filePath) => {
    try {
        // Chuyển đổi relative path thành absolute path
        let absolutePath = filePath;
        if (!path.isAbsolute(filePath)) {
            // Nếu path bắt đầu bằng /uploads, loại bỏ dấu /
            const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
            absolutePath = path.join(process.cwd(), cleanPath);
        }
        // Kiểm tra file có tồn tại không
        if (!fs.existsSync(absolutePath)) {
            console.warn(`File not found: ${absolutePath}`);
            return false;
        }
        // Kiểm tra có phải file không (không phải folder)
        const stats = fs.statSync(absolutePath);
        if (!stats.isFile()) {
            console.warn(`Not a file: ${absolutePath}`);
            return false;
        }
        // Xóa file
        fs.unlinkSync(absolutePath);
        console.log(`✓ File deleted successfully: ${absolutePath}`);
        return true;
    }
    catch (err) {
        console.error(`✗ Error deleting file ${filePath}:`, err.message);
        return false;
    }
};
/**
 * Xóa nhiều file cùng lúc
 * @param {Array<string>} filePaths - Mảng đường dẫn file
 * @returns {Promise<Object>} - Object chứa thông tin kết quả
 */
export const deleteMultipleFiles = async (filePaths) => {
    const results = {
        success: [],
        failed: [],
        total: filePaths.length
    };
    for (const filePath of filePaths) {
        const deleted = await deletePhysicalFile(filePath);
        if (deleted) {
            results.success.push(filePath);
        }
        else {
            results.failed.push(filePath);
        }
    }
    console.log(`Deleted ${results.success.length}/${results.total} files`);
    return results;
};
/**
 * Kiểm tra kích thước file
 * @param {number} sizeInBytes - Kích thước file (bytes)
 * @param {number} maxSizeInMB - Kích thước tối đa (MB)
 * @returns {boolean}
 */
export const isFileSizeValid = (sizeInBytes, maxSizeInMB = 10) => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return sizeInBytes <= maxSizeInBytes;
};
/**
 * Format kích thước file sang dạng đọc được
 * @param {number} bytes - Kích thước (bytes)
 * @returns {string} - Kích thước đã format (KB, MB, GB)
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
/**
 * Lấy extension file
 * @param {string} filename - Tên file
 * @returns {string} - Extension (lowercase)
 */
export const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
};
/**
 * Xác định loại file dựa trên extension
 * @param {string} filename - Tên file
 * @returns {string} - Loại file: 'pdf', 'doc', 'image', 'other'
 */
export const determineFileType = (filename) => {
    const ext = getFileExtension(filename);
    if (['pdf'].includes(ext))
        return 'pdf';
    if (['doc', 'docx'].includes(ext))
        return 'doc';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext))
        return 'image';
    return 'other';
};
/**
 * Tạo tên file unique để tránh trùng lặp
 * @param {string} originalName - Tên file gốc
 * @returns {string} - Tên file mới
 */
export const generateUniqueFilename = (originalName) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    // Sanitize filename: loại bỏ ký tự đặc biệt
    const sanitizedName = nameWithoutExt
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
    return `${timestamp}-${randomString}-${sanitizedName}${ext}`;
};
/**
 * Kiểm tra file có tồn tại không
 * @param {string} filePath - Đường dẫn file
 * @returns {boolean}
 */
export const fileExists = (filePath) => {
    try {
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.join(process.cwd(), filePath.startsWith('/') ? filePath.substring(1) : filePath);
        return fs.existsSync(absolutePath);
    }
    catch (err) {
        return false;
    }
};
/**
 * Tạo thư mục nếu chưa tồn tại
 * @param {string} dirPath - Đường dẫn thư mục
 */
export const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✓ Directory created: ${dirPath}`);
    }
};
/**
 * Dọn dẹp file cũ (xóa file quá X ngày)
 * @param {string} directory - Thư mục cần dọn dẹp
 * @param {number} daysOld - Số ngày
 * @returns {Promise<number>} - Số file đã xóa
 */
export const cleanupOldFiles = async (directory, daysOld = 30) => {
    try {
        const files = fs.readdirSync(directory);
        const now = Date.now();
        const maxAge = daysOld * 24 * 60 * 60 * 1000;
        let deletedCount = 0;
        for (const file of files) {
            const filePath = path.join(directory, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile() && (now - stats.mtimeMs) > maxAge) {
                fs.unlinkSync(filePath);
                deletedCount++;
                console.log(`Deleted old file: ${file}`);
            }
        }
        console.log(`Cleanup complete: ${deletedCount} files deleted`);
        return deletedCount;
    }
    catch (err) {
        console.error('Error in cleanupOldFiles:', err);
        return 0;
    }
};
/**
 * Validate loại file được phép upload
 * @param {string} filename - Tên file
 * @param {Array<string>} allowedExtensions - Mảng extension được phép
 * @returns {boolean}
 */
export const isFileTypeAllowed = (filename, allowedExtensions = []) => {
    const ext = getFileExtension(filename);
    const defaultAllowed = [
        'pdf', 'doc', 'docx', 'txt',
        'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp',
        'xls', 'xlsx', 'ppt', 'pptx',
        'zip', 'rar', '7z'
    ];
    const allowed = allowedExtensions.length > 0 ? allowedExtensions : defaultAllowed;
    return allowed.includes(ext);
};
export default {
    deletePhysicalFile,
    deleteMultipleFiles,
    isFileSizeValid,
    formatFileSize,
    getFileExtension,
    determineFileType,
    generateUniqueFilename,
    fileExists,
    ensureDirectoryExists,
    cleanupOldFiles,
    isFileTypeAllowed
};
//# sourceMappingURL=fileHelper.js.map