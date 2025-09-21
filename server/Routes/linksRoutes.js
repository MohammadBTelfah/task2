// server/routes/links.js
const express = require('express');
const router = express.Router();
const linksController = require('../controllers/linkControllers');

// === Required by the task ===
// Create a new short link
router.post('/', linksController.createLink);

// Get all links (sorted by newest first)
router.get('/', linksController.listLinks);

// === Stretch (اختياري) ===
// Delete a link by id
router.delete('/:id', linksController.deleteLink);

// Update target URL of a link
router.put('/:id', linksController.updateLinkTarget);

// Get link stats by slug
router.get('/:slug/stats', linksController.getLinkStats);

// Reset click count for a link
router.post('/:slug/reset-clicks', linksController.resetClickCount);

module.exports = router;
