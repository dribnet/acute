'use strict';

/* Controllers */
function PhoneListCtrl($scope) {
  console.log($scope)
  $scope.phones = [
    {"name": "Nexus S",
     "snippet": "Fast just got faster with Nexus S."},
    {"name": "Motorola XOOM™ with Wi-Fi",
     "snippet": "The Next, Next Generation tablet."},
    {"name": "MOTOROLA XOOM™",
     "snippet": "The Next, Next Generation tablet."}
  ];
  $scope.hello = "Hello, World!"
}

/* Controllers */
function BareBonesCtrl($scope) {
  $scope.hello = "Hello, World!"
}