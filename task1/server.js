const http = require('http');
const url = require('url');
const cheerio = require('cheerio');
const events = require('events');
const request = require('request');

const config = require('./config');

const eventEmitter = new events.EventEmitter();
const EVENT_TITLES_FETCHED = 'titles fetched';

http.createServer((req, res) => {

    const {method} = req;
    let route = url.parse(req.url, true);

    if (
        method === 'GET' &&
        (route.pathname === config.title_route || route.pathname === (config.title_route + '/'))
    ) {

        eventEmitter.on(EVENT_TITLES_FETCHED, (titles) => writeTitlesPage(res, titles));

        let addresses = getAddresses(route.query);
        getTitles(addresses);

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
const getTitles = (addresses) => {
    if(addresses.length === 0)
    {
        eventEmitter.emit(EVENT_TITLES_FETCHED, addresses);
        return;
    }

    let titles = [];
    for (let i = 0; i < addresses.length; i++) {
        let address = fixURL(addresses[i]);

        request.get(address, (err, res, body) => {
            if (err) {
                console.log('Http Request Error: ', err);
                titles.push(`${address} - ${config.error_msg}`);

                if (titles.length === addresses.length) {
                    eventEmitter.emit(EVENT_TITLES_FETCHED, titles);
                }
            } else {
                let title = getTitle(body);
                titles.push(`${address} - ${title}`);

                if (titles.length === addresses.length) {
                    eventEmitter.emit(EVENT_TITLES_FETCHED, titles);
                }
            }
        });
    }
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

