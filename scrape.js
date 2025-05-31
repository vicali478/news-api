// scrape-tuko.js
// npm i axios cheerio
const axios   = require('axios');
const cheerio = require('cheerio');
const fs      = require('fs');
const { encrypt } = require('./middlewares/crypto-helper');

const DEFAULT_PAGE = 1;
const DELAY_MS      = 0;      // polite delay per page (× pageNum)

/* ───────── helper ───────── */
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ───────── scrape ONE page ───────── */
async function scrapePage(category, pageNum) {
  
const BASE_URL = `https://www.tuko.co.ke/${category}`;
  const url = `${BASE_URL}/?page=${pageNum}`;
  await wait(DELAY_MS * pageNum);             // stagger requests

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const $container = $('.js-articles');
    if (!$container.length) {
      console.warn(`⚠ ${category} page ${pageNum}: .js-articles not found`);
      
    }

    const pageArticles = [];

    $container.find('article.c-article-card-horizontal').each((_, el) => {
      const $el = $(el);

      const rawSrc = $el
        .find('.c-article-card-horizontal__image img.thumbnail-picture__img')
        .attr('src') || '';

      const hash = rawSrc.match(/\/([a-f0-9]{16})\.(?:jpe?g|png|webp)/i)?.[1];
      if (!hash) return;

      const coverUrl = `/v1/images?token=${encrypt(hash)}`;

      const title = $el
        .find('.c-article-card-horizontal__headline-hover-inner')
        .text().trim();
      if (!title) return;

          const relativeUrl = $el
            .find('.c-article-card-horizontal__headline')
            .attr('href') || '';
    
          const titleUrl = new URL(relativeUrl, BASE_URL).href;

      const excerpt = $el
        .find('.c-article-card-horizontal__description')
        .text().trim();
        
          const time = $el.find('.article-card-info__time').text().trim() || null;

      pageArticles.push({ coverUrl, title, excerpt, time, titleUrl, category });
    });

        $('.c-article-card-no-border, .c-article-card-horizontal').each((_, element) => {
          const $el = $(element);
          const isHorizontal = $el.hasClass('c-article-card-horizontal');
    
          const title = $el
            .find(isHorizontal 
              ? '.c-article-card-horizontal__headline-hover-inner'
              : '.c-article-card-no-border__headline-hover-inner')
            .text()
            .trim();
    
          const relativeUrl = $el
            .find(isHorizontal 
              ? '.c-article-card-horizontal__headline'
              : '.c-article-card-no-border__headline')
            .attr('href') || '';
    
          const titleUrl = new URL(relativeUrl, BASE_URL).href;
    
          const time = $el.find('.article-card-info__time').text().trim() || null;

          const excerpt = isHorizontal
            ? $el.find('.c-article-card-horizontal__description').text().trim()
            : '';
    
          // Extract best image URL
          const imgSrcset = $el.find('img.thumbnail-picture__img').attr('srcset');
          let imageUrl = '';
          if (imgSrcset) {
            const candidates = imgSrcset.split(',').map((s) => s.trim().split(' ')[0]);
            imageUrl = candidates[candidates.length - 1]; // largest image
          } else {
            imageUrl = $el.find('img.thumbnail-picture__img').attr('src') || '';
          }
          const rawSrc = imageUrl || '';

      const hash = rawSrc.match(/\/([a-f0-9]{16})\.(?:jpe?g|png|webp)/i)?.[1];
      const coverUrl = `/v1/images?token=${encrypt(hash)}`;
    
          pageArticles.push({ title, titleUrl, time, excerpt, coverUrl, category});
        });


    console.log(`✔ ${category} page ${pageNum}: ${pageArticles.length} article(s)`);
    return pageArticles;
  } catch (err) {
    console.error(`✖ ${category} page ${pageNum} fetch error:`, err.message);
    return [];
  }
}

/* ───────── scrape an ENTIRE category ───────── */
async function scrapeTuko(category, page = DEFAULT_PAGE, saveFile = true) {
  const results  = await scrapePage(category, page);
  const articles = results;

  if (saveFile) {
    const file = `articles-${category}.json`;
    fs.writeFileSync(file, JSON.stringify(articles, null, 2));
    console.log(`✅ saved ${articles.length} article(s) to ${file}`);
  }

  return articles;               // also return data to caller
}

module.exports = scrapeTuko;

/* ───────── CLI support: node scrape-tuko politics 20 ───────── */
if (require.main === module) {
  const [category = 'politics', pages = DEFAULT_PAGE] = process.argv.slice(2);
  scrapeTuko(category, Number(pages)).catch(err => {
    console.error('Unexpected failure:', err.message);
  });
}