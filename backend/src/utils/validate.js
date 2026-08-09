import fs from 'fs';
import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    for (const file of req.files || []) {
      fs.promises.unlink(file.path).catch(() => {});
    }
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};
