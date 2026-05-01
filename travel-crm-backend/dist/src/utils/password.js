"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.needsUpgrade = exports.matchPassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const hashPassword = async (password) => {
    return await bcrypt_1.default.hash(password, 8);
};
exports.hashPassword = hashPassword;
const matchPassword = async (enteredPassword, storedHash) => {
    return await bcrypt_1.default.compare(enteredPassword, storedHash);
};
exports.matchPassword = matchPassword;
const needsUpgrade = (hash) => {
    try {
        return bcrypt_1.default.getRounds(hash) > 8;
    }
    catch (error) {
        return false;
    }
};
exports.needsUpgrade = needsUpgrade;
