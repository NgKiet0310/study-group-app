import { type Request, type Response } from "express";
interface GetFilesQuery {
    search?: string;
    room?: string;
    fileType?: string;
    page?: string | number;
}
export declare const getFiles: (req: Request<{}, {}, {}, GetFilesQuery>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFileById: (req: Request<{
    id: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteFile: (req: Request<{
    id: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=file.controller.d.ts.map