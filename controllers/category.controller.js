// controllers/categoryController.js
/* eslint‑disable consistent-return */
'use strict';

const { Op } = require('sequelize');
const { Article, User, Category, Comment } = require('../models');
const scrape = require('../scrape');

/* ───────────── Utility ───────────── */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // spaces → ­dashes
    .replace(/[^\w\-]+/g, '')   // remove non‑word
    .replace(/\-\-+/g, '-')     // collapse dashes
    .replace(/^-+|-+$/g, '');   // trim
}

/**
 * Create a new category
 * POST /categories
 */
exports.create = async (req, res) => {
  try {
    const { name, slug } = req.body;
    const category = await Category.create({ name, slug });
    return res.status(201).json(category);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

/**
 * Get a paginated list of categories (with article count)
 * GET /categories?limit=&page=
 */
exports.list = async (req, res) => {
  try {
    const limit = +req.query.limit || 20;
    const page  = +req.query.page  || 1;
    const offset = (page - 1) * limit;

    const { rows: categories, count } = await Category.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: Article, as: 'articles', attributes: ['id'] }]
    });

    // add articleCount field without sending full article objects
    const data = categories.map(c => ({
      ...c.toJSON(),
      articleCount: c.articles.length,
      articles: undefined
    }));

    return res.json({ data, total: count, page, pages: Math.ceil(count / limit) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Get a single category (with its articles)
 * GET /categories/:id
 */
exports.getOne = async (req, res) => {
  try {
    const category = await Category.findOne({
    where: { slug: req.params.slug },
    include: [
      {
        model: Article,
        as: 'articles',
        include: [{ model: User, as: 'author', attributes: ['id', 'username'] }]
      }
    ]
  });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    const page = req.query.page || 1;
          const payload = await scrape(category.name.toLowerCase(), page, false); // don’t save file
        const rows = payload.map(item => {
      const {
        title,
        titleUrl,
        time,
        excerpt,
        coverUrl,
        category,
      } = item;

      if (!title) throw new Error('title is required');

      const slug = `${slugify(title)}-${Date.now().toString(36).slice(-5)}`;

      return {
        title,
        titleUrl,
        slug,
        excerpt,
        status: 'published',
        coverUrl,
        publishedAt: time,
        category
      };
    });
    return res.json({articles: [...category.articles, ...rows]});
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Update a category
 * PUT /categories/:id
 */
exports.update = async (req, res) => {
  try {
    const { name, slug } = req.body;
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await category.update({ name, slug });
    return res.json(category);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

/**
 * Delete a category (soft delete friendly)
 * DELETE /categories/:id
 */
exports.remove = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await category.destroy();        // or category.update({ deletedAt: new Date() })
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
