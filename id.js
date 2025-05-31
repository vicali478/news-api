const axios = require('axios');
const cheerio = require('cheerio');

async function getIframeSrc(id) {
    const url = `https://ww1.goojara.to/${id}?p=97033&h=1&ic=true&io=QUk1bFBNaUNTM2Q5SmZuM0p6ZXcvaXRLeVBTVHBIcTlWTERYZytPNFBUYUtndjRJMHhOY3pFVWY4SjRUNld4cTU2NW15RS9qKzhCOWR0TVl4US9GV2MzeHZwUnRJWCtaK0E9PQ--`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36',
                'Referer': 'https://ww1.goojara.to/',
                'Cookie': 'aGooz=qcjpgcrelr459cs75lb5l4n6h3; a920f36a=8e4f909bb52f4a945ac681; _aa40=9949193CC6D44B2BD1F4424C492514CB8135EAD9'
            }
        });

        const $ = cheerio.load(response.data);
        const iframe = $('iframe');

        if (iframe.length > 0) {
            const src = iframe.attr('src');
            return src;  // Return the iframe src
        } else {
            return null; // Return null if no iframe found
        }
    } catch (error) {
        console.error('Error fetching iframe src:', error.message);
        return null; // Return null on error
    }
}

async function fetchVideoLink(pageUrl) {
    const payload = new URLSearchParams({ qdfx: '1' }).toString();

    try {
        // Step 1: POST to page URL and get HTML
        const response = await axios.post(pageUrl, payload);
        const html = response.data;

        // Step 2: Parse HTML to get vd and tk from script
        const $ = cheerio.load(html);
        let vd, tk;

        $('script').each((i, el) => {
            const scriptText = $(el).html();
            if (scriptText.includes('var vd=') && scriptText.includes('tk=')) {
                // Extract vd and tk using regex
                const vdMatch = scriptText.match(/var vd="([^"]+)"/);
                const tkMatch = scriptText.match(/tk="([^"]+)"/);
                if (vdMatch && tkMatch) {
                    vd = vdMatch[1];
                    tk = tkMatch[1];
                }
            }
        });

        if (!vd || !tk) {
            throw new Error('Could not find vd or tk in scripts');
        }

        // Step 3: Construct the grabm URL
        const grabUrl = `https://web.wootly.ch/grabm?t=${encodeURIComponent(tk)}&id=${encodeURIComponent(vd)}`;

        // Step 4: GET the grabm URL to get the actual video source link or content
        const videoResponse = await axios.get(grabUrl, { headers: { Referer: pageUrl } });

        // The response likely contains the video URL or a direct video source
        return {url: videoResponse.data.slice(0, 500), grabUrl, response: html.toString()};

    } catch (error) {
        console.error('Error:', error.message);
    }
}


exports.id = async (req, res) => {
    const link = await getIframeSrc(req.params.id);
    const url = await fetchVideoLink(link);
    return res.json({
        url,
        link
    });
}
