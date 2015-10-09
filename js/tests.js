describe("travel-notes", function() {
  var $controller, $service, $location, $httpBackend;

  var APIURL = "https://young-beyond-8772.herokuapp.com";

  beforeEach(module('travelNotes'));

  beforeEach(inject(function($injector){
    $controller = $injector.get('$controller');
    $httpBackend = $injector.get('$httpBackend');
    $httpBackend.when('GET', /\.html$/).respond(200, '');
  }));

  afterEach(function(){
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('Login', function(){
    var $scope, controller;

    beforeEach(function() {
      $scope = {};
      controller = $controller('LoginCtrl', { $scope: $scope });
    });

    it('shows an error on an invalid login', function() {
      $httpBackend.expectPOST(APIURL+'/auth', '{"name":"invalid_user"}').respond(401, '');
      $scope.loginData = {username: 'invalid_user'};
      $scope.doLogin();
      $httpBackend.flush();

      expect($scope.showError).toEqual(true);
    });

    it('set the current user and redirects to /places on success', inject(function($location, CurrentUser){
      spyOn($location, 'path');
      $httpBackend.expectPOST(APIURL+'/auth', '{"name":"valid_user"}')
        .respond(200, '{"id":1,"name":"valid_user","token":"mock_token"}');
      $scope.loginData = {username: 'valid_user'};
      $scope.doLogin();
      $httpBackend.flush();

      expect($scope.showError).toEqual(false);
      expect(CurrentUser.getId()).toEqual(1);
      expect($location.path).toHaveBeenCalledWith("/places");
    }));
  });

  describe('Places', function(){
    var $scope, controller;

    beforeEach(function(){
      $scope = {};
    });

    it('redirects back to /login if user is not logged in', inject(function($location, CurrentUser){
      spyOn($location, 'path');
      controller = $controller('PlacesCtrl', { $scope: $scope });
      $httpBackend.flush();

      expect($location.path).toHaveBeenCalledWith("/login");
    }));

    describe('travelers list', function(){
      beforeEach(inject(function($ionicModal, CurrentUser){
        CurrentUser.isLoggedIn = function(){ return true; };
        CurrentUser.getId = function(){ return 1; };
        $ionicModal.fromTemplate = function(){ return {show:function(){}}; };
      }));

      it('travelers list to be set from service query', inject(function(){
        $httpBackend.expectGET(APIURL+'/travelers')
          .respond(200, JSON.stringify([
            {"id":1,"name":"valid_user","destinations":[{"name":"Testination","visited":false}]}
          ]));

        controller = $controller('PlacesCtrl', { $scope: $scope });
        $httpBackend.flush();

        expect($scope.travelers.length).toEqual(1);
        expect($scope.travelers[0].id).toEqual(1);
        expect($scope.travelers[0].destinations.length).toEqual(1);
        expect($scope.travelers[0].destinations[0].name).toEqual("Testination");
      }));

      it('should expand the current users list', inject(function(){
        $httpBackend.expectGET(APIURL+'/travelers')
          .respond(200, JSON.stringify([
            {"id":1,"name":"valid_user","destinations":[{"name":"Testination","visited":false}]},
            {"id":2,"name":"other_user","destinations":[{"name":"Testination","visited":false}]}
          ]));

        controller = $controller('PlacesCtrl', { $scope: $scope });
        $httpBackend.flush();

        expect($scope.isExpanded[1]).toEqual(true);
        expect($scope.isExpanded[2]).toEqual(false);
      }));

      describe('patchDestinations', function(){
        var mockDestination, mockTraveler, controller;

        beforeEach(inject(function($q, Travelers){
          mockDestination = {"name":"Testination","visited":false};
          mockTraveler = {"id":1,"name":"valid_user","destinations":[mockDestination]};
          spyOn(Travelers, 'all').and.returnValue($q.resolve([mockTraveler]));

          controller = $controller('PlacesCtrl', { $scope: $scope });
          $httpBackend.flush();
        }));

        it('should patch changes when desintation visited', inject(function(){
          $httpBackend.expectPATCH(APIURL+'/travelers/1')
            .respond(200, JSON.stringify(mockTraveler));
          mockDestination.visited = true; // this would happen automatically when bound to DOM checkbox
          $scope.toggleVisited(mockTraveler, mockDestination);
          $httpBackend.flush();

          expect($scope.travelers[0].destinations[0].name).toEqual("Testination");
          expect($scope.travelers[0].destinations[0].visited).toEqual(true);
        }));

        it('should patch changes when desintation added', inject(function(){
          $scope.place.name = "New Destination";

          $httpBackend.expectPATCH(APIURL+'/travelers/1')
            .respond(200, JSON.stringify(mockTraveler));
          $scope.addDestination();
          $httpBackend.flush();

          expect($scope.travelers[0].destinations.length).toEqual(2);
          expect($scope.travelers[0].destinations[1].name).toEqual("New Destination");
        }));

        it('should patch changes when desintation removed', inject(function(){
          $httpBackend.expectPATCH(APIURL+'/travelers/1')
            .respond(200, JSON.stringify(mockTraveler));
          $scope.removeDestination(mockTraveler, 0);
          $httpBackend.flush();

          expect($scope.travelers[0].destinations.length).toEqual(0);
        }));
      });
    });
  });
});
