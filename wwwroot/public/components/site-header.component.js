"use strict";

angular.module("siteHeader", [
]).component("siteHeader", {
    templateUrl: "/public/components/site-header.component.html",
    controller: function ($rootScope, $http) {
        var self = this;
        self.loggedIn = $rootScope.loggedInUserId !== undefined;
        self.signout = function () {
            $http.post("/API/signout", {
                source: "site-header"
            }).then(function (res) {
                window.location = SIGNIN_URL;
            });
        };
    }
});