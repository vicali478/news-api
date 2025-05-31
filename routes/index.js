// src/routes/index.js   (CommonJS)

const express  = require('express');
const router   = express.Router();

// child routers
const article  = require('./articles');   // ./articles.js exports its own Router
      // ./routes/index.js exports a Router
const userRoutes = require('./users');
const webRoutes = require('./webs');
const reviewRoutes = require('./review');
const searchRoutes = require('./searchs');
const programsRouter = require('./programs');
const imageRoutes = require('./images');
const categoryRoutes = require('./categories');
router.use('/categories', categoryRoutes);

// ✅ API Routes
router.use('/users', userRoutes);
router.use('/programs', programsRouter);
router.use('/reviews', reviewRoutes);
router.use('/search',searchRoutes);
router.use('/web',webRoutes);
router.use('/images',imageRoutes);

// mount
router.use('/articles', article);


// add more:  router.use('/auth', require('./auth'));

module.exports = router;
