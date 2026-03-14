import bcrypt from 'bcrypt';
import { Worker } from 'worker_threads';
import path from 'path';

export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
};

export const matchPassword = (
    enteredPassword: string,
    storedHash: string
): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const workerPath = path.resolve(__dirname, 'bcryptWorker.ts');
        
        // In production, we might need to point to the .js file if using ts-node-dev or tsc
        // But for dev with ts-node-dev, this works if configured correctly.
        // A more robust way is to use a helper that handles both.
        const worker = new Worker(
            `
            const { parentPort, workerData } = require('worker_threads');
            const bcrypt = require('bcrypt');
            bcrypt.compare(workerData.password, workerData.hash)
                .then(result => parentPort.postMessage(result))
                .catch(err => parentPort.postMessage(err));
            `,
            {
                eval: true,
                workerData: { password: enteredPassword, hash: storedHash }
            }
        );

        worker.on('message', (result) => {
            if (result instanceof Error) reject(result);
            else resolve(result);
            worker.terminate();
        });

        worker.on('error', (err) => {
            reject(err);
            worker.terminate();
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
};
