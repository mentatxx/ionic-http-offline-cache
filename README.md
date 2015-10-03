# ionic-http-offline-cache
Drop-in replacement for $http. It will cache responses for GET requests and return them while in offline


## Usage
Just replace "$http" service with "httpOfflineCache". 

Example:

```javascript
angular.module('starter').
    controller('StarterPage', function($scope, httpOfflineCache){
        var postNumber = 1;
        $scope.reqNumber = 0;
        $scope.data = {
            userId: 0,
            id: 0,
            title: '',
            body: ''
        };
        $scope.sendRequest = function() {
            // postNumber++;
            $scope.reqNumber++;
            httpOfflineCache.get('http://jsonplaceholder.typicode.com/posts/'+postNumber).then(function(response){
                $scope.data = response.data;
                $scope.status = response.status;
                $scope.state = 'Responded';
            }).catch(function(response){
                $scope.status = response.status;
                $scope.state = 'Request failed';
            });
        };
    });
```

## Optional dependencies

It highly recommended you to add "sqlite" and "network" cordova plugins. It will help to faster and better detect offline mode, and use sqlite file storage instead of small Html Local storage.

This optional plugins are recognized by httpOfflineCache:

* ```cordova plugin add org.apache.cordova.network-information```
* ```cordova plugin add https://github.com/litehelpers/Cordova-sqlite-storage.git```


