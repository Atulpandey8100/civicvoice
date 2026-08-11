import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";

import Issue from "../models/Issue.js";
import Notification from "../models/Notification.js";
import { auth } from "../middleware/auth.js";
import { analyzeIssue } from "../utils/gemini.js";
import { validate } from "../utils/validate.js";
import { saveUpload, removeStoredImages, imageFileFilter } from "../utils/uploads.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
  },
});

const CATEGORIES = [
  "infrastructure",
  "safety",
  "environment",
  "utilities",
  "transportation",
  "other",
];

const STATUSES = ["pending", "in-progress", "resolved", "closed"];

const SORT_FIELDS = [
  "voteCount",
  "aiPriority",
  "createdAt",
  "updatedAt",
  "title",
  "status",
  "category",
];

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

router.use(apiLimiter);

const validId = (id) => mongoose.isValidObjectId(id);

const PUBLIC_AUTHOR = "firstName lastName name role";
const PUBLIC_COMMENT_USER = "firstName lastName name role";

const uploadImages = async (files = []) => {
  const urls = [];
  for (const file of files) {
    try {
      urls.push(await saveUpload(file));
    } catch (err) {
      await removeStoredImages(urls);
      throw err;
    }
  }
  return urls;
};

const runAnalysis = (issue) => {
  analyzeIssue(issue)
    .then((aiResult) => {
      if (!aiResult || !Number.isFinite(aiResult.priority)) return;

      return Issue.findByIdAndUpdate(issue._id, {
        aiPriority: aiResult.priority,
        aiSuggestions: aiResult.suggestions,
      });
    })
    .catch(() => {});
};

const parseLocation = (location) => {
  if (typeof location === "string") {
    try {
      return JSON.parse(location);
    } catch {
      return null;
    }
  }

  return location;
};

const isValidLocation = (loc) => {
  const coords = loc?.coordinates;

  if (!Array.isArray(coords) || coords.length !== 2) {
    return false;
  }

  const [lng, lat] = coords;

  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

router.get("/", async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    let sort = String(req.query.sort || "-createdAt");
    const field = sort.startsWith("-") ? sort.slice(1) : sort;

    if (!SORT_FIELDS.includes(field)) {
      sort = "-createdAt";
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20),
    );

    const issues = await Issue.find(filter)
      .populate("author", PUBLIC_AUTHOR)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Issue.countDocuments(filter);

    res.json({
      issues,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const [totalIssues, byStatus, byCategory, recentIssues] = await Promise.all(
      [
        Issue.countDocuments(),
        Issue.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        Issue.aggregate([
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
            },
          },
        ]),
        Issue.find()
          .sort("-createdAt")
          .limit(6)
          .populate("author", PUBLIC_AUTHOR),
      ],
    );

    res.json({
      totalIssues,
      statusBreakdown: byStatus,
      categoryBreakdown: byCategory,
      recentIssues,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const issues = await Issue.find({
      author: req.userId,
    })
      .populate("author", PUBLIC_AUTHOR)
      .sort("-createdAt");

    res.json(issues);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/nearby/:lng/:lat", async (req, res) => {
  try {
    const lng = Number(req.params.lng);
    const lat = Number(req.params.lat);
    const maxDistance = Number(req.query.maxDistance ?? 5000);

    if (
      !Number.isFinite(lng) ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        error: "Invalid coordinates",
      });
    }

    if (!Number.isFinite(maxDistance) || maxDistance <= 0) {
      return res.status(400).json({
        error: "Invalid maxDistance",
      });
    }

    const issues = await Issue.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistance,
        },
      },
    }).populate("author", PUBLIC_AUTHOR);

    res.json(issues);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid issue id",
      });
    }

    const issue = await Issue.findById(req.params.id)
      .populate("author", PUBLIC_AUTHOR)
      .populate("comments.user", PUBLIC_COMMENT_USER);

    if (!issue) {
      return res.status(404).json({
        error: "Issue not found",
      });
    }

    res.json(issue);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

router.post(
  "/",
  auth,
  upload.array("images", 5),
  [
    body("title")
      .trim()
      .isLength({ min: 3, max: 120 })
      .withMessage("Title must be 3-120 characters"),
    body("description")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters"),
    body("category")
      .optional()
      .isIn(CATEGORIES)
      .withMessage("Invalid category"),
  ],
  validate,
  async (req, res) => {
    let uploadedImages = [];

    try {
      const { title, description, category } = req.body;

      const parsedLocation = parseLocation(req.body.location);

      if (!isValidLocation(parsedLocation)) {
        return res.status(400).json({
          error: "A valid location is required",
        });
      }

      uploadedImages = req.files?.length
        ? await uploadImages(req.files)
        : [];

      const issue = new Issue({
        title,
        description,
        category: category || "other",
        location: parsedLocation,
        images: uploadedImages,
        author: req.userId,
      });

      await issue.save();
      await issue.populate("author", PUBLIC_AUTHOR);

      res.status(201).json(issue);

      runAnalysis(issue);
    } catch (err) {
      await removeStoredImages(uploadedImages);
      res.status(400).json({
        error: err.message,
      });
    }
  },
);

router.put(
  "/:id",
  auth,
  upload.array("images", 5),
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 3, max: 120 })
      .withMessage("Title must be 3-120 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters"),
    body("category")
      .optional()
      .isIn(CATEGORIES)
      .withMessage("Invalid category"),
    body("status").optional().isIn(STATUSES).withMessage("Invalid status"),
  ],
  validate,
  async (req, res) => {
    let uploadedNewImages = [];

    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          error: "Invalid issue id",
        });
      }

      const issue = await Issue.findById(req.params.id);

      if (!issue) {
        return res.status(404).json({
          error: "Issue not found",
        });
      }

      const isOwner = issue.author.toString() === req.userId;

      const isOfficial =
        req.user.role === "official" || req.user.role === "admin";

      if (!isOwner && !isOfficial) {
        return res.status(403).json({
          error: "Not authorized to edit this issue",
        });
      }

      const oldStatus = issue.status;
      const allowedUpdates = {};

      if (req.body.title) {
        allowedUpdates.title = req.body.title;
      }

      if (req.body.description) {
        allowedUpdates.description = req.body.description;
      }

      if (req.body.category) {
        allowedUpdates.category = req.body.category;
      }

      if (isOfficial && req.body.status) {
        allowedUpdates.status = req.body.status;
      }

      if (req.body.location) {
        const parsedLocation = parseLocation(req.body.location);

        if (!isValidLocation(parsedLocation)) {
          return res.status(400).json({
            error: "Invalid location",
          });
        }

        allowedUpdates.location = parsedLocation;
      }

      if (req.files?.length) {
        uploadedNewImages = await uploadImages(req.files);

        const combined = [...(issue.images || []), ...uploadedNewImages];

        allowedUpdates.images = combined.slice(0, 5);

        if (combined.length > 5) {
          await removeStoredImages(combined.slice(5));
        }
      }

      Object.assign(issue, allowedUpdates);

      await issue.save();

      if (allowedUpdates.status && allowedUpdates.status !== oldStatus) {
        await Notification.create({
          user: issue.author,
          issue: issue._id,
          message: `Your issue "${issue.title}" status changed from ${oldStatus} to ${allowedUpdates.status}`,
          type: "status-change",
        });

        if (allowedUpdates.status === "resolved") {
          await Notification.create({
            user: issue.author,
            issue: issue._id,
            message: `Good news! Your issue "${issue.title}" has been resolved.`,
            type: "issue-resolved",
          });
        }
      }

      await issue.populate("author", PUBLIC_AUTHOR);

      res.json(issue);
    } catch (err) {
      await removeStoredImages(uploadedNewImages);
      res.status(400).json({
        error: err.message,
      });
    }
  },
);

router.post("/:id/vote", auth, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid issue id",
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        error: "Issue not found",
      });
    }

    const existingVote = issue.votes.indexOf(req.userId);

    if (existingVote > -1) {
      issue.votes.splice(existingVote, 1);
      issue.voteCount -= 1;
    } else {
      issue.votes.push(req.userId);
      issue.voteCount += 1;

      if (issue.author.toString() !== req.userId) {
        const hasUnread = await Notification.exists({
          user: issue.author,
          issue: issue._id,
          type: "vote",
          isRead: false,
        });

        if (!hasUnread) {
          await Notification.create({
            user: issue.author,
            issue: issue._id,
            message: `Someone voted on your issue "${issue.title}"`,
            type: "vote",
          });
        }
      }
    }

    await issue.save();
    await issue.populate("author", PUBLIC_AUTHOR);

    runAnalysis(issue);

    res.json(issue);
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
});

router.post(
  "/:id/comments",
  auth,
  [
    body("text")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Comment must be 1-1000 characters"),
  ],
  validate,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          error: "Invalid issue id",
        });
      }

      const issue = await Issue.findById(req.params.id);

      if (!issue) {
        return res.status(404).json({
          error: "Issue not found",
        });
      }

      issue.comments.push({
        user: req.userId,
        text: req.body.text.trim(),
      });

      await issue.save();

      if (issue.author.toString() !== req.userId) {
        await Notification.create({
          user: issue.author,
          issue: issue._id,
          message: `New comment on your issue "${issue.title}"`,
          type: "new-comment",
        });
      }

      await issue.populate("author", PUBLIC_AUTHOR);

      await issue.populate("comments.user", PUBLIC_COMMENT_USER);

      res.json(issue);
    } catch (err) {
      res.status(400).json({
        error: err.message,
      });
    }
  },
);

router.delete("/:id", auth, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid issue id",
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        error: "Issue not found",
      });
    }

    const isOwner = issue.author.toString() === req.userId;

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "Not authorized to delete this issue",
      });
    }

    await removeStoredImages(issue.images);
    await Issue.findByIdAndDelete(req.params.id);

    res.json({
      message: "Issue deleted",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

export default router;
