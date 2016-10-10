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

// ParseProxy
var ParseProxy = function() {
    this.ready = false;
}

ParseProxy.prototype.init = function(serverURL, appId, javascriptKey, masterKey) {
    // https://parseplatform.github.io/Parse-SDK-JS/api/classes/Parse.html
    Parse.initialize(appId, javascriptKey);
    Parse.serverURL = serverURL;
    this.ready = true;
}

/**
 * subscribeMessageInbound
 * http://parseplatform.github.io/docs/js/guide/#live-queries
 * @param {[type]} handler       [description]
 * @yield {[type]} [description]
 */
ParseProxy.prototype.subscribeMessageInbound = function(handler) {
    let query = new Parse.Query('MessageInbound');
    let subscription = query.subscribe();
    subscription.on('open', () => {
        debug('MessageInbound', 'subscription opened');
    });

    subscription.on('create', (message) => {
        debug('onCreate', JSON.stringify(message));
        let j = message.toJSON();
        if (!handler.onCreate) throw new Error('handler.onCreate does not exist.');
        // {
        //   "Channel": "dashboard",
        //   "createdAt": "2016-10-05T00:44:23.292Z",
        //   "updatedAt": "2016-10-05T00:44:39.720Z",
        //   "fromUserId": "foo",
        //   "type": "textMessage",
        //   "textMessage": "foo",
        //   "objectId": "18mRFSRH4X"
        // }
        if (ObjectHasKeys(j, ['fromUserId', 'type'])) {
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
}

/**
 * [createMessageInbound description]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
ParseProxy.prototype.createMessageInbound = function*(obj) {
    if (ObjectHasKeys(obj, ['fromUserId', 'type'])) {
        let MessageInbound = Parse.Object.extend("MessageInbound");
        m = new MessageInbound();
        return yield m.save(obj);
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
ParseProxy.prototype.subscribeMessageOutbound = function(handler, filters) {
    let query = new Parse.Query('MessageOutbound');
    if (filters) {
        _.each(filters, function(val, index) {
            switch (val.ref) {
                case 'equalTo':
                    query.equalTo(val.key, val.value);
                    break;
                default:
                    debug('not Implemented.');
                    break;
            }
        });
    }
    let subscription = query.subscribe();
    subscription.on('open', () => {
        debug('MessageInbound', 'subscription opened');
    });

    subscription.on('create', (message) => {
        debug('onCreate', JSON.stringify(message));
        if (!handler.onCreate) throw new Error('handler.onCreate does not exist.');
        // {
        //   "Channel": "dashboard",
        //   "createdAt": "2016-10-05T00:44:23.292Z",
        //   "updatedAt": "2016-10-05T00:44:39.720Z",
        //   "fromUserId": "foo",
        //   "type": "textMessage",
        //   "textMessage": "foo",
        //   "objectId": "18mRFSRH4X"
        // }
        if (ObjectHasKeys(message.toJSON(), ['toUserId', 'type'])) {
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
}

/**
 * [createMessageOutbound description]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
ParseProxy.prototype.createMessageOutbound = function*(obj) {
    if (ObjectHasKeys(obj, ['toUserId', 'type'])) {
        let MessageOutbound = Parse.Object.extend("MessageOutbound");
        m = new MessageOutbound();
        return yield m.save(obj);
    } else {
        throw new Error('Does not match keys.');
    }
}

/**
 * return Parse Class
 * @param  {[type]} className [description]
 * @return {[type]}           [description]
 */
ParseProxy.prototype.getParseObject = function(className) {
    return Parse.Object.extend(className);
}

/**
 * return Parse Query
 * @param  {[type]} className [description]
 * @return {[type]}           [description]
 */
ParseProxy.prototype.getParseQuery = function(classInst, filters) {
    let query = new Parse.Query(classInst);
    if (filters) {
        _.each(filters, function(val, index) {
            switch (val.ref) {
                case 'equalTo':
                    query.equalTo(val.key, val.value);
                    break;
                default:
                    debug('not Implemented.');
                    break;
            }
        });
    }
    return query;
}

exports = module.exports = new ParseProxy();
