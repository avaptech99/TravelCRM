import jwt from 'jsonwebtoken';
import { IUser, IUserPermissions } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export type JwtPayload = {
    id: string;
    role: string;
    name: string;
    email: string;
    permissions?: IUserPermissions;
};

export const generateToken = (user: IUser): string => {
    return jwt.sign(
        { id: user._id, role: user.role, name: user.name, email: user.email, permissions: user.permissions },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
};

export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
