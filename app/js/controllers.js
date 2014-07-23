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

        var callback = function(data) {
            for (var i in data) {
                if (data[i].status.id == 2) {
                    data[i].ratio =
                        Math.min(100,
                            Math.floor((new Date() - new Date(data[i].start_date )) / 1000 / 60 / 60 / 24 / 2 * 100)
                        );
                } else {
                    data[i].ratio = 0;
                }
            }
            $scope.issues = data;
            $scope.$apply();
            $(".last-update").text("Последнее обновление в " + (new Date()).toLocaleString());
        };
        loadIssues($rootScope.user.apiCode, callback);
        // Try and use the user's apiCode to get the issues:
/*        jQuery.getJSON(Config.REDMINE_URL + 'issues.json?sort=priority:desc,created_on:desc' +
            ((Config.settings.assigned && Config.settings.assigned != -1) ? '&assigned_to_id=' + Config.settings.assigned : '') +
            ((Config.settings.tracker && Config.settings.tracker != -1) ? '&tracker_id=' + Config.settings.tracker : '') +
            ((Config.settings.project_category && Config.settings.project_category != -1) ? '&category_id=' + Config.settings.project_category : '') +
            '&limit=' + Config.settings.tickets +
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
        );*/
    }

    getData();

    setInterval(function(){
        getData();
        $rootScope.$emit("forceAutoscroll");
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

	$scope.getTicketColor = function (ticket, fieldId) {
        if (ticket.category && ticket.category.id) {
            return Config.settings.colors["type" + ticket.category.id] || "";
        }

		return "";
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

    $scope.clearSettings = function() {
        window.localStorage.removeItem("settings");
        window.location.href = window.location.href;
    };

    $scope.formData = {
        tracker: -1,
        project_category: -1,
        autoscroll: Config.settings.autoscroll || false,
        assigned: -1
    };
    $scope.tickets = Config.settings.tickets;
    $scope.colorCategory = -1;
    $scope.selectedColor = -1;

    $scope.loadCategories = function() {
        jQuery("#project_category, #category, #assigned").find("option[value != -1]").remove();

        updateSelect(Config.REDMINE_URL + 'projects/' + $scope.formData.project + '/issue_categories.json?key=' + $rootScope.user.apiCode + "&callback=?",
                     "#project_category, #category",
                     "issue_categories",
                     Config.settings.project_category
        );

        updateUsersSelect(Config.REDMINE_URL + 'projects/' + Config.settings.project + '/memberships.json?limit=100&key=' + $rootScope.user.apiCode + "&callback=?",
            "#assigned",
            "memberships",
            Config.settings.assigned
        );

    };

    $scope.loadColor = function() {
        var color = Config.settings.colors["type" + $scope.colorCategory];
        $scope.selectedColor = color || -1;
//        jQuery("#colors").val(color || "-1");
    };

    $scope.setColor = function() {
        if ((!$scope.colorCategory && $scope.colorCategory !== 0) || $scope.colorCategory == "-1") {
            return false;
        }

        Config.settings.colors["type" + $scope.colorCategory] = $scope.selectedColor == -1 ? null : $scope.selectedColor;
    };

    updateSelect(Config.REDMINE_URL + 'projects.json?limit=50&key=' + $rootScope.user.apiCode + "&callback=?",
                 "#projects",
                 "projects",
                 Config.settings.project
    );

    updateSelect(Config.REDMINE_URL + 'trackers.json?key=' + $rootScope.user.apiCode + "&callback=?",
                 "#tracker",
                 "trackers",
                 Config.settings.tracker
    );

    updateSelect(Config.REDMINE_URL + 'projects/' + Config.settings.project + '/issue_categories.json?key=' + $rootScope.user.apiCode + "&callback=?",
                 "#project_category, #category",
                 "issue_categories",
                 Config.settings.project_category
    );

    if (Config.settings.autoscroll) {
        $rootScope.$on("forceAutoscroll", function() {
            autoScroll();
        });
    }

    updateUsersSelect(Config.REDMINE_URL + 'projects/' + Config.settings.project + '/memberships.json?limit=100&key=' + $rootScope.user.apiCode + "&callback=?",
        "#assigned",
        "memberships",
        Config.settings.assigned
    );

}

