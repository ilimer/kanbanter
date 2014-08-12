var CouchDB = {
    /**
     * @description get-запрос к базе
     * @param {Object} options
     */
    getSync: function (options) {
        options.type = 'GET';
        options.url = Config.DB_URL + '/' + options.id;
        options.async = false;

        CouchDB.request(options);
    },

    /**
     * @description get-запрос к базе
     * @param {Object} options
     */
    get: function (options) {
        options.type = 'GET';
        options.url = Config.DB_URL + '/' + options.id;

        CouchDB.request(options);
    },

    /**
     * @description Сохранение
     * @param options
     */
    save: function (options) {
        options.url = Config.DB_URL + '/';
        options.data.new_edits = false;
        options.data = options.data ? JSON.stringify(options.data) : null;
        options.type = 'PUT';
        options.url += options.id;

        CouchDB.request(options);
    },

    /**
     * @description Удаление
     * @param options
     */
    remove: function (options) {
        options.type = "DELETE";
        options.url = Config.DB_URL + '/' + options.id;
        options.data = options.data ? JSON.stringify(options.data) : null;
        CouchDB.request(options);
    },

    /**
     * @description Универсальный запрос к базе данных
     * @param options
     */
    request: function (options) {
        if (!options || !options.url) {
            return null;
        }
        var url = options.url,
            type = options.type,
            data = options.data,
            callback = options.callback || function () {},
            error = options.errback || function () {},
            async = !(options.async === false);

        return jQuery.ajax({
            contentType: "application/json",
            dataType: 'json',
            url: url,
            type: type,
            data: data,
            async: async,
            success: callback,
            error: error
        });
    }
};
