import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: any): SocketIOServer => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: '*', // Allow all origins (tightened in production if needed)
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log(`[Socket.io] Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`[Socket.io] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = (): SocketIOServer => {
    if (!io) {
        throw new Error('Socket.io not initialized! Call initSocket(httpServer) first.');
    }
    return io;
};
