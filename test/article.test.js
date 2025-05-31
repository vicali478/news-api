
const request = require('supertest');
const app = require('../app.js');

describe('Articles', () => {
  it('lists articles', async () => {
    const { body } = await request(app).get('/v1/articles').expect(200);
    expect(Array.isArray(body.rows)).toBe(true);
  });
});
