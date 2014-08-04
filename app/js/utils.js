function updateSelect(url, id, dataAlias, selectedId) {
    jQuery.getJSON(url,
        function (data) {
            console.log(data);
            var $select = jQuery(id);
            for (var i in data[dataAlias]) {
                if (data[dataAlias][i].name) {
                    var el = document.createElement("option");
                    jQuery(el).attr("value", data[dataAlias][i].id).text(data[dataAlias][i].name);
                    if (typeof selectedId != "undefined") {
                        if (data[dataAlias][i].id == selectedId) {
                            jQuery(el).attr("selected", 1);
                        }
                    }
                    $select.append(el);
                }
            }
        }
    );
}

function updateProjectsSelect(url, id, dataAlias, selectedId) {
    jQuery.getJSON(url,
        function (data) {
            console.log(data);
            var $select = jQuery(id),
                $colors = jQuery("#subprojects"),
                el = null;

            if ((!selectedId instanceof Array) || selectedId.length == 1) {
                $select.removeAttr("multiple");
            }
            for (var i in data[dataAlias]) {
                if (data[dataAlias][i].name) {
                    el = document.createElement("option");
                    jQuery(el).attr("value", data[dataAlias][i].id).text(data[dataAlias][i].name);
                    if (data[dataAlias][i].parent) {
                        jQuery(el).attr("parent", data[dataAlias][i].parent.id);
                    }
                    if (typeof selectedId != "undefined") {
                        if (data[dataAlias][i].id == selectedId || selectedId.indexOf(data[dataAlias][i].id.toString()) > -1) {
                            jQuery(el).attr("selected", "selected");
                        }
                    }
                    $select.append(el);
                }
                if (data[dataAlias][i].parent && data[dataAlias][i].parent.id == selectedId) {
                    el = document.createElement("option");
                    jQuery(el).attr("value", data[dataAlias][i].id).text(data[dataAlias][i].name);
                    $colors.append(el);
                }
            }
            $select.multipleSelect("refresh");
        }
    );
}

function updateUsersSelect(projects, projectid, dataAlias, selectedId, api, result) {
    jQuery.getJSON(Config.REDMINE_URL + 'projects/' + projects[0] + '/memberships.json?limit=100&key=' + api + "&callback=?",
        function (data) {
            console.log(data);
            var $select = jQuery(projectid);
            if (!(result instanceof Array)) {
                result = [];
            }
            for (var i in data[dataAlias]) {
                if (data[dataAlias][i].user) {
                    var found = false;
                    for (var j in result) {
                        if (result[j].user.id === data[dataAlias][i].user.id) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        result.push(data[dataAlias][i]);
                    }
                }
            }
            projects.shift();
            if (projects.length) {
                updateUsersSelect(projects, projectid, dataAlias, selectedId, api, result)
            } else {
                result.sort(function(a, b){
                    if (a.user.name > b.user.name) {
                        return 1;
                    } else {
                        return -1;
                    }
                });
                for (i in result) {
                    if ($select.find("option[value=" + result[i].user.id + "]").length === 0) {
                        var el = document.createElement("option");
                        jQuery(el).attr("value", result[i].user.id).text(result[i].user.name);
                        if (typeof selectedId != "undefined") {
                            if (result[i].user.id == selectedId) {
                                jQuery(el).attr("selected", 1);
                            }
                        }
                        $select.append(el);
                    }
                }
            }
        }
    );
}

function loadSettings() {
    var settings = null;
    try {
        settings = JSON.parse(window.localStorage.getItem("settings"));
        Config.settings.colors = Config.settings.colors || Config.DEFAULT_COLORS;
        Config.settings.subcolors = Config.settings.subcolors || {};
        Config.settings.usercolors = Config.settings.usercolors || {};
    } catch(e) {}

    if (settings) {
        Config.settings = settings;
        Config.settings.colors = Config.settings.colors || Config.DEFAULT_COLORS;
        Config.settings.subcolors = Config.settings.subcolors || {};
        Config.settings.usercolors = Config.settings.usercolors || {};
    } else {
        Config.settings.project = [Config.DEFAULT_PROJECT];
        Config.settings.tickets = Config.TICKETS_COUNT;
        Config.settings.colors = Config.DEFAULT_COLORS;
        Config.settings.subcolors = {};
        Config.settings.usercolors = {};
    }
}

function autoScroll() {
    if (document.body.offsetHeight - window.innerHeight > 100) {
        if (document.body.offsetHeight - document.body.scrollTop > window.innerHeight + 50) {
            document.body.scrollTop = document.body.scrollTop + window.innerHeight;
        } else {
            document.body.scrollTop = 0;
        }
    }
}

function loadIssuesFromMultipleProjects(apiCode, callback, offset, result) {
    if (Config.settings.project instanceof Array) {
        loadIssues(apiCode, callback, offset, result, jQuery.makeArray(Config.settings.project), Math.round(Config.settings.tickets / Config.settings.project.length));
    } else {
        loadIssues(apiCode, callback, offset, result, new Array(Config.settings.project), Config.settings.tickets);
    }
}

function loadIssues(apiCode, callback, offset, result, projects, tickets) {
    offset = offset || 0;
    result = result || [];
    jQuery.getJSON(Config.REDMINE_URL + 'issues.json?sort=' +
        (Config.settings.sort ? Config.settings.sort : 'priority:desc,created_on:desc') +
        ((Config.settings.assigned && Config.settings.assigned != -1) ? '&assigned_to_id=' + Config.settings.assigned : '') +
        ((Config.settings.tracker && Config.settings.tracker != -1) ? '&tracker_id=' + Config.settings.tracker : '') +
        ((Config.settings.project_category && Config.settings.project_category != -1) ? '&category_id=' + Config.settings.project_category : '') +
        (offset ? "&offset=" + offset : "") +
        '&limit=' + tickets +
        ((projects[0] && projects[0] != -1) ? '&project_id=' + projects[0] : "") +
        '&status_id=!5&key=' + apiCode + "&callback=?",
        function (data) {
            console.log(data);
            if (data.issues) {
                result = result.concat(data.issues);
                offset = offset + 100;
                var left = data.total_count - offset;
                data = null;
                var diff = tickets - offset;
                if (diff <= 0 || left <= 0) {
                    projects.shift();
                    if (projects.length) {
                        loadIssues(apiCode, callback, 0, result, projects, tickets);
                    } else {
                        callback(result);
                    }
                } else {
                    loadIssues(apiCode, callback, offset, result, projects, tickets);
                }
            } else {
                throw Error("Issues list is empty!")
            }
        }
    );

}