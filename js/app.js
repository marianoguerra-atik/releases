/*global require */
require.config({
    baseUrl: "js/",
    paths: {
        "json": "http://cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2",
        "jquery": "http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min",
        "underscore": "http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.3.3/underscore-min",
        "str": "http://cdnjs.cloudflare.com/ajax/libs/underscore.string/2.0.0/underscore.string.min",
        "mustache": "http://cdnjs.cloudflare.com/ajax/libs/mustache.js/0.5.0-dev/mustache.min"
    },

    shim: {
        json: {
            exports: "JSON"
        },
        jquery: {
            exports: "jQuery"
        },
        str: {
            exports: "_.str",
            deps: ["underscore"]
        },
        underscore: {
            exports: "_"
        },
        mustache: {
            exports: "Mustache"
        }
    }
});

require(["jquery", "json", "underscore", "str", "mustache", "text!../tpl/package.html"],
 function ($, JSON, _, Str, Mustache, tPackage) {
    "use strict";
    var table;

    function loadLatestReleases() {
        return $.ajax("cache/releases");
    }

    function loadDetails(path) {
        return $.ajax(path, {
            dataType: "json"
        });
    }

    function errorCb(msg) {
        return function () {
            alert(msg);
        };
    }

    function normalizePackage(pkg) {
        var norm = {};

        norm.name = pkg.name || pkg.title || "";
        norm.title = pkg.title || pkg.name || "";
        norm.description = pkg.description || "";

        norm.homepage = pkg.homepage || pkg.url || "";
        norm.version = pkg.version || "";
        norm.keywords = pkg.keywords || [];
        norm.bugs = (pkg.bugs) ? pkg.bugs.web || pkg.bugs.url || "" : "";

        return norm;
    }

    function displayDetails(pkg) {
        var content = Mustache.render(tPackage, normalizePackage(pkg)),
            container = $("#pkg-details");

        container.html(content);

        $(window).scrollTop(container.position().top);

    }

    function showDetails(path) {
        loadDetails(path)
            .done(displayDetails)
            .fail(errorCb("error loading details from " + path));
    }

    function showDetailsCb(path) {
        return function () {
            showDetails(path);
        };
    }

    function formatRelease(repo, org, name, ver, path) {
        var tr = $("<tr>");

        tr.append($("<td>").append($("<a>").attr({href: "http://" + repo + ".com/"}).text(repo)));
        tr.append($("<td>").append($("<a>").attr({href: "http://" + repo + ".com/" + org}).text(org)));
        tr.append($("<td>").append($("<a>").attr({href: "http://" + repo + ".com/" + org + "/" + name}).text(name)));
        tr.append($("<td>").append($("<a href='#'>").click(showDetailsCb(path)).text(ver)));

        return tr;
    }

    function inputToSearch(jqObj, onLiveSearch, onSearch, onClear) {
        var onSearchEvent = function (event) {
            var query = jqObj.val();

            if (query === "") {
                if (onClear) {
                    onClear(query);
                }
            } else if (event.keyCode === 13) {
                if (onSearch) {
                    onSearch(query);
                }
            } else if (onLiveSearch) {
                onLiveSearch(query);
            }
        };

        jqObj.keyup(onSearchEvent).on("search", onSearchEvent);

        return jqObj;
    }

    function onSearch(text) {
        if (Str.trim(text) === "") {
            $("tr", table).show();
        } else {
            $("tr", table).hide();
            $("tr:containsi(" + text + ")", table).show();
        }
    }

    function onReleasesLoaded(data) {
        var lines = Str.lines(data);

        _.chain(lines.reverse())
            .map(Str.trim)
            .filter(function (item) {
                return item !== "";
            })
            .each(function (item) {
                var parts = Str.words(item, "/"),
                    repo = parts[1],
                    org = parts[2],
                    name = parts[3],
                    version = Str.strLeft(parts[4], ".json");

                table.append(formatRelease(repo, org, name, version, item));
            });
    }

    $(function () {
        // add case insensitive contains (note the final i)
        $.extend($.expr[':'], {
            'containsi': function (elem, i, match, array) {
                return (elem.textContent || elem.innerText || '').toLowerCase()
                    .indexOf((match[3] || "").toLowerCase()) >= 0;
            }
        });

        table = $("#releases>tbody");

        loadLatestReleases()
            .done(onReleasesLoaded)
            .fail(errorCb("error loading latest releases"));

        inputToSearch($("#filter"), onSearch, onSearch, onSearch);
    });
});
