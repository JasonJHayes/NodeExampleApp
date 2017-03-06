"use strict";

angular.module("signinForm", [
]).component("signinForm", {
    templateUrl: "/public/components/signin-form.component.html",
    controller: function ($rootScope, $http) {
        var self = this;
        self.signin = function () {
            $http.post("/API/signin", {
                userId: self.userId,
                password: self.password,
                source: "signin-form"
            }).then(function (res) {
                if (res.data.err) $rootScope.message = res.data.err;
                else window.location = SECURE_URL;
            });
        };
    }
});