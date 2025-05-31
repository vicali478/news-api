// routes/articleRoutes.js
'use strict';

const express = require('express');
const multer  = require('multer');
const router  = express.Router();

const ArticleController   = require('../controllers/article.controller');
const checkAuthMiddleware = require('../middlewares/check-auth');
const { upLoadImage } = require('../middlewares/uploadMiddleware'); // adjust name/path if needed

/* ---------- Multer setup ---------- */
const upload = multer({ dest: 'temp/' });
// one picture per request (create & update)
const image = upload.fields([{ name: 'image', maxCount: 1 }]);

/* ---------- Routes ---------- */

router.post(
  '/create',
  checkAuthMiddleware.admin,
  image,
  upLoadImage,
  ArticleController.create
);

// LIST  (public)
router.get('/', ArticleController.list);

// READ by slug  (public)
router.get('/slug/:slug', ArticleController.getBySlug);
router.get('/url', ArticleController.getByUrl);
router.get('/category', ArticleController.bulkCreate);

// UPDATE  (auth + profile pic)
router.put(
  '/:id',
  checkAuthMiddleware.admin,
  image,
  upLoadImage,
  ArticleController.update
);

// DELETE  (auth)
router.delete(
  '/:id',
  checkAuthMiddleware.admin,
  ArticleController.remove
);

module.exports = router;
