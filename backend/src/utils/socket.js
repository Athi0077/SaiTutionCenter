const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*", // allow frontend access
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);
    
    // Join a private room unique to this user
    socket.join(`user:${socket.user._id}`);

    // Join a role-based room for broadcasts (like motivational quotes)
    socket.join(`role:${socket.user.role}`);

    // Join a specific entity chat room
    socket.on("join_room", async (roomId) => {
      try {
        if (roomId.startsWith("class_")) {
          const classId = roomId.split("_")[1];
          const Class = require("../models/Class");
          const classDoc = await Class.findById(classId);
          if (!classDoc) return socket.emit("error", "Class not found");

          let authorized = false;
          if (socket.user.role === "principal") {
            authorized = true;
          } else if (socket.user.role === "student") {
            if (classDoc.students.includes(socket.user._id)) {
              authorized = true;
            }
          } else if (socket.user.role === "teacher") {
            if (classDoc.teacherId && classDoc.teacherId.toString() === socket.user._id.toString()) {
              authorized = true;
            } else {
              const TeacherAssignment = require("../models/TeacherAssignment");
              const Standard = require("../models/Standard");
              const Section = require("../models/Section");
              const standard = await Standard.findOne({ name: classDoc.standard });
              const section = await Section.findOne({ name: classDoc.section });
              if (standard && section) {
                const assignment = await TeacherAssignment.findOne({
                  teacherId: socket.user._id,
                  standardId: standard._id,
                  sectionId: section._id
                });
                if (assignment) authorized = true;
              }
            }
          }

          if (!authorized) {
            return socket.emit("error", "Not authorized to join this room");
          }
        }
        
        socket.join(roomId);
        console.log(`User ${socket.user.name} joined room: ${roomId}`);
      } catch (err) {
        console.error("Join room error:", err);
      }
    });

    // Handle sending message
    socket.on("send_message", async (data) => {
      try {
        const { roomId, text } = data;
        
        // Ensure the user is actually in the room (socket.io rooms)
        if (!socket.rooms.has(roomId)) {
          return socket.emit("error", "You must join the room first");
        }
        
        const Message = require("../models/Message");
        
        const newMessage = await Message.create({
          roomId,
          senderId: socket.user._id,
          senderName: socket.user.name,
          senderRole: socket.user.role,
          text
        });

        // Broadcast to everyone in the room (including sender to confirm)
        io.to(roomId).emit("receive_message", newMessage);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = {
  initSocket,
  getIo
};
