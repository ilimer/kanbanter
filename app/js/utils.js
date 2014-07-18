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

function loadSettings() {
    var settings = null;
    try {
        settings = JSON.parse(window.localStorage.getItem("settings"));
    } catch(e) {}

    if (settings) {
        Config.settings = settings;
    } else {
        Config.settings.project = Config.DEFAULT_PROJECT;
        Config.settings.tickets = Config.TICKETS_COUNT;
    }
}