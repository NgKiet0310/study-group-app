import { type Request, type Response } from "express";
interface GetMessagesQuery {
    search?: string;
    room?: string;
    page?: string | number;
}
export declare const getMessages: (req: Request<{}, {}, {}, GetMessagesQuery>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMessageById: (req: Request<{
    id: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteMessage: (req: Request<{
    id: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=message.controller.d.ts.map