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
            for (var i in data[dataAlias]) {
                if (data[dataAlias][i].name) {
                    el = document.createElement("option");
                    jQuery(el).attr("value", data[dataAlias][i].id).text(data[dataAlias][i].name);
                    if (typeof selectedId != "undefined") {
                        if (data[dataAlias][i].id == selectedId) {
                            jQuery(el).attr("selected", 1);
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
        }
    );
}

function updateUsersSelect(url, id, dataAlias, selectedId) {
    jQuery.getJSON(url,
        function (data) {
            console.log(data);
            var $select = jQuery(id);
            for (var i in data[dataAlias]) {
                if (data[dataAlias][i].user) {
                    var el = document.createElement("option");
                    jQuery(el).attr("value", data[dataAlias][i].user.id).text(data[dataAlias][i].user.name);
                    if (typeof selectedId != "undefined") {
                        if (data[dataAlias][i].user.id == selectedId) {
                            jQuery(el).attr("selected", 1);
                        }
                    }
                    $select.append(el);
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
        Config.settings.subcolors = Config.settings.colors || {};
    } catch(e) {}

    if (settings) {
        Config.settings = settings;
        Config.settings.colors = Config.settings.colors || Config.DEFAULT_COLORS;
        Config.settings.subcolors = Config.settings.colors || {};
    } else {
        Config.settings.project = Config.DEFAULT_PROJECT;
        Config.settings.tickets = Config.TICKETS_COUNT;
        Config.settings.colors = Config.DEFAULT_COLORS;
        Config.settings.subcolors = {};
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

function loadIssues(apiCode, callback, offset, result) {
    offset = offset || 0;
    result = result || [];
    jQuery.getJSON(
        Config.REDMINE_URL + 'issues.json?sort=priority:desc,created_on:desc' +
        ((Config.settings.assigned && Config.settings.assigned != -1) ? '&assigned_to_id=' + Config.settings.assigned : '') +
        ((Config.settings.tracker && Config.settings.tracker != -1) ? '&tracker_id=' + Config.settings.tracker : '') +
        ((Config.settings.project_category && Config.settings.project_category != -1) ? '&category_id=' + Config.settings.project_category : '') +
        (offset ? "&offset=" + offset : "") +
        '&limit=' + Config.settings.tickets +
        ((Config.settings.project && Config.settings.project != -1) ? '&project_id=' + Config.settings.project : "") +
        '&status_id=!5&key=' + apiCode + "&callback=?",
        function (data) {
            console.log(data);
            if (data.issues) {
                result = result.concat(data.issues);
                offset = offset + 100;
                var left = data.total_count - offset;
                data = null;
                var diff = Config.settings.tickets - offset;
                if (diff <= 0 || left <= 0) {
                    callback(result);
                } else {
                    loadIssues(apiCode, callback, offset, result);
                }
            } else {
                throw Error("Issues list is empty!")
            }
        }
    );

}