import { type Request, type Response } from "express";
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        username: string;
        role: string;
    };
}
interface GetRoomsQuery {
    search?: string;
    memberCount?: string;
    startDate?: string;
    endDate?: string;
    page?: string | number;
}
interface MemberData {
    user: string;
    role: "host" | "member";
}
interface RoomBody {
    name: string;
    code?: string;
    description?: string;
    members?: MemberData[];
}
export declare const getRooms: (req: Request<{}, {}, {}, GetRoomsQuery>, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createRoom: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRoomById: (req: Request<{
    id: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateRoom: (req: Request<{
    id: string;
}, {}, RoomBody>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateRoomPartial: (req: Request<{
    id: string;
}, {}, Partial<RoomBody>>, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteRoom: (req: Request<{
    id: string;
}>, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=room.controller.d.ts.map