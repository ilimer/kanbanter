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
        loadIssuesFromMultipleProjects($rootScope.user.apiCode, callback);
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
            return (ticket.tracker && ticket.tracker.id == designTracker && !Config.settings.designer)
        };

        //Назначенные и в новые
		$scope.developmentReady = function (ticket) {
            return ticket.assigned_to && ticket.assigned_to.id
                 && (!ticket.category || ticket.category.id != otherCategory)
                 && (ticket.status.id === activeStatus || ticket.status.id === suspendedStatus)
                 && (ticket.tracker && (ticket.tracker.id != designTracker || Config.settings.designer))
                 && (ticket.priority && ticket.priority.id >= 4)
        };

        //Назначенные и в работе
		$scope.inProgress = function (ticket) {
            return ticket.assigned_to && ticket.assigned_to.id
                 && ticket.status.id === inProgress
                 && (ticket.tracker && (ticket.tracker.id != designTracker || Config.settings.designer))
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
        if (ticket.category && ticket.category.id && Config.settings.colors["type" + ticket.category.id]) {
            return Config.settings.colors["type" + ticket.category.id];
        }
        if (ticket.project && ticket.project.id && Config.settings.subcolors["sub" + ticket.project.id]) {
            return Config.settings.subcolors["sub" + ticket.project.id];
        }
        if (ticket.assigned_to && ticket.assigned_to.id && Config.settings.usercolors["user" + ticket.assigned_to.id]) {
            return Config.settings.usercolors["user" + ticket.assigned_to.id];
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
    $scope.formData = {
        tracker: Config.settings.tracker || -1,
        project: Config.settings.project instanceof Array ? Config.settings.project : [Config.settings.project],
        project_category: -1,
        autoscroll: Config.settings.autoscroll || false,
        assigned: Config.settings.assigned || -1,
        designer: Config.settings.designer || -1,
        sort: Config.settings.sort ? Config.settings.sort.replace(":desc", "") : ""
    };
    $scope.tickets = Config.settings.tickets;
    $scope.colorCategory = -1;
    $scope.selectedColor = -1;
    $scope.colorSubproject = -1;
    $scope.selectedSubColor = -1;
    $scope.colorUser = -1;
    $scope.selectedUserColor = -1;
    $scope.sortOrder = ":desc";

    jQuery("#projects").multipleSelect({
        onClick: function() {
            $scope.formData.project = jQuery("#projects").multipleSelect("getSelects");
        },
        selectAll: false,
        filter: true,
        styler: function(v, p) {
            if (p && p == "6") {
                return "margin-left: 2em";
            } else if (p) {
                return "margin-left: 1em";
            }
        }
    });

    $scope.toggleSettings = function() {
        jQuery(".options").toggleClass("fade");
    };

    $scope.saveSettings = function() {
        jQuery.extend(Config.settings, $scope.formData);
        if (Config.settings.sort) {
            Config.settings.sort = Config.settings.sort + $scope.sortOrder;
        }
        window.localStorage.setItem("settings", JSON.stringify(Config.settings));
        jQuery(".options").toggleClass("fade");
        $rootScope.$emit("forceUpdate");
    };

    $scope.clearSettings = function() {
        window.localStorage.removeItem("settings");
        window.location.href = window.location.href;
    };

    $scope.loadCategories = function() {
        jQuery("#project_category, #category, #assigned, #subprojects, #users").find("option[value != -1]").remove();

        var projects = $scope.formData.project;
        if (!(projects instanceof Array)) {
            projects = new Array(projects);
        }

        if (projects.length === 1) {
            updateSelect(Config.REDMINE_URL + 'projects/' + $scope.formData.project[0] + '/issue_categories.json?key=' + $rootScope.user.apiCode + "&callback=?",
                "#project_category, #category, #subprojects",
                "issue_categories",
                Config.settings.project_category
            );
        }

        updateUsersSelect(projects,
            "#assigned, #users",
            "memberships",
            Config.settings.assigned,
            $rootScope.user.apiCode
        );
    };

    $scope.loadColor = function() {
        var color = Config.settings.colors["type" + $scope.colorCategory];
        $scope.selectedColor = color || -1;
    };

    $scope.loadSubColor = function() {
        var color = Config.settings.subcolors["sub" + $scope.colorSubproject];
        $scope.selectedSubColor = color || -1;
    };

    $scope.loadUserColor = function() {
        var color = Config.settings.usercolors["user" + $scope.colorUser];
        $scope.selectedUserColor = color || -1;
    };

    $scope.setColor = function() {
        if ((!$scope.colorCategory && $scope.colorCategory !== 0) || $scope.colorCategory == "-1") {
            return false;
        }

        Config.settings.colors["type" + $scope.colorCategory] = $scope.selectedColor == -1 ? null : $scope.selectedColor;
    };

    $scope.setSubColor = function() {
        if ((!$scope.colorSubproject && $scope.colorSubproject !== 0) || $scope.colorSubproject == "-1") {
            return false;
        }

        Config.settings.subcolors["sub" + $scope.colorSubproject] = $scope.selectedSubColor == -1 ? null : $scope.selectedSubColor;
    };

    $scope.setUserColor = function() {
        if ((!$scope.colorUser && $scope.colorUser !== 0) || $scope.colorUser == "-1") {
            return false;
        }

        Config.settings.usercolors["user" + $scope.colorUser] = $scope.selectedUserColor == -1 ? null : $scope.selectedUserColor;
    };

    $scope.toggleGroup = function($event) {
        var el = jQuery($event.target);
        el.find("span").toggleClass("icon-chevron-down").toggleClass("icon-chevron-up");
        el.parent().toggleClass("collapse");
    };

    $scope.changeOrder = function($event, target) {
        var t = $event.target || target;
        jQuery(t).toggleClass("icon-arrow-up").toggleClass("icon-arrow-down");
        if (jQuery(t).hasClass("icon-arrow-up")) {
            $scope.sortOrder = ":desc";
            jQuery(t).attr("title", "По убыванию");
        } else {
            $scope.sortOrder = "";
            jQuery(t).attr("title", "По возрастанию");
        }
    };

    if (Config.settings.sort && Config.settings.sort.indexOf(":desc") == -1) {
        $scope.sortOrder = "";
        $scope.changeOrder({}, jQuery(".expand-link"));
    }

    updateProjectsSelect(Config.REDMINE_URL + 'projects.json?limit=50&key=' + $rootScope.user.apiCode + "&callback=?",
                 "#projects",
                 "projects",
                 Config.settings.project
    );

    updateSelect(Config.REDMINE_URL + 'trackers.json?key=' + $rootScope.user.apiCode + "&callback=?",
                 "#tracker",
                 "trackers",
                 Config.settings.tracker
    );

    if (Config.settings.project.length === 1) {
        updateSelect(Config.REDMINE_URL + 'projects/' + Config.settings.project[0] + '/issue_categories.json?key=' + $rootScope.user.apiCode + "&callback=?",
                     "#project_category, #category",
                     "issue_categories",
                     Config.settings.project_category
        );
    }

    if (Config.settings.autoscroll) {
        $rootScope.$on("forceAutoscroll", function() {
            autoScroll();
        });
    }

    updateUsersSelect(jQuery.makeArray(Config.settings.project),
        "#assigned, #users",
        "memberships",
        Config.settings.assigned,
        $rootScope.user.apiCode
    );

}

