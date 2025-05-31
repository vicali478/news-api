'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
            // each comment was written by one user
            Comment.belongsTo(models.User, {
              foreignKey: 'userId',
              as: 'author'                    // optional alias
            });
      
            // each comment belongs to one article
            Comment.belongsTo(models.Article, {
              foreignKey: 'articleId'
            });
      
            // threaded replies: a comment can have many children
            Comment.hasMany(models.Comment, {
              foreignKey: 'parentId',
              as: 'replies'
            });
      
            // and belongs to one parent (self‑reference)
            Comment.belongsTo(models.Comment, {
              foreignKey: 'parentId',
              as: 'parent'
            });
    }
  }
  Comment.init({
    body: DataTypes.TEXT,
    parentId: DataTypes.INTEGER,
    articleId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Comment',
  });
  return Comment;
};