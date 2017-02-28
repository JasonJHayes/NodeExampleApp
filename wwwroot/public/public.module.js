"use strict";

angular.module("publicApp", [
    "ngRoute",
    "siteApp",
    "siteHeader",
    "signupForm",
    "signinForm"
]).config(function ($routeProvider) {
    $routeProvider.when("/", {
        templateUrl: "/public/public.home.html"
    }).when("/about", {
        templateUrl: "/public/public.about.html"
    }).when("/signup", {
        templateUrl: "/public/public.signup.html"
    }).when("/signin", {
        templateUrl: "/public/public.signin.html"
    }).otherwise({
        templateUrl: "/public/public.home.html",
        controller: function ($rootScope) {
            passErrorToServer({ status: 404, message: MSG_404_ERROR });
            $rootScope.message = MSG_NOT_FOUND;
        }
    });
});