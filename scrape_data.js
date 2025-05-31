const axios = require('axios');
const cheerio = require('cheerio');
const { encrypt } = require('./middlewares/crypto-helper');

async function scrapeData(url) {
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const title = $('h1').first().text().trim();
    const time = $('time[datetime]').attr('datetime') || '';
    const s = $('l-labels > .c-label-item').text().trim();
 
    const category = $('.js-article-body .l-labels .c-label-item').text().trim();
    const description = $('meta[name="description"]').attr('content') || '';

    const images = [];
    $('.article-image__picture').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !images.includes(src)) {
        const hash = src.match(/\/([a-f0-9]{16})\.(?:jpe?g|png|webp)/i)?.[1];
        if (!hash) return;

        const coverUrl = `/v1/images?token=${encrypt(hash)}`;
        images.push(coverUrl);
      }
    });

    const recommended = [];
    $('article.c-article-card').each((_, el) => {
      const $el = $(el);

      const title = $el.find('.c-article-card__headline-hover-inner').text().trim();
      const url = $el.find('.c-article-card__headline').attr('href') || '';

      const category = $el.find('.article-card-info__category').text().trim();
      const categoryUrl = $el.find('.article-card-info__category').attr('href') || '';

      const time = $el.find('.article-card-info__time').text().trim();

      recommended.push({
        title,
        url,
        category,
        categoryUrl,
        time,
      });
    });

    const content = {};
    let currentSection = 'Introduction'; // Default section if no <h2> or <h3> yet

    $('.post__content').children().each((i, el) => {
      const tag = $(el).prop('tagName')?.toLowerCase();

      if (tag === 'h2' || tag === 'h3') {
        const directText = $(el).contents().filter((_, node) => node.type === 'text').text().trim();
        if (directText && !/some of their reactions/i.test(directText)) {
          currentSection = directText;
        }
      } else if (tag === 'p') {
        const paragraphParts = [];

        $(el).contents().each((_, node) => {
          if (node.type === 'text') {
            const text = $(node).text().trim();
            if (text) {
              paragraphParts.push({ type: 'text', text });
            }
          } else if (node.name === 'a') {
            const linkText = $(node).text().trim();
            const href = $(node).attr('href') || '';
            if (linkText || href) {
              paragraphParts.push({ type: 'a', text: linkText, url: href });
            }
          } else if (node.name === 'i') {
            const linkText = $(node).text().trim();
            if (linkText) {
              paragraphParts.push({ type: 'i', text: linkText });
            }
          }
        });

        if (paragraphParts.length && !/tuko|some of their reactions/i.test(JSON.stringify(paragraphParts))) {
          content[currentSection] = content[currentSection] || [];
          content[currentSection].push(paragraphParts);
        }
      } else if ($(el).hasClass('embed-container')) {
        const paragraphParts = [];

        $(el).contents().each((_, node) => {
          const $node = $(node);

          if (node.type === 'text') {
            const text = $node.text().trim();
            if (text) {
              paragraphParts.push({ type: 'text', text });
            }
          } else if (node.name === 'a') {
            const linkText = $node.text().trim();
            const href = $node.attr('href') || '';
            if (linkText || href) {
              paragraphParts.push({ type: 'a', text: linkText, url: href });
            }
          } else if (node.name === 'i') {
            const linkText = $node.text().trim();
            if (linkText) {
              paragraphParts.push({ type: 'i', text: linkText });
            }
          } else if (node.name === 'iframe') {
            const src = $node.attr('data-src') || $node.attr('src') || '';
            if (src) {
              paragraphParts.push({ type: 'iframe', url: src });
            }
          }
        });

        if (paragraphParts.length && !/tuko|some of their reactions/i.test(JSON.stringify(paragraphParts))) {
          content[currentSection] = content[currentSection] || [];
          content[currentSection].push(paragraphParts);
        }
      } else if (tag === 'ul') {
        $(el).find('li').each((i, liEl) => {
          const listParts = [];

          $(liEl).contents().each((_, node) => {
            if (node.type === 'text') {
              const text = $(node).text().trim();
              if (text) {
                listParts.push({ type: 'text', text });
              }
            } else if (node.name === 'strong') {
              $(node).contents().each((_, strongNode) => {
                if (strongNode.type === 'text') {
                  const text = $(strongNode).text().trim();
                  if (text) {
                    listParts.push({ type: 'text', text });
                  }
                } else if (strongNode.name === 'a') {
                  const linkText = $(strongNode).text().trim();
                  const href = $(strongNode).attr('href') || '';
                  if (linkText || href) {
                    listParts.push({ type: 'a', text: linkText, url: href });
                  }
                } else if (strongNode.name === 'i') {
                  const italicText = $(strongNode).text().trim();
                  if (italicText) {
                    listParts.push({ type: 'i', text: italicText });
                  }
                }
              });
            } else if (node.name === 'a') {
              const linkText = $(node).text().trim();
              const href = $(node).attr('href') || '';
              if (linkText || href) {
                listParts.push({ type: 'a', text: linkText, url: href });
              }
            } else if (node.name === 'i') {
              const italicText = $(node).text().trim();
              if (italicText) {
                listParts.push({ type: 'i', text: italicText });
              }
            }
          });

          if (listParts.length) {
            content[currentSection] = content[currentSection] || [];
            content[currentSection].push(listParts);
          }
        });
      }
    });

    const articleData = {
      title,
      url,
      category,
      time,
      description,
      images,
      content,
      recommended,
    };

    return articleData;
  } catch (err) {
    console.error('Failed to fetch article:', err.message);
    return null; // Also return null on error for caller
  }
}

module.exports = scrapeData;

if (require.main === module) {
  scrapeData('https://www.tuko.co.ke/entertainment/movies/588556-catherine-missals-movies-tv-shows-ranked-by-fans/')
    .then((data) => {
      if (data) {
        console.log(data);
      }
    })
    .catch(err => {
      console.error('Unexpected failure:', err.message);
    });
}


