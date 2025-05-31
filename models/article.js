'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Article.belongsTo(models.User, {
        as: 'author',
        foreignKey: 'authorId'
      });
      Article.belongsTo(models.Category, {
        foreignKey: 'categoryId'
      });
      Article.hasMany(models.Comment, {
        foreignKey: 'articleId',
        onDelete: 'CASCADE'
      });
      // Article.belongsToMany(models.Tag, { through: 'ArticleTags' });
    }
  }
  Article.init({
    title: DataTypes.STRING,
    slug: DataTypes.STRING,
    excerpt: DataTypes.TEXT('long'),
    status: DataTypes.ENUM('draft', 'published'),
    coverUrl: DataTypes.STRING,
    publishedAt: DataTypes.DATE,
    categoryId: DataTypes.INTEGER,
    authorId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Article',
  });
  return Article;
};