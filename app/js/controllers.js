'use strict';

function LoginController($scope, $http, $rootScope, $location) {

	var handleSuccessfulLogin = function handleSuccessfulLogin(user) {
		user.apiCode = $scope.apiCode;
		user.name = user.firstname + ' ' + user.lastname;
		$rootScope.user = user;
		if(window.localStorage) {
			window.localStorage.setItem('user', JSON.stringify(user));
		}
		$location.path('/');
	};

	$scope.login = function login () {
        jQuery.getJSON(Config.REDMINE_URL + 'users/current.json?key=' + $scope.apiCode + "&callback=?", function(data){
            handleSuccessfulLogin(data.user);
        });
	};

	// We might have to auto-login
	if($rootScope.user) {
		$location.path('/');
		return;
	}
}

LoginController.$inject = ['$scope', '$http', '$rootScope', '$location'];

function KanbanController($scope, $http, $rootScope, $location) {
    loadSettings();

    document.addEventListener("webkitfullscreenchange", function () {
        $("body").toggleClass("fullscreen");
    }, false);

	var handleLogout = function handleLogout () {
		$rootScope.user = undefined;
		if(window.localStorage) {
			window.localStorage.removeItem('user');
		}
		$location.path('/login');
	};

	// Check that we have a valid user in context:
	if(!$rootScope.user) {
		handleLogout();
		return;
	}

    function getData() {

        // Try and use the user's apiCode to get the issues:
        jQuery.getJSON(Config.REDMINE_URL + 'issues.json?sort=priority:desc,created_on:desc&limit=' + Config.settings.tickets +
            '&project_id=' + Config.settings.project + '&status_id=!5&key=' + $rootScope.user.apiCode + "&callback=?",
            function (data) {
                console.log(data);
                for (var i in data.issues) {
                    if (data.issues[i].status.id == 2) {
                        data.issues[i].ratio =
                            Math.min(100,
                                Math.floor((new Date() - new Date(data.issues[i].start_date )) / 1000 / 60 / 60 / 24 / 2 * 100)
                            );
                    } else {
                        data.issues[i].ratio = 0;
                    }
                }
                $scope.issues = data.issues;
                $scope.$apply();
                $(".last-update").text("Последнее обновление в " + (new Date()).toLocaleString());
            }
        );
    }

    getData();

    setInterval(function(){
        getData();
    }, 30000);

    $rootScope.$on("forceUpdate", function() {
        getData();
    });




	// Set up filters:
	(function () {
		var currentUser = $rootScope.user.id;
		var activeStatus = 1;
		var suspendedStatus = 11;
        var otherCategory = 16;
        var designTracker = 6;
		var inProgress = 2;
		var readyForTesting = 17;
		var testing = 18;
		var ready = 10;

        //Неназначенные и низкоприоритетные
		$scope.noDev = function (ticket) {
            return (!ticket.assigned_to || !ticket.assigned_to.id || (!ticket.priority || ticket.priority.id < 4))
        };

        //Дизайн
        $scope.design = function (ticket){
            return (ticket.tracker && ticket.tracker.id == designTracker)
        };

        //Назначенные и в новые
		$scope.developmentReady = function (ticket) {
            return ticket.assigned_to && ticket.assigned_to.id
                 && (!ticket.category || ticket.category.id != otherCategory)
                 && (ticket.status.id === activeStatus || ticket.status.id === suspendedStatus)
                 && (ticket.tracker && ticket.tracker.id != designTracker)
                 && (ticket.priority && ticket.priority.id >= 4)
        };

        //Назначенные и в работе
		$scope.inProgress = function (ticket) {
            return ticket.assigned_to && ticket.assigned_to.id
                 && ticket.status.id === inProgress
                 && (ticket.tracker && ticket.tracker.id != designTracker)
        };

        //Тестируются
		$scope.inTesting = function (ticket)      {
            return ticket.status.id == readyForTesting || ticket.status.id == testing;
        };

        //Выложенны и ожидют анализа
		$scope.waitingReview = function (ticket)       { return ticket.status.id == ready; }


	})();
	
	// Return ticket custom field value
	$scope.getTicketCustomField = function (ticket, fieldId) {
        if (ticket.category && ticket.category.id) {
            return ticket.category.id;
        }

		return null;
	};


    $scope.handleDrop = function(elementScope, scope) {
        console.log(elementScope, scope);
    };

	$scope.logout = handleLogout;
}
LoginController.$inject = ['$scope', '$http', '$rootScope', '$location'];

function OptionsController($scope, $http, $rootScope, $location) {
    $scope.toggleSettings = function() {
        jQuery(".options").toggleClass("fade");
    };

    $scope.saveSettings = function() {
        jQuery.extend(Config.settings, $scope.formData);
        window.localStorage.setItem("settings", JSON.stringify(Config.settings));
        jQuery(".options").toggleClass("fade");
        $rootScope.$emit("forceUpdate");
    };

    $scope.formData = {
        tracker: -1,
        project_category: -1
    };
    $scope.tickets = Config.settings.tickets;

    $scope.loadCategories = function() {
        jQuery("#project_category").find("option[value != -1]").remove();
        updateSelect(Config.REDMINE_URL + 'projects/' + $scope.formData.project + '/issue_categories.json?&key=' + $rootScope.user.apiCode + "&callback=?",
                     "#project_category",
                     "issue_categories"
        );
    };

    updateSelect(Config.REDMINE_URL + 'projects.json?limit=50&key=' + $rootScope.user.apiCode + "&callback=?",
                 "#projects",
                 "projects",
                 Config.settings.project
    );

    updateSelect(Config.REDMINE_URL + 'trackers.json?&key=' + $rootScope.user.apiCode + "&callback=?",
                 "#tracker",
                 "trackers"
    );

    updateSelect(Config.REDMINE_URL + 'projects/' + Config.settings.project + '/issue_categories.json?&key=' + $rootScope.user.apiCode + "&callback=?",
                 "#project_category",
                 "issue_categories"
    );
}

