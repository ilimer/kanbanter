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
    } catch(e) {}

    if (settings) {
        Config.settings = settings;
        Config.settings.colors = Config.settings.colors || Config.DEFAULT_COLORS;
    } else {
        Config.settings.project = Config.DEFAULT_PROJECT;
        Config.settings.tickets = Config.TICKETS_COUNT;
        Config.settings.colors = Config.DEFAULT_COLORS;
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