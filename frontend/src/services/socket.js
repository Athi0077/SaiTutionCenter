import { io } from 'socket.io-client';

let socket;

export const initSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }
  
  const socketUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');
  socket = io(socketUrl, {
    auth: {
      token
    }
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
