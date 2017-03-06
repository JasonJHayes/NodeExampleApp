"use strict";

// https://docs.angularjs.org/api

// NOTE: the current method of injection may not work when minified, use below instead
//       .config(["$1...", "$2...", function ($1..., $2...) {}])
//       the above would need to be used in all module files

angular.module("siteApp", [
    "ngCookies"
]).config(function ($locationProvider, $httpProvider) {
    $locationProvider.html5Mode({
        enabled: true // don't use hashbang mode (localhost:3000/#!/) unless required
    });
    $httpProvider.interceptors.push(function ($q) {
        return { // general error handler for http calls
            responseError: function (res) {
                if (res.status === -1) {
                    var err = res.config.url + " returned after redirect";
                } else err = res.config.url + " " + res.status + " " + res.statusText;
                // 404 errors are handled by the server
                if (res.status !== 404) passErrorToServer(err);
                return $q.reject(res);
            }
        };
    });
}).run(function ($rootScope, $cookies) {
    // store the logged in userId on the root scope
    // needs to be done in run because I am not sure if a controller
    // on this module will be guaranteed to run before other controllers
    $rootScope.loggedInUserId = $cookies.get(COOKIE_SESSION);
    $cookies.remove(COOKIE_SESSION, { path: "/" });
    // clear messages on all route changes
    $rootScope.$on("$routeChangeSuccess", function () {
        // clear page level message
        $rootScope.message = "";
    });
}).controller("msgController", function ($scope, $cookies) {
    // display message stored in cookie and clear cookie
    var msgCookieValue = $cookies.get(COOKIE_MSG);
    if (msgCookieValue) {
        $scope.message = msgCookieValue;
        $cookies.remove(COOKIE_MSG);
        // also delete cookies set by the server on the root path
        $cookies.remove(COOKIE_MSG, { path: "/" });
    }
    $scope.clearMessage = function () {
        $scope.message = "";
    };
}).factory("$exceptionHandler", function ($cookies) {
    // handler general AngularJS errors
    return function (ex, cause) {
        console.log(cause, ex);
        passErrorToServer(ex, cause);
        // it might make sense not to cookie or redirect in development?
        //$cookies.put(COOKIE_MSG, MSG_UNKNOWN_ERROR);
        //window.location = "/";
    };
});