/**
 * Parse Server client
 */

const Parse = require('parse/node').Parse,
    debug = require('debug')('parse.proxy'),
    Q = require('q'),
    _ = require('lodash');

/**
 * LoDash _.has for multiple keys
 * http://stackoverflow.com/questions/29001762/lodash-has-for-multiple-keys
 * @param {[type]} obj  [description]
 * @param {[type]} keys [description]
 */
function ObjectHasKeys(obj, keys) {
    return _.every(keys, _.partial(_.has, obj));
}

/**
 * 
 * @param {any} query
 * @param {any} filters
 */
function buildFilters(q, filters) {
    _.each(filters, function (val, index) {
        switch (val.ref) {
            case 'equalTo':
                q.equalTo(val.key, val.val);
                break;
            case 'notEqualTo':
                q.notEqualTo(val.key, val.val);
                break;
            case 'greaterThan':
                q.greaterThan(val.key, val.val);
                break;
            case 'greaterThanOrEqualTo':
                q.greaterThanOrEqualTo(val.key, val.val);
                break;
            case 'limit':
                q.limit(val.val);
                break;
            case 'skip':
                q.skip(val.val);
                break;
            case 'lessThan':
                q.lessThan(val.key, val.val);
                break;
            case 'lessThanOrEqualTo':
                q.lessThanOrEqualTo(val.key, val.val);
                break;
            case 'containedIn':
                q.containedIn(val.key, val.val);
                break;
            case 'ascending':
                q.ascending(val.val);
                break;
            case 'descending':
                q.descending(val.val);
                break;
            default:
                debug('not Implemented.');
                break;
        }
    });
    return q;
}

// ParseProxy
var ParseProxy = function () {
    this.ready = false;
}

ParseProxy.prototype.init = function (serverURL, appId, javascriptKey, masterKey) {
    // https://parseplatform.github.io/Parse-SDK-JS/api/classes/Parse.html
    Parse._initialize(appId, javascriptKey, masterKey);
    Parse.serverURL = serverURL;
    this.ready = true;
}

/**
 * subscribeMessageInbound
 * http://parseplatform.github.io/docs/js/guide/#live-queries
 * @param {[type]} handler       [description]
 * @yield {[type]} [description]
 */
ParseProxy.prototype.subscribeMessageInbound = function (handler, filters) {
    let query = new Parse.Query('MessageInbound');
    // build query with filters
    if (filters) {
        query = buildFilters(query, filters);
    }

    let subscription = query.subscribe();
    subscription.on('open', () => {
        debug('MessageInbound', 'subscription opened');
    });

    subscription.on('create', (message) => {
        debug('onCreate', JSON.stringify(message));
        let j = message.toJSON();
        if (!handler.onCreate) throw new Error('handler.onCreate does not exist.');
        if (ObjectHasKeys(j, ['fromUserId', 'channel'])) {
            handler.onCreate(message);
        } else {
            debug('onCreate', 'discard message', j);
        }
    });

    subscription.on('update', (message) => {
        debug('onUpdate', JSON.stringify(message));
        if (handler.onUpdate)
            handler.onUpdate(message);
    });

    subscription.on('enter', (object) => {
        debug('onEnter', JSON.stringify(message));
        if (handler.onEnter)
            handler.onEnter(message);
    });

    subscription.on('delete', (object) => {
        debug('onDelete', JSON.stringify(message));
        if (handler.onDelete)
            handler.onDelete(message);
    });

    subscription.on('close', () => {
        debug('onClose');
        if (handler.onClose)
            handler.onClose();
    });
    return subscription;
}

/**
 * Get MessageInbound by Id.
 * return Promise
 */
ParseProxy.prototype.getMessageInboundById = function (objectId) {
    let q = new Parse.Query('MessageInbound');
    return q.get(objectId);
}

/**
 * [createMessageInbound description]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
ParseProxy.prototype.createMessageInbound = function (obj) {
    if (ObjectHasKeys(obj, ['fromUserId', 'channel'])) {
        let MessageInbound = Parse.Object.extend("MessageInbound");
        m = new MessageInbound();
        return m.save(obj);
    } else {
        throw new Error('Does not match keys.');
    }
}

/**
 * subscribeMessageOutbound
 * http://parseplatform.github.io/docs/js/guide/#live-queries
 * @param {[type]} handler       [description]
 * @param {[array]} filters       [description]
 * @yield {[type]} [description]
 */
ParseProxy.prototype.subscribeMessageOutbound = function (handler, filters) {
    let query = new Parse.Query('MessageOutbound');
    if (filters) {
        query = buildFilters(query, filters);
    }
    let subscription = query.subscribe();
    subscription.on('open', () => {
        debug('MessageOutbound', 'subscription opened');
    });

    subscription.on('create', (message) => {
        debug('onCreate', JSON.stringify(message));
        if (!handler.onCreate) throw new Error('handler.onCreate does not exist.');
        if (ObjectHasKeys(message.toJSON(), ['toUserId', 'channel'])) {
            handler.onCreate(message);
        } else {
            debug('onCreate', 'discard message', message);
        }
    });

    subscription.on('update', (message) => {
        debug('onUpdate', JSON.stringify(message));
        if (handler.onUpdate)
            handler.onUpdate(message);
    });

    subscription.on('enter', (object) => {
        debug('onEnter', JSON.stringify(message));
        if (handler.onEnter)
            handler.onEnter(message);
    });

    subscription.on('delete', (object) => {
        debug('onDelete', JSON.stringify(message));
        if (handler.onDelete)
            handler.onDelete(message);
    });

    subscription.on('close', () => {
        debug('onClose');
        if (handler.onClose)
            handler.onClose();
    });
    return subscription;
}

/**
 * [createMessageOutbound description]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
ParseProxy.prototype.createMessageOutbound = function (obj) {
    if (ObjectHasKeys(obj, ['toUserId', 'channel'])) {
        let MessageOutbound = Parse.Object.extend("MessageOutbound");
        m = new MessageOutbound();
        return m.save(obj);
    } else {
        throw new Error('Does not match keys.');
    }
}

/**
 * return Parse Class
 * @param  {[type]} className [description]
 * @return {[type]}           [description]
 */
ParseProxy.prototype.getParseObject = function (className) {
    return Parse.Object.extend(className);
}

/**
 * get Parse.User
 * @return {[type]} [description]
 */
ParseProxy.prototype.getParseUser = function () {
    return Parse.User;
}

/**
 * return Parse Query
 * @param  {[type]} className [description]
 * @return {[type]}           [description]
 */
ParseProxy.prototype.getParseQuery = function (classInst, filters) {
    let query = new Parse.Query(classInst);
    if (filters) {
        query = buildFilters(query, filters);
    }
    return query;
}

//https://parseplatform.github.io/docs/js/guide/#config
ParseProxy.prototype.getConfig = function () {
    // return Promise
    return Parse.Config.get();
}

/**
 * https://parseplatform.github.io/Parse-SDK-JS/api/classes/Parse.Error.html
 */
ParseProxy.prototype.getParseError = function(){
    return Parse.Error
}

exports = module.exports = new ParseProxy();
