export function showFileRoom(req: any, res: any): Promise<any>;
export function uploadFile(req: any, res: any): Promise<any>;
export function updateFile(req: any, res: any): Promise<any>;
export function deleteFile(req: any, res: any): Promise<any>;
export function deleteAllRoomFiles(roomId: any): Promise<{
    success: boolean;
    deletedCount: number;
    physicalFilesDeleted?: never;
    physicalFilesFailed?: never;
    databaseRecordsDeleted?: never;
    error?: never;
} | {
    success: boolean;
    physicalFilesDeleted: any;
    physicalFilesFailed: any;
    databaseRecordsDeleted: number;
    deletedCount?: never;
    error?: never;
} | {
    success: boolean;
    error: any;
    deletedCount?: never;
    physicalFilesDeleted?: never;
    physicalFilesFailed?: never;
    databaseRecordsDeleted?: never;
}>;
//# sourceMappingURL=file.controller.d.ts.map