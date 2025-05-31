'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     */
    static associate(models) {
      // define association here  
    User.hasMany(models.Article, {
    foreignKey: 'authorId',
    as: 'articles'
  });
  User.hasMany(models.Comment, {
    foreignKey: 'userId',
    as: 'comments'
  });
  User.hasMany(models.Reply, {
    foreignKey: 'userId',
    as: 'replies'
  });
  User.hasMany(models.Review, {
    foreignKey: 'userId',
    as: 'reviews'
  });
  
    User.hasMany(models.Program, {
    foreignKey: 'presenter_id',
    as: 'presentedPrograms'
  });
    }
  }
  User.init({
    role: DataTypes.ENUM('admin', 'editor', 'writer', 'reader'),
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    profile_pic: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};