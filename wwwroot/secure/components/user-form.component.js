"use strict";

angular.module("userForm", [
]).component("userForm", {
    templateUrl: "/secure/components/user-form.component.html",
    controller: function ($scope, $rootScope, $http, $cookies) {
        // setup the model
        self = this; // used where this is not available
        // get user information
        var httpRoute = "/secure/API/user/" + $rootScope.loggedInUserId;
        $http.get(httpRoute).then(function (res) {
            if (res.data.err) {
                $rootScope.message = MSG_UNKNOWN_ERROR;
                return;
            }
            // setup the model
            self.user = res.data;
            self.showPicture = self.user.pictureId !== undefined;
            if (self.showPicture) self.pictureSrc = httpRoute + "/picture/" + self.user.pictureId;
        });
        // form submit
        this.save = function () {
            $http.post(httpRoute, self.user).then(function (res) {
                $rootScope.message = "User saved.";
                $scope.userForm.$setPristine();
            });
        };
        // picture management
        this.removePicture = function (userForm) {
            delete self.user.pictureId;
            delete self.pictureSrc;
            self.showPicture = false;
            userForm.$setDirty();
        };
        this.changePicture = function (scope) {
            var file = fileUpload.files[0];
            if (file.size > MAX_REQUEST_BODY_SIZE) {
                $rootScope.message = "The file is too large.";
                scope.$apply();
                return;
            }
            self.user.picture = {
                size: file.size,
                type: file.type,
                name: file.name
            };
            var fileReader = new FileReader();
            fileReader.onloadend = function (ev) {
                // convert image to base64 string
                var base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(ev.target.result)));
                self.user.picture.base64 = base64;
                self.pictureSrc = "data:" + file.type + ";base64," + base64;
                self.showPicture = true;
                scope.userForm.$setDirty();
                scope.$apply();
            };
            fileReader.readAsArrayBuffer(file);
        };
        // AngularJS does not support binding to file input
        fileUpload.onchange = function () {
            var scope = angular.element(this).scope();
            scope.$ctrl.changePicture(scope);
        };
    }
}).directive("confirmOnExit", function () {
    return {
        link: function ($scope) {
            $scope.$on("$locationChangeStart", function (ev) {
                if ($scope.userForm.$dirty) {
                    if (!confirm("The form has not been saved. Do you want to leave the page?")) {
                        ev.preventDefault();
                    }
                }
            });
            // handle the case where the link is outside the page routing
            window.onbeforeunload = function () {
                if ($scope.userForm.$dirty) {
                    return "The form has not been saved. Do you want to leave the page?";
                }
            };
        }
    };
});