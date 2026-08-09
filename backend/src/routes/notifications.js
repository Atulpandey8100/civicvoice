import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const validId = (id) => mongoose.isValidObjectId(id);

router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId })
      .sort('-createdAt')
      .limit(50)
      .populate('issue', 'title');

    const unreadCount = await Notification.countDocuments({ user: req.userId, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/read', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.userId, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/read/:id', auth, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid notification id' });
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid notification id' });
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
