(function(){

var APIURL = "https://young-beyond-8772.herokuapp.com";

// app services
angular.module('travelNotes.services', [])

// user authentication and session service
.factory('CurrentUser', ['$http',
  function($http){
    var currentUser;

    return {

      login: function(username) {
        return $http.post(APIURL+"/auth", {"name": username}).then(function successCallback(response){
          currentUser = response.data;
        });
      },
      logout: function() {  },

      isLoggedIn: function() {
        return !!currentUser;
      },

      getId: function() {
        return (currentUser||{}).id;
      },
      getName: function() {
        return (currentUser||{}).name;
      },
      getDisplayName: function() {
        if (!currentUser) return null;
        return displayName(currentUser.name);
      },
      getToken: function() {
        return (currentUser||{}).token;
      },

      getAuthConfig: function() {
        if (!currentUser) return null;
        return {
          headers: {
            "Authorization": "Token token=" + currentUser.token
          }
        };
      }

    };
  }
])

// places crud service
.factory('Travelers', ['$q', '$http', 'CurrentUser',
  function($q, $http, CurrentUser){
    return {

      all: function(){
        if (!CurrentUser.isLoggedIn()) {
          return $q.reject("not logged in");
        }
        var config = CurrentUser.getAuthConfig();
        return $http.get(APIURL+"/travelers", config).then(function successCallback(response){
          response.data.forEach(function(traveler){
            traveler.displayName = displayName(traveler.name);
          });
          return response.data;
        });
      },

      patchDestinations: function(traveler){
        if (!CurrentUser.isLoggedIn()) {
          return $q.reject("not logged in");
        }
        var config = CurrentUser.getAuthConfig();
        return $http.patch(
          APIURL+"/travelers/"+CurrentUser.getId(), {destinations:traveler.destinations}, config
        ).then(function successCallback(response){
          return response.data;
        });
      }
    };
  }
]);

// format username for display
function displayName(name){
  return name[0].toUpperCase() + name.slice(1);
}

})();
