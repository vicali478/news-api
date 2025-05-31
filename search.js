const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const url = 'https://www.tuko.co.ke/search/?sort=relevance&query=bonface+mwangi';

async function scrapeArticles() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Optional: Wait specifically for article containers to load
    await page.waitForSelector('article.c-article-card-horizontal');

    const html = await page.content();
    const $ = cheerio.load(html);

    const articles = [];

    $('article.c-article-card-horizontal').each((i, el) => {
        const element = $(el);

        const image = element.find('img.thumbnail-picture__img').attr('src') || '';
        const title = element.find('.c-article-card-horizontal__headline-hover-inner').text().trim();
        const link = element.find('a.c-article-card-horizontal__headline').attr('href') || '';
        const category = element.find('a.article-card-info__category').text().trim();
        const time = element.find('time.article-card-info__time').text().trim();
        const author = element.find('span.article-card-info__author').text().replace(/^by\s*/i, '').trim();
        const description = element.find('p.c-article-card-horizontal__description').text().trim();

        articles.push({
            image,
            title,
            link,
            category,
            time,
            author,
            description
        });
    });

    console.log(articles);
    await browser.close();
}

scrapeArticles();
