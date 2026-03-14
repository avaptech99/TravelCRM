import { parentPort, workerData } from 'worker_threads';
import bcrypt from 'bcrypt';

if (!parentPort) {
    process.exit(1);
}

const { password, hash } = workerData;

bcrypt.compare(password, hash)
    .then((result) => {
        parentPort?.postMessage(result);
    })
    .catch((error) => {
        parentPort?.postMessage(error);
    });
