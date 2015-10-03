(function () {
    'use strict';
    angular.module('ionic-http-offline-cache')
        .provider('httpOfflineCacheStorage', function () {
            var BACKEND_SQLITE = 'sqlite',
                BACKEND_LOCALSTORAGE = 'localStorage',
                BACKEND_INMEMORY = 'inMemory';

            var availableBackends = [BACKEND_SQLITE, BACKEND_LOCALSTORAGE, BACKEND_INMEMORY],
                backends = [BACKEND_SQLITE, BACKEND_LOCALSTORAGE, BACKEND_INMEMORY],
                backend;

            this.setBackends = function (newBackends) {
                newBackends.forEach(function(item){
                    if (availableBackends.indexOf(item) <0) {
                        throw new Error('Invalid backend type for HttpOfflineCache '+item);
                    }
                });
                backends = newBackends;
            };

            this.$get = ['$window', '$q', '$injector', function ($window, $q, $injector) {

                function sqliteStorageFactory() {
                    var $cordovaSQLite,
                        db;

                    if ($injector.has('$cordovaSQLite')) {
                        $cordovaSQLite = $injector.get('$cordovaSQLite');
                    }

                    function openDb() {
                        if (!$cordovaSQLite) return $q.reject(false);
                        if (db) return $q.resolve(true);
                        db = $cordovaSQLite.openDatabase({name: "httpOfflineCache.db", location: 2});
                        return executeSql('CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, val TEXT)').then(function () {
                            return true;
                        });
                    }

                    function executeSql(sql, args) {
                        var defer = $q.defer();
                        args = args || [];
                        if (!db) {
                            throw new Error('SQLite3 database not initialized yet');
                        }
                        openDb().then(function () {
                            db.transaction(function (tx) {
                                tx.executeSql(sql, args,
                                    function (tx, res) {
                                        defer.resolve(res);
                                    },
                                    function (e) {
                                        defer.reject(e);
                                    }
                                );
                            });
                            return defer.promise;
                        });
                    }


                    return {
                        isSupported: !!$cordovaSQLite,
                        clear: function () {
                            return executeSql('DELETE FROM items');
                        },
                        has: function (key) {
                            return executeSql('SELECT val FROM items WHERE id = ?', [key]).then(function (res) {
                                return res.rows.length > 0;
                            });
                        },
                        get: function (key) {
                            return executeSql('SELECT val FROM items WHERE id = ?', [key]).then(function (res) {
                                if (res.rows.length > 0) {
                                    var stringValue = res.rows.item(0).val;
                                    if (stringValue === null || typeof stringValue === 'undefined') {
                                        return undefined;
                                    }
                                    return angular.fromJson(stringValue);
                                } else {
                                    return undefined;
                                }
                            });
                        },
                        set: function (key, value) {
                            var stringValue = angular.toJson(value);
                            return executeSql('REPLACE INTO items(id, val) VALUES (?, ?)', [key, stringValue]);
                        },
                        remove: function (key) {
                            return executeSql('DELETE FROM items WHERE id = ?', [key]);
                        }
                    };
                }

                function localStorageFactory() {
                    var PREFIX = 'httpCache-';
                    return {
                        isSupported: (function () {
                            try {
                                return 'localStorage' in $window && $window['localStorage'] !== null;
                            } catch (e) {
                                return false;
                            }
                        })(),
                        clear: function () {
                            for (var i = $window.localStorage.length - 1; i >= 0; i--) {
                                var keyName = $window.localStorage.key(i);
                                if (keyName.indexOf(PREFIX) === 0) {
                                    $window.localStorage.removeItem(keyName);
                                }
                            }
                            return $q.resolve(true);
                        },
                        has: function (key) {
                            return $q.resolve(typeof $window.localStorage[PREFIX+key] !== 'undefined');
                        },
                        get: function (key) {
                            var stringValue = $window.localStorage.getItem(PREFIX+key);
                            if (stringValue === null || typeof stringValue === 'undefined') {
                                return $q.resolve(undefined);
                            }
                            return $q.resolve(angular.fromJson(stringValue));
                        },
                        set: function (key, value) {
                            var that = this,
                                stringValue = angular.toJson(value);
                            try {
                                $window.localStorage.setItem(PREFIX+key, stringValue);
                            } catch(e) {
                                // handle oveflow case with roll-over
                                that.clear();
                            }
                            return $q.resolve(true);
                        },
                        remove: function (key) {
                            $window.localStorage.removeItem(PREFIX+key);
                            return $q.resolve(true);
                        }
                    };
                }

                function inMemoryStorageFactory() {
                    var values = {};
                    return {
                        isSupported: true,
                        clear: function () {
                            values = {};
                            return $q.resolve(true);
                        },
                        has: function (key) {
                            return $q.resolve(typeof values[key] !== 'undefined');
                        },
                        get: function (key) {
                            return $q.resolve(values[key]);
                        },
                        set: function (key, value) {
                            values[key] = value;
                            return $q.resolve(true);
                        },
                        remove: function (key) {
                            delete values[key];
                            return $q.resolve(true);
                        }
                    };
                }

                function startup() {
                    backend = null;
                    backends.forEach(function(backendType){
                        if (backend) return;
                        if (backendType === BACKEND_SQLITE) {
                            backend = sqliteStorageFactory ();
                        } else
                        if (backendType === BACKEND_LOCALSTORAGE) {
                            backend = localStorageFactory ();
                        } else
                        if (backendType === BACKEND_INMEMORY) {
                            backend = inMemoryStorageFactory ();
                        } else {
                            throw new Error('Invalid backend type for HttpOfflineCache '+backendType);
                        }
                        if (!backend.isSupported) {
                            backend = null;
                        }
                    });
                    if (!backend) {
                        throw new Error('No active storage backend for HttpOfflineCache ');
                    }
                    return backend;
                }
                // Select best backend
                return startup();
            }];
        });
})();