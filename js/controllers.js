// app controllers

angular.module('travelNotes.controllers', [])

// menu / main app controller
.controller('AppCtrl', ['$scope', 'CurrentUser', function($scope, CurrentUser) {
  $scope.currentUser = CurrentUser.getDisplayName();
}])

// login view controller
.controller('LoginCtrl', ['$scope', '$location', '$ionicLoading', 'CurrentUser',
  function($scope, $location, $ionicLoading, CurrentUser) {

  $scope.showError = false;
  $scope.loginData = {};

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    $scope.showError = false;
    $ionicLoading.show({
      template: '<ion-spinner icon="crescent"></ion-spinner>'
    });

    CurrentUser.login($scope.loginData.username).then(function successCallback(response) {
      $scope.showError = false;
      $ionicLoading.hide();

      $location.path("/places");
    }, function errorCallback(response) {
      $scope.showError = true;
      $ionicLoading.hide();
    });
  };
}])

// places view controller
.controller('PlacesCtrl', ['$scope', '$location', '$timeout', '$ionicLoading', '$ionicModal',
    '$ionicScrollDelegate', 'CurrentUser', 'Travelers',
  function($scope, $location, $timeout, $ionicLoading, $ionicModal,
            $ionicScrollDelegate, CurrentUser, Travelers) {

  // check if logged in
  if (!CurrentUser.isLoggedIn()) {
    $location.path("/login");
    return;
  }

  // loading modal
  $scope.isLoaded = false;
  $ionicLoading.show({
    template: '<ion-spinner icon="crescent"></ion-spinner>'
  });

  // error modal
  $scope.errorModal = $ionicModal.fromTemplate(
    '<div class="loading-container visible active" style="pointer-events: none;"><div class="loading">'+
        '<span class="assertive">A network error has occurred. Please try again.</span>'+
      '</div></div>',
    {scope:$scope});

  // load traveler lists
  Travelers.all().then(function successCallback(travelers){
    $scope.travelers = travelers;

    // find current user traveler data, initialize expander data
    var userTraveler = null;
    $scope.isExpanded = {};
    travelers.forEach(function(traveler){
      if (traveler.id === CurrentUser.getId()) {
        $scope.isExpanded[traveler.id] = true;
        userTraveler = traveler;
      } else {
        $scope.isExpanded[traveler.id] = false;
      }
    });

    // add place search vars
    $scope.place = {
      name: '',
      options: {
        types: '(cities)'
      },
      details: null
    };

    // loaded
    $scope.isLoaded = true;
    $ionicLoading.hide();

    // hide/show destination group
    $scope.toggleGroup = function(traveler) {
      $scope.isExpanded[traveler.id] = !$scope.isExpanded[traveler.id];
      $timeout(function(){
        $ionicScrollDelegate.resize();
      }, 200);
    };

    // returns if traveler matches current traveler
    $scope.isUserTraveler = function(traveler) {
      return (traveler.id === CurrentUser.getId());
    };

    // toggle visit place
    $scope.toggleVisited = function(traveler, place) {
      if (traveler.id !== CurrentUser.getId()) {
        place.visited = !place.visited;
        return;
      }
      updateUserDestinations();
    };

    // remove destination from list
    $scope.removeDestination = function(traveler, placeIdx) {
      if (traveler.id !== CurrentUser.getId()) {
        return;
      }
      userTraveler.destinations.splice(placeIdx, 1);
      updateUserDestinations();
    };

    // prevent dropdown select clicking through to add button
    var preventAddClick = false;
    angular.element(document).on('mousedown', function(e){
      var targetElelement = e.srcElement || e.target;
      if (targetElelement.className === "pac-item" ||
          targetElelement.parentElement.className === "pac-item") {
        preventAddClick = true;
        $timeout(function(){
          preventAddClick = false;
        }, 200);
      }
    });

    // add destination to list
    $scope.addDestination = function() {
      if (preventAddClick) return;
      var placeName = ($scope.place.details ?
        $scope.place.details.name : $scope.place.name);
      if (placeName) {
        userTraveler.destinations.push({
          name: placeName,
          visited: false
        });
        $scope.isExpanded[userTraveler.id] = true;

        $scope.place.name = '';
        $scope.place.details = null;
        updateUserDestinations();
      }
    };

    // update user destinations
    function updateUserDestinations(){
      $ionicLoading.show({
        template: '<ion-spinner icon="crescent"></ion-spinner>'
      });
      Travelers.patchDestinations(userTraveler).then(function successCallback(traveler){
        $ionicLoading.hide();
      }, function errorCallback(){
        $ionicLoading.hide();
        $scope.errorModal.show();
      });
    }

  }, function errorCallback(response){
    $scope.errorModal.show();
  });
}]);
