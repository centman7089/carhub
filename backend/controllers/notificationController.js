// import Notification from "../models/Notification.js"

// const getNotifications = async (req, res) => {
//   const notifications = await Notification.find({
//     $or: [{ user: req.user.id }, { role: req.user.role }],
//   }).sort({ createdAt: -1 });

//   res.json(notifications);
// };

// const markAsRead = async (req, res) => {
//   await Notification.findByIdAndUpdate(req.params.id, { read: true });
//   res.json({ message: 'Marked as read' });
// };

// export {getNotifications,markAsRead}

import Notification from "../models/Notification.js";

// ✅ Create notification
export const createNotification = async (req, res) => {
  try {
    const { dealerId, message, type, roleTarget } = req.body;

    const notification = new Notification({
      user: dealerId,
      message,
      type,
      roleTarget,
    });

    await notification.save();

    // 🔔 Emit real-time notification via Socket.IO
    if (req.io) {
      req.io.to(dealerId.toString()).emit("notification", notification);
    }

    return res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const dealerId = req.params.dealerId;

    const notifications = await Notification.find({ user: dealerId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Mark as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    return res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("❌ Error updating notification:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

