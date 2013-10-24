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
            get: get.bind(context)
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

});