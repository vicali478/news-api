// routes/categoryRoutes.js
'use strict';

const express = require('express');
const router  = express.Router();
const CategoryController = require('../controllers/category.controller');

// ───────────── Collection routes ─────────────
router
  .route('/')
  .post(CategoryController.create)   // POST   /api/categories
  .get(CategoryController.list);     // GET    /api/categories

// ───────────── Single‑item routes ────────────
// Read by slug (SEO‑friendly)
router.get('/slug/:slug', CategoryController.getOne);   // GET /api/categories/slug/:slug

// Update / delete by numeric ID (or UUID if you use that)
router
  .route('/:id')
  .put(CategoryController.update)    // PUT    /api/categories/:id
  .delete(CategoryController.remove);// DELETE /api/categories/:id

module.exports = router;
