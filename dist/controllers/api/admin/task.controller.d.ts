import { type Request, type Response } from "express";
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        username: string;
        role: string;
    };
}
interface GetTasksQuery {
    search?: string;
    room?: string;
    status?: "pending" | "in-progress" | "completed";
    assignedTo?: string;
    dueDate?: string;
    createdBy?: string;
    page?: string | number;
}
interface TaskBody {
    title: string;
    description?: string;
    room: string;
    assignedTo?: string[];
    createdBy: string;
    status?: "pending" | "in-progress" | "completed";
    dueDate?: string;
}
export declare const getTasks: (req: Request<{}, {}, {}, GetTasksQuery>, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createTask: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTaskById: (req: Request<{
    id: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTask: (req: Request<{
    id: string;
}, {}, TaskBody>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTaskPartial: (req: Request<{
    id: string;
}, {}, Partial<TaskBody>>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteTask: (req: Request<{
    id: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTasksByRoom: (req: Request<{
    roomId: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=task.controller.d.ts.map