(function() {
    function navigateWithQuery(basePath, value) {
        var query = String(value || '').trim();
        if (!query) {
            window.location.href = basePath;
            return;
        }

        window.location.href = basePath + '?q=' + encodeURIComponent(query);
    }

    function bindForm(formId, inputId, basePath) {
        var form = document.getElementById(formId);
        var input = document.getElementById(inputId);

        if (!form || !input) {
            return;
        }

        form.addEventListener('submit', function(event) {
            event.preventDefault();
            navigateWithQuery(basePath, input.value);
        });
    }

    bindForm('indexLokaalForm', 'indexLokaalInput', 'route-detail.html');
    bindForm('indexKaartForm', 'indexKaartInput', 'kaart.html');
})();
