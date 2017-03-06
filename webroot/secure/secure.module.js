"use strict";

angular.module("secureApp", [
    "ngRoute",
    "siteApp",
    "siteHeader",
    "userForm"
]).config(function ($routeProvider) {
    $routeProvider.when("/", {
        templateUrl: "/secure/secure.home.html",
        controller: function ($scope, homeView) {
            homeView.render($scope);
        }
    }).when("/user", {
        templateUrl: "/secure/secure.user.html"
    }).otherwise({
        templateUrl: "/secure/secure.home.html",
        controller: function ($rootScope, $scope, homeView) {
            passErrorToServer({ status: 404, message: MSG_404_ERROR });
            $rootScope.message = MSG_NOT_FOUND;
            homeView.render($scope);
        }
    });
}).factory("homeView", function ($rootScope, $http) {
    return {
        render: function (scope) {
            scope.createdAtFrom = new Date();
            scope.createdAtFrom.setDate(scope.createdAtFrom.getDate() - 30);
            scope.createdAtTo = new Date();
            scope.sort = "createdAt";
            scope.reverse = true;
            scope.orderBy = function (propertyName) {
                // if another multi-column sort is added
                // this logic will need to change
                var areTheSame = scope.sort === propertyName ||
                    scope.sort instanceof Array && propertyName instanceof Array;
                scope.reverse = areTheSame ? !scope.reverse : false;
                scope.sort = propertyName;
            };
            var httpRoute = "/secure/API/user/" + $rootScope.loggedInUserId;
            $http.get(httpRoute).then(function (res) {
                scope.user = res.data;
                $http.get(httpRoute + "/signins").then(function (res) {
                    scope.signins = res.data;
                });
            });
        }
    };
}).filter("successFilter", function () {
    return function (success) {
        return success ? '\u2713' : '\u2718';
    };
}).filter("signoutFilter", function () {
    return function (dateSource) {
        var items = dateSource.split(" ");
        return items[0] ? items[1] : undefined;
    };
}).filter("createdAtFilter", function () {
    return function (items, dateFrom, dateTo) {
        if (!items) return;
        if (!dateFrom && !dateTo) return items;
        dateFrom = new Date(dateFrom);
        dateTo = new Date(dateTo);
        var itemsToReturn = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var createdAt = new Date(item.createdAt);
            if (createdAt < dateFrom) continue;
            else if (createdAt > dateTo) continue;
            itemsToReturn.push(item);
        }
        return itemsToReturn;
    };
});