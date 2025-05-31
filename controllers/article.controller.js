// controllers/articleController.js
/* eslint‑disable consistent-return */
'use strict';

const path = require('path');
const { Op } = require('sequelize');
const { Article, User, Category, Comment, Review, Reply } = require('../models');
const scrape = require('../scrape_data');

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

/* ───────────── CREATE ───────────── */
/**
 * POST /articles
 */
exports.create = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      status = 'draft',
      categoryId,
      publishedAt,
    } = req.body;

    const authorId = req.userData?.userId || req.body.authorId; // from auth middleware or body

    const newSlug =
      `${slugify(title)}-${Date.now().toString(36).slice(-5)}`; // unique-ish

    const article = await Article.create({
      title,
      slug: newSlug,
      excerpt,
      status,
      coverUrl: req.image,
      publishedAt: status === 'published' ? publishedAt || new Date() : null,
      categoryId,
      authorId,
    });

    return res.sendFile(path.join(__dirname, '../public/news.html'));
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.bulkCreate = async (req, res) => {
  try {
    const category = await Category.findByPk(req.query.loadId);
    const payload = await scrape(category.name.toLowerCase(), 15, false); // don’t save file

    if (!payload.length) {
      return res.status(400).json({ message: 'body is empty' });
    }

    const rows = payload.map(item => {
      const {
        title,
        excerpt,
        coverUrl,
      } = item;

      if (!title) throw new Error('title is required');

      const slug = `${slugify(title)}-${Date.now().toString(36).slice(-5)}`;

      return {
        title,
        slug,
        excerpt,
        status: 'published',
        coverUrl,
        publishedAt: new Date(),
        categoryId: category.id,
        authorId: 1,
      };
    });

    // const created = await Article.bulkCreate(rows, {
    //   validate: true,
    //   returning: true,
    // });

    return res
      .status(201)
      .json(rows);

  } catch (err) {
    console.error('article bulkCreate error:', err);
    return res.status(400).json({ message: err.message });
  }
};


/* ───────────── LIST ───────────── */
/**
 * GET /articles?status=&category=&author=&page=&limit=
 */
exports.list = async (req, res) => {
  try {
    const limit = +req.query.limit || 20;
    const page = +req.query.page || 1;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.category) where.categoryId = req.query.category;
    if (req.query.author) where.authorId = req.query.author;
    if (req.query.q)
      where.title = { [Op.iLike]: `%${req.query.q.trim()}%` };

    const { rows, count } = await Article.findAndCountAll({
      where,
      limit,
      offset,
      order: [['publishedAt', 'DESC']],
      distinct: true, // needed when include hasMany
      include: [
        { model: User, as: 'author', attributes: ['id', 'username'] },
        { model: Category, attributes: ['id', 'name', 'slug'] },
        { model: Comment, attributes: ['id'] },
      ],
    });

    const data = rows.map((a) => ({
      ...a.toJSON(),
      commentCount: a.Comments?.length || 0,
      Comments: undefined,
    }));

    return res.json({
      data,
      total: count,
      page,
      pages: Math.ceil(count / limit),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ───────────── GET ONE ───────────── */
/**
 * GET /articles/slug/:slug
 */
exports.getBySlug = async (req, res) => {
  try {
    const article = await Article.findOne({
      where: { slug: req.params.slug },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'profile_pic'] },
        { model: Category, attributes: ['id', 'name', 'slug'] },
        {
          model: Comment,
          include: [{ model: User, as: 'author', attributes: ['id', 'username', 'profile_pic'] }],
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    return res.json(article);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getByUrl = async (req, res) => {
  try {
    const article = await await scrape(req.query.url); // don’t save file;
    if (!article) return res.status(404).json({ message: 'Article not found' });
    article.author = await User.findByPk(1);
    const comments = await Review.findAll({
      where: { contentTitle: article.url },
      include: [{ model: User, as: 'user' }],
      order: [['submittedAt', 'DESC']]
    });
    article.comments = await Promise.all(
      comments.map(async (comment) => {
        if (comment.userId === 0 || !comment.user) {
          comment.user = {
            username: 'Guest',
            profile_pic: 'https://t3.ftcdn.net/jpg/06/33/54/78/240_F_633547842_AugYzexTpMJ9z1YcpTKUBoqBF0CUCk10.jpg'
          };
        }
        return comment;
      })
    );
    return res.json(article);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ───────────── UPDATE ───────────── */
/**
 * PUT /articles/:id
 */
exports.update = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      status,
      categoryId,
      publishedAt,
    } = req.body;

    const coverUrl = req.image;
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    // Optionally check ownership/roles here

    await article.update({
      title,
      slug: slug || article.slug,
      excerpt,
      status,
      coverUrl,
      categoryId,
      publishedAt:
        status === 'published'
          ? publishedAt || article.publishedAt || new Date()
          : article.publishedAt,
    });

    return res.json(article);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

/* ───────────── DELETE ───────────── */
/**
 * DELETE /articles/:id
 */
exports.remove = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    await article.destroy(); // cascade deletes comments if FK has onDelete: 'CASCADE'
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
