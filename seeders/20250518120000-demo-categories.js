'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Categories', [
      {
        name: 'YJK Top Stories',
        slug: 'yjk-top-stories',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Politics',
        slug: 'politics',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Technology',
        slug: 'technology',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Education',
        slug: 'education',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Entertainment',
        slug: 'entertainment',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Sports',
        slug: 'sports',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Categories', null, {});
  }
};
