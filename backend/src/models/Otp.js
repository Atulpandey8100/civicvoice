import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: {
      type: String,
      enum: ['register', 'password-change'],
      required: true
    },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1 });

export default mongoose.model('Otp', otpSchema);
