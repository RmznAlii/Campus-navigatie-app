(function() {
    var STORAGE_KEY = 'recentRoutes';
    var MAX_RECENT = 5;

    function getFloorLabel(naam) {
        var match = naam.match(/[A-Z]+(\d+)\./);
        if (!match) {
            return '';
        }

        var floor = parseInt(match[1], 10);
        return floor === 0 ? 'Begane grond' : floor + 'e verdieping';
    }

    function getStoredRecent() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (error) {
            return [];
        }
    }

    function saveRecent(naam) {
        var recent = getStoredRecent().filter(function(item) {
            return item !== naam;
        });

        recent.unshift(naam);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
    }

    function capIcon() {
        return '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
            + '<polygon points="12 2 22 8.5 12 15 2 8.5"/>'
            + '<polyline points="6 11.5 6 18 12 21 18 18 18 11.5"/>'
            + '</svg>';
    }

    function renderRecent(namen) {
        var list = document.getElementById('recentList');
        if (!list) {
            return;
        }

        if (namen.length === 0) {
            list.innerHTML = '<li class="recent-empty">Geen recente zoekopdrachten</li>';
            return;
        }

        list.innerHTML = namen.map(function(naam) {
            return '<li class="recent-item">'
                + '<div class="recent-item-icon">' + capIcon() + '</div>'
                + '<div class="recent-item-info">'
                + '<strong>Lokaal: ' + naam + '</strong>'
                + '<small>' + getFloorLabel(naam) + '</small>'
                + '</div>'
                + '<a class="btn-green" href="route-detail.html?q=' + encodeURIComponent(naam) + '">Route</a>'
                + '</li>';
        }).join('');
    }

    function init() {
        var form = document.getElementById('routeForm');
        var input = document.getElementById('routeInput');

        if (form && input) {
            form.addEventListener('submit', function(event) {
                event.preventDefault();
                var val = input.value.trim();
                if (!val) {
                    return;
                }

                saveRecent(val);
                window.location.href = 'route-detail.html?q=' + encodeURIComponent(val);
            });
        }

        renderRecent(getStoredRecent());
    }

    init();
})();
