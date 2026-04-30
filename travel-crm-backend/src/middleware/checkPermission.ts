import { Request, Response, NextFunction } from 'express';
import { IUserPermissions } from '../models/User';

export const checkPermission = (permissionPath: keyof IUserPermissions | string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.permissions) {
            return res.status(403).json({ message: 'Access denied: No permissions found.' });
        }

        // Allow ADMIN role bypass for backward compatibility during transition
        if (req.user.role === 'ADMIN') {
            return next();
        }

        const permissions: any = req.user.permissions;
        const keys = permissionPath.split('.');
        
        let currentObj = permissions;
        for (const key of keys) {
            if (currentObj[key] === undefined) {
                return res.status(403).json({ message: `Access denied: Missing permission '${permissionPath}'.` });
            }
            currentObj = currentObj[key];
        }

        if (currentObj === true) {
            return next();
        }

        if (typeof currentObj === 'string' && currentObj !== 'none') {
             // For string permissions like leadVisibility ('all', 'own')
            return next();
        }

        return res.status(403).json({ message: `Access denied: Insufficient permission '${permissionPath}'.` });
    };
};
