(function () {
    'use strict';
    angular.module('ionic-http-offline-cache')
        .provider('httpOfflineCache', function () {
            var APPLICATION_JSON = 'application/json';
            var CONTENT_TYPE_APPLICATION_JSON = {'Content-Type': APPLICATION_JSON + ';charset=utf-8'};
            var JSON_START = /^\[|^\{(?!\{)/;
            var JSON_ENDS = {
                '[': /]$/,
                '{': /}$/
            };
            var JSON_PROTECTION_PREFIX = /^\)\]\}',?\n/;

            function shallowCopy(src, dst) {
                if (angular.isArray(src)) {
                    dst = dst || [];

                    for (var i = 0, ii = src.length; i < ii; i++) {
                        dst[i] = src[i];
                    }
                } else if (isObject(src)) {
                    dst = dst || {};

                    for (var key in src) {
                        if (!(key.charAt(0) === '$' && key.charAt(1) === '$')) {
                            dst[key] = src[key];
                        }
                    }
                }
                return dst || src;
            }

            function isFile(obj) {
                return toString.call(obj) === '[object File]';
            }

            function isBlob(obj) {
                return toString.call(obj) === '[object Blob]';
            }

            function isFormData(obj) {
                return toString.call(obj) === '[object FormData]';
            }

            function isJsonLike(str) {
                var jsonStart = str.match(JSON_START);
                return jsonStart && JSON_ENDS[jsonStart[0]].test(str);
            }

            function defaultHttpResponseTransform(data, headers) {
                if (angular.isString(data)) {
                    // Strip json vulnerability protection prefix and trim whitespace
                    var tempData = data.replace(JSON_PROTECTION_PREFIX, '').trim();

                    if (tempData) {
                        var contentType = headers('Content-Type');
                        if ((contentType && (contentType.indexOf(APPLICATION_JSON) === 0)) || isJsonLike(tempData)) {
                            data = angular.fromJson(tempData);
                        }
                    }
                }

                return data;
            }

            this.defaults = {
                // transform incoming response data
                transformResponse: [defaultHttpResponseTransform],

                // transform outgoing request data
                transformRequest: [function (d) {
                    return angular.isObject(d) && !isFile(d) && !isBlob(d) && !isFormData(d) ? angular.toJson(d) : d;
                }],

                // default headers
                headers: {
                    common: {
                        'Accept': 'application/json, text/plain, */*'
                    },
                    post: shallowCopy(CONTENT_TYPE_APPLICATION_JSON),
                    put: shallowCopy(CONTENT_TYPE_APPLICATION_JSON),
                    patch: shallowCopy(CONTENT_TYPE_APPLICATION_JSON)
                },

                xsrfCookieName: 'XSRF-TOKEN',
                xsrfHeaderName: 'X-XSRF-TOKEN',

                paramSerializer: '$httpParamSerializer'
            };

            this.$get = ["$http", function ($http) {
                function cachedGetRequest(url, config) {
                    if (isOffline()) {
                        return getCachedRequestPromise(url, config);
                    } else {
                        return $http.get(url, config)
                            .then(function (response) {
                                return persistResponse(response, url, config);
                            })
                            .catch(function (response) {
                                if (!response.status) {
                                    // offline
                                    return getCachedRequestPromise(url, config);
                                } else {
                                    // client or server HTTP error
                                    return $q.reject(response);
                                }
                            }
                        );
                    }
                }

                function isOffline() {
                    return false;
                }

                function getCachedRequestPromise(url, config) {

                }

                // Store successful response in the storage
                function persistResponse(response, url, config) {

                }


                function HttpOfflineCache(configuration) {
                    if (configuration && configuration.method === 'GET') {
                        return cachedGetRequest(configuration.url, configuration);
                    } else {
                        return $http(configuration);
                    }
                }

                // methods
                HttpOfflineCache.get = cachedGetRequest;
                HttpOfflineCache.head = $http.head.bind($http);
                HttpOfflineCache.post = $http.post.bind($http);
                HttpOfflineCache.put = $http.put.bind($http);
                HttpOfflineCache.delete = $http.delete.bind($http);
                HttpOfflineCache.jsonp = $http.jsonp.bind($http);
                HttpOfflineCache.patch = $http.patch.bind($http);
                // properties
                HttpOfflineCache.pendingRequests = $http.pendingRequests;
                HttpOfflineCache.defaults = $http.defaults;

                return HttpOfflineCache;
            }];
        });
    //
    // Another method is to set global interceptor
    // $httpProvider.interceptors.push(function ($q) {
    // return {
    //     'responseError': function (responseError) {
    //         // do something on error
    //         if (canRecover(rejection)) {
    //             return responseOrNewPromise
    //         }
    //         return $q.reject(rejection);
    //     }
    //};
})();