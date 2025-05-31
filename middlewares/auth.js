const jwt  = require('jsonwebtoken');
const { User } = require('../models');    // Sequelize’s index.js already exports all models


export default (role='reader') => async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token');

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) throw new Error('User not found');

    if (role !== 'reader' && user.role !== role && user.role !== 'admin')
      throw new Error('Forbidden');

    req.user = user;
    next();
  } catch (e) {
    e.status = 401;
    next(e);
  }
};
