const http = require('http');
const url = require('url');
const cheerio = require('cheerio');

const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));

const config = require('./config');

http.createServer((req, res) => {

    const {method} = req;
    let route = url.parse(req.url, true);

    if (
        method === 'GET' &&
        (route.pathname === config.title_route || route.pathname === (config.title_route + '/'))
    ) {

        let addresses = getAddresses(route.query);

        getTitles(addresses)
            .then(titles => writeTitlesPage(res, titles))
            .catch(err => {
                console.log('Error occurred:', err);

                res.writeHead(500, {'Content-Type': 'text/html'});
                res.end('Internal Server Error');
            });


    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('404 Not Found!');
    }

}).listen(8000);

const getAddresses = query => {
    let {address: addresses} = query;

    if (!addresses) return [];

    addresses = typeof addresses == 'string' ? [addresses] : addresses;

    return addresses;
}
const fixURL = rawUrl => {

    let protocolPortion = rawUrl.substr(0, 8);

    if (!protocolPortion.includes('http://') && !protocolPortion.includes('https://'))
        return 'http://' + rawUrl;
    else
        return rawUrl;

}
const getTitle = (html) => {
    const $ = cheerio.load(html);
    return $('title').text();
}
const getTitles = async (addresses) => {

    if (addresses.length === 0) {
        return [];
    }

    let titles = [];

    for (let i = 0; i < addresses.length; i++) {

        let address = fixURL(addresses[i]);

        try {
            let response = await request.getAsync(address);
            let title = getTitle(response.body);
            titles.push(`${address} - ${title}`);

        } catch (err) {
            titles.push(`${address} - ${config.error_msg}`);
        }
    }

    return titles;
}
const writeTitlesPage = (res, rawTitles) => {

    let titles = '';
    for (let i = 0; i < rawTitles.length; i++) {
        titles += `<li>${rawTitles[i]}</li>`;
    }

    res.writeHead(200, {'Content-Type': 'text/html'});

    res.end(`
        <html>
        <head></head>
        <body>
            <h1> Following are the titles of given websites: </h1>
            <ul>
                    ${titles}
            </ul>
        </body>
        </html>
    `);

}

