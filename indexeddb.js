(function (indexedDB, exports) {
    'use strict';

    var isHash = /^[a-z0-9]{40}$/;
    var version = 1;
    var hashStoreName = 'hashs';
    var hashIndexKey = 'hash';
    var pathStoreName = 'paths';
    var pathIndexKey = 'path';

    exports.gitIndexedDB = function (prefix) {
        var context = {};
        return {
            init: init.bind(context, prefix),
            get: get.bind(context)
        };
    };

    var init = function init(prefix, callback) {
        var request = indexedDB.open(prefix, version);
        var context = this;

        request.addEventListender('upgradeNeeded', function (e) {
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
        request.addEventListender('success', function (e) {
            context.db = e.target.result;
            callback();
        });
        request.addEventListender('error', function (e) {
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

            request.addEventListender('success', function (e) {
                //pretty sure if it goes in as Uint8Array it comes out as such
                callback(null, e.target.result);
            });
            request.addEventListender('error', function (e) {
                throw e;
            });
        } else {
            var transaction = context.db.transaction(pathStoreName);
            var store = transaction.objectStore(pathStoreName);

            var request = store.get(key);

            request.addEventListender('success', function (e) {
                callback(null, e.target.result);
            });
            request.addEventListender('error', function (e) {
                throw e;
            });
        }
    }

})(window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB, window);