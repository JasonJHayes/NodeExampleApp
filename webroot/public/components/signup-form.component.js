"use strict";

angular.module("signupForm", [
]).component("signupForm", {
    templateUrl: "/public/components/signup-form.component.html",
    controller: function ($rootScope, $http) {
        var self = this;
        self.signup = function () {
            $http.post("/API/signup", {
                userId: self.userId,
                password: self.password,
                passwordRepeat: self.passwordRepeat
            }).then(function (res) {
                if (res.data.err) $rootScope.message = res.data.err;
                else window.location = SECURE_URL;
            });
        };
    }
}).directive("repeatCheck", function () {
    return {
        restrict: "A",
        require: "ngModel",
        link: function (scope, element, attrs, controller) {
            controller.$validators.repeatCheck = function (modelValue, viewValue) {
                return viewValue === scope.signupForm.password.$viewValue;
            };
        }
    };
}).directive("userCheck", function ($http, $q) {
    return {
        restrict: "A",
        require: "ngModel",
        link: function (scope, element, attrs, controller) {
            controller.$asyncValidators.userCheck = function (modelValue, viewValue) {
                // validates true if the service is unavailable or fails, so
                // the user can continue, the server will catch duplicate userId
                return $http.get("/API/user/" + viewValue).then(function (res) {
                    if (res.data.exists) return $q.reject();
                    return $q.resolve();
                }, function (err) {
                    return $q.resolve();
                });
            };
        }
    };
});