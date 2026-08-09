import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const NAME = process.env.ADMIN_NAME || 'CivicVoice Admin';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@civicvoice.local';
const PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
const [firstName, ...restName] = NAME.trim().split(/\s+/);
const lastName = restName.join(' ') || firstName;

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await User.findOne({ email: EMAIL });
  if (existing) {
    existing.firstName = firstName;
    existing.lastName = lastName;
    existing.role = 'admin';
    if (process.env.ADMIN_PASSWORD) {
      existing.password = PASSWORD;
    }
    await existing.save();
    console.log(`Admin user updated: ${EMAIL}`);
  } else {
    await User.create({
      firstName,
      lastName,
      email: EMAIL,
      password: PASSWORD,
      mobile: '9999999999',
      address: { state: 'Delhi', district: 'New Delhi' },
      consent: true,
      role: 'admin'
    });
    console.log(`Admin user created: ${EMAIL}`);
  }
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
