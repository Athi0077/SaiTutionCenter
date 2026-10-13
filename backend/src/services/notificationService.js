const Notification = require("../models/Notification");
const User = require("../models/User");
const { getIo } = require("../utils/socket");
const admin = require("../config/firebaseInit");

const createNotification = async ({
  recipientId,
  senderId,
  type,
  title,
  message,
  relatedId,
  relatedModel
}) => {
  try {
    const notification = await Notification.create({
      recipientId,
      senderId,
      type,
      title,
      message,
      relatedId,
      relatedModel
    });

    const io = getIo();
    io.to(`user:${recipientId}`).emit("notification:new", notification);

    // Send FCM Web Push Notification
    const user = await User.findById(recipientId).select("fcmTokens");
    if (user && user.fcmTokens && user.fcmTokens.length > 0) {
      const { getMessaging } = require('firebase-admin/messaging');
      
      const messageObj = {
        notification: {
          title: title || "New Notification",
          body: message || "You have a new message",
        },
        data: {
          type: type || "general",
          relatedId: String(relatedId || ""),
          url: "/"
        },
        tokens: user.fcmTokens
      };
      
      try {
        await getMessaging().sendEachForMulticast(messageObj);
      } catch (fcmError) {
        console.error("FCM Push Error:", fcmError);
      }
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

module.exports = { createNotification };
