const http = require('http');
const url = require('url');
const cheerio = require('cheerio');
const request = require('request');
const async = require('async');

const config = require('./config');

http.createServer((req, res) => {

    const {method} = req;
    let route = url.parse(req.url, true);

    if (
        method === 'GET' &&
        (route.pathname === config.title_route || route.pathname === (config.title_route + '/'))
    ) {
        async.waterfall(
            [
                (cb) => getAddresses(route.query, cb),
                getTitles,
            ],
            (err, titles) => {
                if (err) {
                    console.log('Error occurred:', err);

                    res.writeHead(500, {'Content-Type': 'text/html'});
                    res.end('Internal Server Error');
                } else {
                    writeTitlesPage(res, titles)
                }
            }
        )

    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('404 Not Found!');
    }

}).listen(8000);

const getAddresses = (query, callback) => {
    let {address: addresses} = query;

    if (!addresses) return callback(null, []);

    addresses = typeof addresses == 'string' ? [addresses] : addresses;

    callback(null, addresses);
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
const getTitles = (addresses, callback) => {

    if (addresses.length === 0) {
        return callback(null, []);
    }

    let titles = [];

    async.each(addresses, (rawAddress, cb) => {

        let address = fixURL(rawAddress);

        request.get(address, (err, res, body) => {
            if (err) {
                titles.push(`${address} - ${config.error_msg}`);
            } else {
                let title = getTitle(body);
                titles.push(`${address} - ${title}`);
            }

            return cb();
        });

    }, (err) => {
        if (err)
            console.log(err);
        else
            callback(null, titles);
    });

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

