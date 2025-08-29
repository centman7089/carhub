import Notification from "../models/Notification.js"

const getNotifications = async (req, res) => {
  const notifications = await Notification.find({
    $or: [{ user: req.user.id }, { role: req.user.role }],
  }).sort({ createdAt: -1 });

  res.json(notifications);
};

const markAsRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ message: 'Marked as read' });
};

export {getNotifications,markAsRead}
