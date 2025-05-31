'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Program extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Program.belongsTo(models.User, {
        foreignKey: 'presenter_id',
        as: 'presenter'
      });
    }
  }
  
  Program.init({
    day: DataTypes.STRING,
    from: DataTypes.TIME,
    to: DataTypes.TIME,
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    presenter_id: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Program',
  });
  return Program;
};