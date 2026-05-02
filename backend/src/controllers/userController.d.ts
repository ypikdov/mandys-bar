import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const getAllUsers: (req: Request, res: Response) => Promise<void>;
export declare const changeUserRole: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=userController.d.ts.map