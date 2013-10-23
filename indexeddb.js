(function (indexedDB, exports) {
    'use strict';

    var isHash = /^[a-z0-9]{40}$/;
    var version = 1;
    var storeName = 'hashs';
    var indexKey = 'hash';

    exports.gitIndexedDB = function (prefix) {
        var context = {};
        return {
            init: init.bind(context, prefix)
        };
    };

    var init = function init(prefix, callback) {
        var request = indexedDB.open(prefix, version);
        var context = this;

        request.addEventListender('upgradeNeeded', function (e) {
            var db = e.target.result;

            var hashStore = db.createObjectStore(storeName);

            hashStore.createIndex(indexKey, indexKey, {
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

})(window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB, window);