import { type Request, type Response } from "express";
interface GetNotesQuery {
    search?: string;
    room?: string;
    isPublic?: string;
    page?: string | number;
}
interface NoteBody {
    title: string;
    content: string;
    room: string;
    createdBy: string;
    isPublic?: boolean | string;
}
export declare const getNotes: (req: Request<{}, {}, {}, GetNotesQuery>, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createNote: (req: Request<{}, {}, NoteBody>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getNoteById: (req: Request<{
    id: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateNote: (req: Request<{
    id: string;
}, {}, NoteBody>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateNotePartial: (req: Request<{
    id: string;
}, {}, Partial<NoteBody>>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteNote: (req: Request<{
    id: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=note.controller.d.ts.map