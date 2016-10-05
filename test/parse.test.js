/**
 * Philly Logic Server.
 * secure requests for API calls.
 */
const test = require('ava');
const parseProxy = require('../');
const conf = require('./conf.js');

test.cb('ParseProxy#init', t => {
    parseProxy.init(conf.parse.serverUrl, conf.parse.appId, conf.parse.javascriptKey)
    t.pass();
    t.end();
});
