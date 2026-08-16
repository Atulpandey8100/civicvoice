import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['infrastructure', 'safety', 'environment', 'utilities', 'transportation', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    address: String
  },
  state: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  voteCount: { type: Number, default: 0 },
  aiPriority: { type: Number, min: 1, max: 10, default: 5 },
  aiSuggestions: [String],
  aiSolution: String,
  images: [String],
  statusUpdates: [{
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved', 'closed']
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    images: [String],
    createdAt: { type: Date, default: Date.now }
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

issueSchema.index({ location: '2dsphere' });

export default mongoose.model('Issue', issueSchema);
