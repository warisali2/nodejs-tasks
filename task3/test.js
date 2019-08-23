let expect = require('chai').expect;
let should = require('chai').should();
let cheerio = require('cheerio');
let request = require('request');

let host = 'http://localhost:8000';

describe('Titles Page', () => {

    it('should return 404 when route is not /I/want/title', (done) => {

        let address = `${host}/notvalidlink`;

        request.get(address, (err, res, body) => {
            res.statusCode.should.equal(404);
            done();
        });
    });

    it('should return 200 when route is /I/want/title', (done) => {

        let address = `${host}/I/want/title`;

        request.get(address, (err, res, body) => {
            res.statusCode.should.equal(200);
            done();
        });
    });

    it('should return title of page google', (done) => {
        let address = `${host}/I/want/title/?address=google.com`;

        request.get(address, (err, res, body) => {

            let $ = cheerio.load(body);
            let li = $('li').text();

            li.should.equal('http://google.com - Google');
            done();
        });
    });

    it('should return page with titles of all links', (done) => {
        let address = `${host}/I/want/title/?address=google.com&address=bing.com`;

        request.get(address, (err, res, body) => {

            let $ = cheerio.load(body);
            let titles = [];
            $('li').each(function(i, elem) {
                titles[i] = $(this).text();
            });

            let correctTitles = ['http://google.com - Google', 'http://bing.com - Bing'];

            expect(titles).to.have.same.members(correctTitles);
            done();
        });
    });

    it('should return page with NO RESPONSE as title for invalid links', (done) => {
        let address = `${host}/I/want/title/?address=google.com&address=asdfasdf`;

        request.get(address, (err, res, body) => {

            let $ = cheerio.load(body);
            let titles = [];
            $('li').each(function(i, elem) {
                titles[i] = $(this).text();
            });

            let correctTitles = ['http://google.com - Google', 'http://asdfasdf - NO RESPONSE'];

            expect(titles).to.have.same.members(correctTitles);
            done();
        });
    });
});