// Campus Navigatie App - Functionaliteit

function getLokaalCode(naam) {
	var match = naam ? naam.match(/^([A-Z]+\d+)\./i) : null;
	return match ? match[1].toUpperCase() : '';
}

function getPlattegrondPad(code) {
	return 'IMG/plattegronden/' + code + '.png';
}

function hasCoordinates(coordinaten) {
	return coordinaten
		&& coordinaten.x !== null
		&& coordinaten.y !== null
		&& !Number.isNaN(Number(coordinaten.x))
		&& !Number.isNaN(Number(coordinaten.y));
}

async function initKaartPagina() {
	var kaartImage = document.getElementById('kaartImage');
	if (!kaartImage) {
		return;
	}

	var marker = document.getElementById('kaartMarker');
	var status = document.getElementById('kaartStatus');
	var title = document.getElementById('kaartTitle');
	var meta = document.getElementById('kaartMeta');
	var empty = document.getElementById('kaartEmpty');
	var form = document.getElementById('kaartSearchForm');
	var input = document.getElementById('kaartSearchInput');
	var gebouwChip = document.getElementById('kaartGebouwChip');
	var verdiepingChip = document.getElementById('kaartVerdiepingChip');
	var query = new URLSearchParams(window.location.search).get('q') || '';

	if (input) {
		input.value = query;
	}

	function setMarker(coordinaten) {
		if (!hasCoordinates(coordinaten)) {
			marker.classList.add('hidden');
			return false;
		}

		marker.style.left = String(coordinaten.x) + '%';
		marker.style.top = String(coordinaten.y) + '%';
		marker.classList.remove('hidden');
		return true;
	}

	function renderMeta(items) {
		meta.innerHTML = items.map(function(item) {
			return '<span class="kaart-chip">' + item + '</span>';
		}).join('');
	}

	function updateTopChips(code) {
		var gebouw = code ? code.replace(/\d+$/, '') : 'AL';
		var verdieping = code ? code.replace(/^[A-Z]+/, '') : '0';
		gebouwChip.textContent = gebouw;
		verdiepingChip.textContent = verdieping;
	}

	function renderFallback(message) {
		title.textContent = 'Plattegrond overzicht';
		status.textContent = message;
		renderMeta(['Kies een lokaal']);
		empty.textContent = 'De marker verschijnt automatisch zodra er coordinaten voor het lokaal beschikbaar zijn.';
		marker.classList.add('hidden');
		kaartImage.src = 'IMG/plattegronden/AL0.png';
		kaartImage.alt = 'Plattegrond van AL0';
		updateTopChips('AL0');
	}

	try {
		var response = await fetch('data/locaties.json');
		var data = await response.json();
		var lokalen = Array.isArray(data.lokalen) ? data.lokalen : [];

		if (form) {
			form.addEventListener('submit', function(event) {
				event.preventDefault();
				var value = input.value.trim();
				if (!value) {
					return;
				}
				window.location.href = 'kaart.html?q=' + encodeURIComponent(value);
			});
		}

		if (!query.trim()) {
			renderFallback('Kies een lokaal om de bijbehorende plattegrond te laden.');
			return;
		}

		var normalizedQuery = query.trim().toUpperCase();
		var lokaal = lokalen.find(function(item) {
			return String(item.naam || '').toUpperCase() === normalizedQuery;
		}) || lokalen.find(function(item) {
			return String(item.naam || '').toUpperCase().indexOf(normalizedQuery) !== -1;
		});

		if (!lokaal) {
			renderFallback('Geen lokaal gevonden voor "' + query + '".');
			return;
		}

		var code = getLokaalCode(lokaal.naam);
		title.textContent = 'Plattegrond voor ' + lokaal.naam;
		status.textContent = lokaal.beschrijving || 'Lokaal gevonden.';
		renderMeta([
			'Gebouw/vleugel: ' + code.replace(/\d+$/, ''),
			'Verdieping: ' + code.replace(/^[A-Z]+/, ''),
			'Lokaal: ' + lokaal.naam
		]);

		if (code) {
			kaartImage.src = getPlattegrondPad(code);
			kaartImage.alt = 'Plattegrond van ' + code;
			updateTopChips(code);
		}

		if (setMarker(lokaal.coordinaten)) {
			empty.textContent = 'Marker actief op basis van de ingestelde coordinaten uit locaties.json.';
			empty.classList.remove('hidden');
		} else {
			empty.textContent = 'Voor ' + lokaal.naam + ' zijn nog geen coordinaten ingevuld in locaties.json.';
			empty.classList.remove('hidden');
		}
	} catch (error) {
		renderFallback('De plattegrondgegevens konden niet geladen worden.');
		console.error(error);
	}
}

initKaartPagina();