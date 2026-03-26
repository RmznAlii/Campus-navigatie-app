(function() {
    async function searchLokaal() {
        var params = new URLSearchParams(window.location.search);
        var query = (params.get('q') || '').trim();
        var resultsDiv = document.getElementById('search-results');

        if (!resultsDiv) {
            return;
        }

        if (!query) {
            resultsDiv.innerHTML = '<p>Voer een lokaalnummer in om te zoeken.</p>';
            return;
        }

        try {
            var response = await fetch('data/locaties.json');
            var data = await response.json();

            var lokalen = Array.isArray(data.lokalen) ? data.lokalen : [];
            var found = lokalen.filter(function(lokaal) {
                return String(lokaal.naam || '').toLowerCase().indexOf(query.toLowerCase()) !== -1;
            });

            if (found.length === 0) {
                resultsDiv.innerHTML = '<p>Geen lokalen gevonden voor "<strong>' + query + '</strong>"</p>';
                return;
            }

            if (found.length === 1) {
                var lokaal = found[0];
                resultsDiv.innerHTML = '<div style="margin-top: 12px;">'
                    + '<strong>' + lokaal.naam + '</strong><br>'
                    + '<small>' + (lokaal.beschrijving || '') + '</small>'
                    + '</div>';
                return;
            }

            var html = '<p>Gevonden: ' + found.length + ' resultaten voor "<strong>' + query + '</strong>"</p>';
            html += '<ul style="padding-left: 16px; margin: 8px 0;">';
            found.forEach(function(lokaal) {
                html += '<li><strong>' + lokaal.naam + '</strong> - ' + (lokaal.beschrijving || '') + '</li>';
            });
            html += '</ul>';
            resultsDiv.innerHTML = html;
        } catch (error) {
            resultsDiv.innerHTML = '<p>Fout bij het laden van lokalen: ' + error.message + '</p>';
        }
    }

    searchLokaal();
})();
