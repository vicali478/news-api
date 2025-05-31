const { Article, User, Category } = require('../models');
const { Op } = require('sequelize');

/*────────────  LIST ARTICLES  ────────────*/
async function list({ page = 1, limit = 10, search } = {}) {
  const where = {};

  // MySQL: use Op.like (case‑insensitive by default)
  if (search) where.title = { [Op.like]: `%${search}%` };

  const { rows, count } = await Article.findAndCountAll({
    where,
    include: [
      { model: User, as: 'author', attributes: ['id', 'name'] },
      { model: Category, attributes: ['id', 'name', 'slug'] }
    ],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['publishedAt', 'DESC']]
  });

  return { total: count, page: +page, rows };
}

/*────────────  ARTICLE BY SLUG  ────────────*/
async function getArticleBySlug(slug) {
  return Article.findOne({
    where: { slug },
    include: [
      { model: User, as: 'author', attributes: ['id', 'name'] },
      { model: Category, attributes: ['id', 'name', 'slug'] }
    ]
  });
}

/*────────────  CATEGORY BY SLUG + ARTICLES  ────────────*/
async function getCategoryBySlug(slug) {
  return Category.findOne({
    where: { slug },
    include: [
      {
        model: Article,
        as: 'articles',
        include: [{ model: User, as: 'author', attributes: ['id', 'username'] }]
      }
    ]
  });
}

/*────────────  ARTICLE BY ID  ────────────*/
async function getById(id) {
  return Article.findOne({
    where: { id },
    include: [
      { model: User, as: 'author', attributes: ['id', 'name'] },
      { model: Category, attributes: ['id', 'name', 'slug'] }
    ]
  });
}

/*────────────  CRUD HELPERS  ────────────*/
const create  = (data)      => Article.create(data);
const update  = async (id, data) => (await Article.update(data, { where: { id } }), getById(id));
const remove  = (id)        => Article.destroy({ where: { id } });

module.exports = {
  list,
  getArticleBySlug,
  getCategoryBySlug,
  getById,
  create,
  update,
  remove
};
