import express from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const validId = (id) => mongoose.isValidObjectId(id);

const removeImages = async (issue) => {
  for (const img of issue.images || []) {
    const filePath = path.join(UPLOADS_DIR, path.basename(img.replace('/uploads/', '')));
    fs.promises.unlink(filePath).catch(() => {});
  }
};

router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const totalIssues = await Issue.countDocuments();
    const totalUsers = await User.countDocuments();
    const pendingIssues = await Issue.countDocuments({ status: 'pending' });
    const inProgressIssues = await Issue.countDocuments({ status: 'in-progress' });
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
    const closedIssues = await Issue.countDocuments({ status: 'closed' });

    const categoryStats = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgPriority: { $avg: '$aiPriority' } } }
    ]);

    const recentIssues = await Issue.find().sort('-createdAt').limit(5).populate('author', 'name email');

    res.json({
      totalIssues,
      totalUsers,
      pendingIssues,
      inProgressIssues,
      resolvedIssues,
      closedIssues,
      categoryStats,
      recentIssues
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/role', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' });

    const { role } = req.body;
    if (!['resident', 'official', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (req.params.id === req.userId && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (target.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last admin' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' });

    if (req.params.id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (target.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
    }

    const userIssues = await Issue.find({ author: req.params.id });
    for (const issue of userIssues) await removeImages(issue);
    await Issue.deleteMany({ author: req.params.id });

    await Issue.updateMany(
      { votes: req.params.id },
      { $pull: { votes: req.params.id } }
    );
    await Issue.updateMany(
      { 'comments.user': req.params.id },
      { $pull: { comments: { user: req.params.id } } }
    );
    await Notification.deleteMany({ user: req.params.id });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User, their issues, and related data deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/issues/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid issue id' });

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    await removeImages(issue);
    await Issue.findByIdAndDelete(req.params.id);
    res.json({ message: 'Issue deleted (spam removed)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
