(function (module, exports, fn) {
    if (typeof module === 'undefined') {
        module = {
            exports: {}
        };

        window.gitIndexedDB = module;
    }

    if (typeof exports === 'undefined') {
        exports = module.exports;
    }

    fn(
        module,
        exports,
        window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB
    );
})(module, exports,
function (module, exports, indexedDB) {
    var version = 1;
    var hashStoreName = 'hashs';
    var hashIndexKey = 'hash';
    var pathStoreName = 'paths';
    var pathIndexKey = 'path';
    var isHash = /^[a-z0-9]{40}$/;

    var deflate, inflate;
    module.exports = function (platform) {
        deflate = platform.deflate || fake;
        inflate = platform.inflate || fake;
        return db;
    };

    var fake = function fake(input, callback) {
        setImmediate(function () {
            callback(null, input);
        });
    };

    var db = function db(prefix) {
        var context = {};
        'use strict';

        return {
            init: init.bind(context, prefix),
            get: get.bind(context),
            keys: keys.bind(context),
            set: set.bind(context)
        };
    };

    var init = function init(prefix, callback) {
        var request = indexedDB.open(prefix, version);
        var context = this;

        request.addEventListener('upgradeneeded', function (e) {
            var db = e.target.result;

            var hashStore = db.createObjectStore(hashStoreName);
            hashStore.createIndex(hashIndexKey, hashIndexKey, {
                unique: true
            });

            var pathStore = db.createObjectStore(pathStoreName);
            pathStore.createIndex(pathIndexKey, pathIndexKey, {
                unique: true
            });
        });
        request.addEventListener('success', function (e) {
            context.db = e.target.result;
            callback();
        });
        request.addEventListener('error', function (e) {
            //Some better error handling would be nice...
            throw e;
        });
    };

    var get = function get(key, callback) {
        var context = this;
        if (!callback) {
            return get.bind(this, key);
        }
        if (isHash.test(key)) {
            var transaction = context.db.transaction(hashStoreName);
            var store = transaction.objectStore(hashStoreName);

            var request = store.get(key);

            request.addEventListener('success', function (e) {
                //pretty sure if it goes in as Uint8Array it comes out as such
                callback(null, e.target.result);
            });
            request.addEventListener('error', function (e) {
                throw e;
            });
        } else {
            var transaction = context.db.transaction(pathStoreName);
            var store = transaction.objectStore(pathStoreName);

            var request = store.get(key);

            request.addEventListener('success', function (e) {
                callback(null, e.target.result);
            });
            request.addEventListener('error', function (e) {
                throw e;
            });
        }
    };

    var keys = function keys(prefix, callback) {
        var context = this;

        var transaction = context.db.transaction(pathStoreName);
        var store = transaction.objectStore(pathStoreName);

        if (prefix) {
            var request = store.get(prefix);

            request.addEventListener('success', function (e) {
                if (e.target.result) {
                    callback(null, e.target.result.keys);
                } else {
                    callback(null, []);
                }
            });
            request.addEventListener('error', function (e) {
                throw e;
            });
        } else {
            var request = store.openCursor();
            var keys = [];
            request.addEventListener('success', function (e) {
                var cursor = e.target.result;

                if (cursor) {
                    keys.push(cursor.value);
                    cursor['continue']();
                }
            });
            request.addEventListener('error', function (e) {
                throw e;
            });
            transaction.addEventListener('success', function (e) {
                callback(null, keys.reduce(function (arr, key) {
                    return arr.concat(key.keys);
                }, []));
            });
        }
    };

    var set = function set(key, value, callback) {
        var context = this;
        if (!callback) {
            return set.bind(context, key, value);
        }

        if (isHash.test(key)) {
            return deflate(value, function (err, deflated) {
                var raw = "";
                for (var i = 0, l = deflated.length; i < l; ++i) {
                  raw += String.fromCharCode(deflated[i]);
                }
                
                var transaction = context.db.transaction(hashStoreName, 'readwrite');
                var store = transaction.objectStore(hashStoreName);

                var record = {
                    value: value,
                    raw: raw
                };

                record[hashIndexKey] = key;

                var request = store.put(record);

                request.addEventListener('success', function (e) {
                    callback();
                });
                request.addEventListener('error', function (e) {
                    throw e;
                });
            });
        } else {
            var transaction = context.db.transaction(pathStoreName, 'readwrite');
            var store = transaction.objectStore(pathStoreName);
            var record = {
                keys: [value]
            };
            record[pathIndexKey] = key;

            var request = store.put(record);

            request.addEventListener('success', function (e) {
                callback();
            });
            request.addEventListener('error', function (e) {
                throw e;
            });
        }
    };
});