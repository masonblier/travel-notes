// main application module

angular.module('travelNotes', ['ionic', 'ngAutocomplete',
  'travelNotes.services', 'travelNotes.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // code to after ionic loads
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  // initial login route
  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })

  // app container with menu
  .state('app', {
    url: '',
    abstract: true,
    cache: false,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  // places view
  .state('app.places', {
    url: '/places',
    cache: false,
    views: {
      'menuContent': {
        templateUrl: 'templates/places.html',
        controller: 'PlacesCtrl'
      }
    }
  });

  // default is login
  $urlRouterProvider.otherwise('/login');
});
