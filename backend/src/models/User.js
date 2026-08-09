import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  name: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  mobile: { type: String },
  address: {
    state: { type: String },
    district: { type: String }
  },
  consent: { type: Boolean, default: false },
  role: { type: String, enum: ['resident', 'official', 'admin'], default: 'resident' },
  otp: { type: String },
  otpExpires: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('firstName') || this.isModified('lastName')) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
