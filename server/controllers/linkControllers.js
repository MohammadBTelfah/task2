const crypto = require('crypto');
const Link = require('../models/links'); // تأكد اسم الملف Link.js وليس links.js

// ===== Helpers =====
const ALPHANUM = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomSlug(len = 6) {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHANUM[bytes[i] % ALPHANUM.length];
  return out;
}

function normalizeSlug(s) {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 64);
}

function isValidHttpUrl(url) {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}

// ===== Controllers =====

// POST /api/links → create new short link
exports.createLink = async (req, res) => {
  try {
    const { target, slug } = req.body || {};

    // 1) Validate URL
    if (!target || !isValidHttpUrl(target)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // 2) Normalize or generate slug
    let finalSlug =
      slug && slug.length ? normalizeSlug(slug) : randomSlug(6 + Math.floor(Math.random() * 3));

    // 3) Validate slug format
if (!finalSlug || !/^[a-z0-9-]{2,64}$/.test(finalSlug)) {
  return res.status(400).json({ error: 'Invalid slug format' });
}

    // 4) Ensure uniqueness
    for (let i = 0; i < 5; i++) {
      try {
        const doc = await Link.create({ slug: finalSlug, target });
        return res.status(201).json(doc);
      } catch (err) {
        // duplicate key
        if (err.code === 11000) {
          if (slug) return res.status(409).json({ error: 'Slug already exists' });
          finalSlug = randomSlug(6 + Math.floor(Math.random() * 3));
          continue;
        }
        throw err;
      }
    }

    return res.status(500).json({ error: 'Could not generate unique slug' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/links → list newest first
exports.listLinks = async (_req, res) => {
  try {
    const links = await Link.find({}).sort({ createdAt: -1 }).lean();
    return res.json(links);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /:slug → redirect and increment clicks
exports.redirectBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const found = await Link.findOneAndUpdate(
      { slug },
      { $inc: { clicks: 1 } },
      { new: true }
    );
    if (!found) return res.status(404).json({ error: 'Slug not found' });
    return res.redirect(302, found.target);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// ===== Optional Stretch Features =====

// DELETE /api/links/:id → delete a link
exports.deleteLink = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Link.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/links/:id → update link target
exports.updateLinkTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const { target } = req.body || {};
    if (!target || !isValidHttpUrl(target)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    const updated = await Link.findByIdAndUpdate(id, { target }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/links/:slug/stats → view stats
exports.getLinkStats = async (req, res) => {
  try {
    const { slug } = req.params;
    const link = await Link.findOne({ slug }, 'slug target clicks createdAt -_id').lean();
    if (!link) return res.status(404).json({ error: 'Link not found' });
    return res.json(link);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/links/:slug/reset-clicks → reset click count
exports.resetClickCount = async (req, res) => {
  try {
    const { slug } = req.params;
    const link = await Link.findOneAndUpdate({ slug }, { clicks: 0 }, { new: true });
    if (!link) return res.status(404).json({ error: 'Link not found' });
    return res.json(link);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};
