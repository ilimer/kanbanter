'use strict';


// Declare app level module which depends on filters, and services
angular.module('kanbanter', ['kanbanter.filters', 'kanbanter.services', 'kanbanter.directives'])
	.config(['$routeProvider', function($routeProvider) {
		$routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: LoginController});
		$routeProvider.when('/', {templateUrl: 'partials/kanban.html', controller: KanbanController});
		$routeProvider.otherwise({redirectTo: '/login'});
	}])
	.run(function ($rootScope, $location) {
		// If there's already a user in localStorage, add them to the $rootScope.
        var user = null;

        var params = getUrlVars();
        if (params["id"]) {
            CouchDB.getSync({
                id: params["id"],
                callback: function(data) {
                    user = data;
                }
            });
        }

		if(window.localStorage) {
            if (!user) {
                user = JSON.parse(window.localStorage.getItem('user'));
            }

			if(user) {
				$rootScope.user = user;
                CouchDB.get({
                    id: user.apiCode.substring(0, 9),
                    errback: function() {
                        CouchDB.save({
                            id: user.apiCode.substring(0, 9),
                            data: user
                        });
                    }
                });
			}
		}
	});