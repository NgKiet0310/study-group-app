import { type Request, type Response } from "express";
interface AuthenticatedRequest extends Request {
    admin: {
        _id: string;
        username: string;
        role: string;
    };
}
interface GetSchedulesQuery {
    search?: string;
    room?: string;
    startDate?: string;
    endDate?: string;
    status?: "upcoming" | "ongoing" | "completed";
    page?: string | number;
}
interface ScheduleBody {
    title: string;
    description?: string;
    room: string;
    participants?: string[];
    createdBy: string;
    startTime: string | Date;
    endTime?: string | Date;
}
export declare const getSchedules: (req: Request<{}, {}, {}, GetSchedulesQuery>, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getScheduleById: (req: Request<{
    id: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSchedule: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSchedule: (req: Request<{
    id: string;
}, {}, ScheduleBody>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSchedulePartial: (req: Request<{
    id: string;
}, {}, Partial<ScheduleBody>>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSchedule: (req: Request<{
    id: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSchedulesByRoom: (req: Request<{
    roomId: string;
}, {}, {}, {
    status?: string;
    page?: string | number;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=schedule.controller.d.ts.map