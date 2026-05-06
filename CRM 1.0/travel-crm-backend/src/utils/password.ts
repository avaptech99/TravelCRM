import bcrypt from 'bcrypt';

export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 8);
};

export const matchPassword = async (
    enteredPassword: string,
    storedHash: string
): Promise<boolean> => {
    return await bcrypt.compare(enteredPassword, storedHash);
};

export const needsUpgrade = (hash: string): boolean => {
    try {
        return bcrypt.getRounds(hash) > 8;
    } catch (error) {
        return false;
    }
};
