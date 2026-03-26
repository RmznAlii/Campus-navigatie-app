// Campus Navigatie App - Functionaliteit

function getLokaalCode(naam) {
	var match = naam ? naam.match(/^([A-Z]+\d+)\./i) : null;
	return match ? match[1].toUpperCase() : '';
}

function getPlattegrondPad(code) {
	if (String(code || '').toUpperCase() === 'AC1') {
		return 'IMG/plattegronden/AC1_NIEUW.png';
	}
	return 'IMG/plattegronden/' + code + '.png';
}

function hasCoordinates(coordinaten) {
	return coordinaten
		&& coordinaten.x !== null
		&& coordinaten.y !== null
		&& !Number.isNaN(Number(coordinaten.x))
		&& !Number.isNaN(Number(coordinaten.y));
}

function mapCoordinatesForPlattegrond(code, coordinaten) {
	if (!hasCoordinates(coordinaten)) {
		return coordinaten;
	}

	var normalizedCode = String(code || '').toUpperCase();
	if (normalizedCode !== 'AC1') {
		return coordinaten;
	}

	// AC1_NIEUW is a portrait version of AC1. Convert legacy AC1 coordinates
	// by rotating old points clockwise and compensating for side margins.
	var oldWidth = 1028;
	var oldHeight = 912;
	var rotatedWidth = oldHeight;
	var rotatedHeight = oldWidth;
	var newWidth = 3360;
	var newHeight = 3693;
	var scale = newHeight / rotatedHeight;
	var horizontalMargin = (newWidth - (rotatedWidth * scale)) / 2;

	var oldX = (Number(coordinaten.x) / 100) * oldWidth;
	var oldY = (Number(coordinaten.y) / 100) * oldHeight;

	var rotatedX = oldY;
	var rotatedY = oldWidth - oldX;

	var mappedX = horizontalMargin + (rotatedX * scale);
	var mappedY = rotatedY * scale;

	return {
		x: (mappedX / newWidth) * 100,
		y: (mappedY / newHeight) * 100
	};
}

async function initKaartPagina() {
	var RECENT_STORAGE_KEY = 'recentRoutes';
	var RECENT_MAX_ITEMS = 5;

	var kaartImage = document.getElementById('kaartImage');
	if (!kaartImage) {
		return;
	}

	var stage = document.getElementById('kaartStage');
	var mapLayer = document.getElementById('kaartMapLayer');
	var marker = document.getElementById('kaartMarker');
	var roomBadge = document.getElementById('kaartRoomBadge');
	var markerPopup = document.getElementById('kaartMarkerPopup');
	var markerPopupTitle = document.getElementById('kaartMarkerPopupTitle');
	var startRouteBtn = document.getElementById('kaartStartRouteBtn');
	var status = document.getElementById('kaartStatus');
	var title = document.getElementById('kaartTitle');
	var meta = document.getElementById('kaartMeta');
	var empty = document.getElementById('kaartEmpty');
	var form = document.getElementById('kaartSearchForm');
	var input = document.getElementById('kaartSearchInput');
	var filterToggle = document.getElementById('kaartFilterToggle');
	var filterPanel = document.getElementById('kaartFilterPanel');
	var filterApply = document.getElementById('kaartFilterApply');
	var gebouwSelect = document.getElementById('kaartGebouwSelect');
	var verdiepingSelect = document.getElementById('kaartVerdiepingSelect');
	var gebouwChip = document.getElementById('kaartGebouwChip');
	var verdiepingChip = document.getElementById('kaartVerdiepingChip');
	var gebouwValue = document.getElementById('kaartGebouwValue');
	var verdiepingValue = document.getElementById('kaartVerdiepingValue');
	var query = new URLSearchParams(window.location.search).get('q') || '';

	if (input) {
		input.value = query;
	}

	var panX = 0;
	var panY = 0;
	var initialZoomFactor = 1.9;
	var dragPointerId = null;
	var dragStartX = 0;
	var dragStartY = 0;
	var dragPanStartX = 0;
	var dragPanStartY = 0;
	var lokalen = [];
	var indeling = {};
	var currentGebouw = 'AC';
	var currentVerdieping = '1';
	var activeLokaalNaam = '';

	function getPanBounds() {
		if (!stage || !mapLayer) {
			return {
				minX: 0,
				maxX: 0,
				minY: 0,
				maxY: 0
			};
		}

		var viewportWidth = stage.clientWidth;
		var viewportHeight = stage.clientHeight;
		var layerWidth = mapLayer.offsetWidth;
		var layerHeight = mapLayer.offsetHeight;
		var minX = viewportWidth - layerWidth;
		var minY = viewportHeight - layerHeight;
		var maxX = 0;
		var maxY = 0;

		if (layerWidth <= viewportWidth) {
			minX = (viewportWidth - layerWidth) / 2;
			maxX = minX;
		}

		if (layerHeight <= viewportHeight) {
			minY = (viewportHeight - layerHeight) / 2;
			maxY = minY;
		}

		return {
			minX: minX,
			maxX: maxX,
			minY: minY,
			maxY: maxY
		};
	}

	function clampPan(nextX, nextY) {
		var bounds = getPanBounds();
		return {
			x: Math.min(bounds.maxX, Math.max(bounds.minX, nextX)),
			y: Math.min(bounds.maxY, Math.max(bounds.minY, nextY))
		};
	}

	function applyPan(nextX, nextY, animate) {
		if (!mapLayer) {
			return;
		}

		var clamped = clampPan(nextX, nextY);
		panX = clamped.x;
		panY = clamped.y;
		mapLayer.style.transition = animate ? 'transform 360ms ease' : 'none';
		mapLayer.style.transform = 'translate(' + panX + 'px, ' + panY + 'px)';

		if (animate) {
			window.setTimeout(function() {
				if (mapLayer) {
					mapLayer.style.transition = 'none';
				}
			}, 380);
		}
	}

	function fitMapToViewport() {
		if (!stage || !kaartImage || !kaartImage.naturalWidth || !kaartImage.naturalHeight) {
			return;
		}

		var widthScale = stage.clientWidth / kaartImage.naturalWidth;
		var heightScale = stage.clientHeight / kaartImage.naturalHeight;
		var fitScale = Math.min(widthScale, heightScale);
		var finalScale = Math.min(1, fitScale * initialZoomFactor);

		kaartImage.style.width = String(Math.round(kaartImage.naturalWidth * finalScale)) + 'px';
		kaartImage.style.height = String(Math.round(kaartImage.naturalHeight * finalScale)) + 'px';
	}

	function saveRecentLokaal(lokaalNaam) {
		var naam = String(lokaalNaam || '').trim();
		if (!naam) {
			return;
		}

		try {
			var recent = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || '[]');
			recent = Array.isArray(recent) ? recent.filter(function(item) {
				return item !== naam;
			}) : [];
			recent.unshift(naam);
			localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recent.slice(0, RECENT_MAX_ITEMS)));
		} catch (error) {
			console.error(error);
		}
	}

	function hideMarkerPopup() {
		if (markerPopup) {
			markerPopup.classList.add('hidden');
		}
	}

	function showMarkerPopup(lokaalNaam, coordinaten) {
		if (!markerPopup || !markerPopupTitle || !hasCoordinates(coordinaten)) {
			return;
		}

		markerPopupTitle.innerHTML = 'Lokaal<br>' + String(lokaalNaam || '');
		markerPopup.style.left = String(coordinaten.x) + '%';
		markerPopup.style.top = String(Math.max(8, Number(coordinaten.y) - 4.5)) + '%';
		markerPopup.classList.remove('hidden');
	}

	function centerOnCoordinates(coordinaten, animate) {
		if (!hasCoordinates(coordinaten) || !stage || !mapLayer) {
			return;
		}

		var targetX = (mapLayer.offsetWidth * Number(coordinaten.x)) / 100;
		var targetY = (mapLayer.offsetHeight * Number(coordinaten.y)) / 100;
		var nextX = (stage.clientWidth / 2) - targetX;
		var nextY = (stage.clientHeight / 2) - targetY;
		applyPan(nextX, nextY, animate);
	}

	function waitForImageReady() {
		return new Promise(function(resolve) {
			if (kaartImage.complete && kaartImage.naturalWidth > 0) {
				fitMapToViewport();
				resolve();
				return;
			}

			kaartImage.addEventListener('load', function() {
				fitMapToViewport();
				resolve();
			}, { once: true });
			kaartImage.addEventListener('error', resolve, { once: true });
		});
	}

	function getGebouwen() {
		return Object.keys(indeling).sort();
	}

	function getVerdiepingenForGebouw(gebouw) {
		var gebouwData = indeling[String(gebouw || '').toUpperCase()];
		var verdiepingen = gebouwData && Array.isArray(gebouwData.verdiepingen) ? gebouwData.verdiepingen : [];
		return verdiepingen.slice().sort(function(a, b) {
			return Number(a.verdieping) - Number(b.verdieping);
		});
	}

	function updateVerdiepingSelect(gebouw, selectedCode) {
		if (!verdiepingSelect) {
			return;
		}

		var verdiepingen = getVerdiepingenForGebouw(gebouw);
		verdiepingSelect.innerHTML = verdiepingen.map(function(item) {
			var value = String(item.verdieping);
			var selected = selectedCode === String(item.code || '') || value === selectedCode ? ' selected' : '';
			return '<option value="' + value + '"' + selected + '>Verdieping ' + value + '</option>';
		}).join('');
	}

	function updateFilterSelects(gebouw, verdieping) {
		if (gebouwSelect) {
			var gebouwen = getGebouwen();
			gebouwSelect.innerHTML = gebouwen.map(function(item) {
				var selected = item === gebouw ? ' selected' : '';
				return '<option value="' + item + '"' + selected + '>' + item + '</option>';
			}).join('');
		}

		updateVerdiepingSelect(gebouw, verdieping);
	}

	function setFilterPanelOpen(open) {
		if (!filterPanel || !filterToggle) {
			return;
		}

		filterPanel.classList.toggle('hidden', !open);
		filterPanel.setAttribute('aria-hidden', String(!open));
		filterToggle.setAttribute('aria-expanded', String(open));
	}

	function getCodeFromSelection(gebouw, verdieping) {
		return String(gebouw || '') + String(verdieping || '');
	}

	async function setMapByCode(code, options) {
		var normalizedCode = String(code || '').toUpperCase();
		if (!normalizedCode) {
			return;
		}

		kaartImage.src = getPlattegrondPad(normalizedCode);
		kaartImage.alt = 'Plattegrond van ' + normalizedCode;
		updateTopChips(normalizedCode);
		await waitForImageReady();

		if (options && options.clearMarker) {
			if (marker) {
				marker.classList.add('hidden');
			}
			if (roomBadge) {
				roomBadge.classList.add('hidden');
			}
		}

		if (!(options && options.keepPan)) {
			applyPan(0, 0, !!(options && options.animate));
		}
	}

	function setMarker(coordinaten) {
		if (!marker) {
			return false;
		}

		if (!hasCoordinates(coordinaten)) {
			marker.classList.add('hidden');
			hideMarkerPopup();
			if (roomBadge) {
				roomBadge.classList.add('hidden');
			}
			return false;
		}

		marker.style.left = String(coordinaten.x) + '%';
		marker.style.top = String(coordinaten.y) + '%';
		marker.classList.remove('hidden');
		return true;
	}

	function renderMeta(items) {
		if (!meta) {
			return;
		}
		meta.innerHTML = items.map(function(item) {
			return '<span class="kaart-chip">' + item + '</span>';
		}).join('');
	}

	function updateTopChips(code) {
		var gebouw = code ? code.replace(/\d+$/, '') : 'AL';
		var verdieping = code ? code.replace(/^[A-Z]+/, '') : '0';
		currentGebouw = gebouw;
		currentVerdieping = verdieping;
		if (gebouwValue) {
			gebouwValue.textContent = gebouw;
		}
		if (verdiepingValue) {
			verdiepingValue.textContent = verdieping;
		}
		updateFilterSelects(gebouw, verdieping);
	}

	function renderFallback(message) {
		if (title) {
			title.textContent = 'Plattegrond overzicht';
		}
		if (status) {
			status.textContent = message;
		}
		renderMeta(['Kies een lokaal']);
		if (empty) {
			empty.textContent = 'De marker verschijnt automatisch zodra er coordinaten voor het lokaal beschikbaar zijn.';
		}
		if (marker) {
			marker.classList.add('hidden');
		}
		hideMarkerPopup();
		activeLokaalNaam = '';
		if (roomBadge) {
			roomBadge.classList.add('hidden');
		}
		setMapByCode('AC1', {
			animate: false,
			keepPan: false,
			clearMarker: true
		});
	}

	function findLokaal(searchValue) {
		var normalized = String(searchValue || '').trim().toUpperCase();
		if (!normalized) {
			return null;
		}

		return lokalen.find(function(item) {
			return String(item.naam || '').toUpperCase() === normalized;
		}) || lokalen.find(function(item) {
			return String(item.naam || '').toUpperCase().indexOf(normalized) !== -1;
		}) || null;
	}

	async function showLokaal(lokaal, searchValue) {
		if (!lokaal) {
			renderFallback('Geen lokaal gevonden voor "' + searchValue + '".');
			return;
		}

		saveRecentLokaal(lokaal.naam);

		var code = getLokaalCode(lokaal.naam) || 'AC1';
		if (title) {
			title.textContent = 'Plattegrond voor ' + lokaal.naam;
		}
		if (status) {
			status.textContent = lokaal.beschrijving || 'Lokaal gevonden.';
		}
		renderMeta([
			'Gebouw/vleugel: ' + code.replace(/\d+$/, ''),
			'Verdieping: ' + code.replace(/^[A-Z]+/, ''),
			'Lokaal: ' + lokaal.naam
		]);

		if (code) {
			await setMapByCode(code, {
				keepPan: true,
				clearMarker: false,
				animate: false
			});
		}

		if (input) {
			input.value = lokaal.naam;
		}
		activeLokaalNaam = lokaal.naam;
		window.history.replaceState({}, '', 'kaart.html?q=' + encodeURIComponent(lokaal.naam));

		var mappedCoordinates = mapCoordinatesForPlattegrond(code, lokaal.coordinaten);

		if (setMarker(mappedCoordinates)) {
			hideMarkerPopup();
			if (roomBadge) {
				roomBadge.textContent = lokaal.naam.replace('.', ' ');
				roomBadge.style.left = String(mappedCoordinates.x) + '%';
				roomBadge.style.top = String(Math.max(10, Number(mappedCoordinates.y) - 2.8)) + '%';
				roomBadge.classList.remove('hidden');
			}
			centerOnCoordinates(mappedCoordinates, true);
			if (empty) {
				empty.textContent = 'Marker actief op basis van de ingestelde coordinaten uit locaties.json.';
				empty.classList.remove('hidden');
			}
		} else {
			hideMarkerPopup();
			activeLokaalNaam = '';
			if (roomBadge) {
				roomBadge.classList.add('hidden');
			}
			if (empty) {
				empty.textContent = 'Voor ' + lokaal.naam + ' zijn nog geen coordinaten ingevuld in locaties.json.';
				empty.classList.remove('hidden');
			}
			applyPan(0, 0, true);
		}
	}

	function initFilterControls() {
		if (filterToggle) {
			filterToggle.addEventListener('click', function() {
				var isOpen = filterPanel && !filterPanel.classList.contains('hidden');
				setFilterPanelOpen(!isOpen);
			});
		}

		if (gebouwSelect) {
			gebouwSelect.addEventListener('change', function() {
				updateVerdiepingSelect(gebouwSelect.value, currentVerdieping);
			});
		}

		if (filterApply) {
			filterApply.addEventListener('click', async function() {
				var gebouw = gebouwSelect ? gebouwSelect.value : currentGebouw;
				var verdieping = verdiepingSelect ? verdiepingSelect.value : currentVerdieping;
				await setMapByCode(getCodeFromSelection(gebouw, verdieping), {
					animate: true,
					keepPan: false,
					clearMarker: true
				});
				hideMarkerPopup();
				activeLokaalNaam = '';
				window.history.replaceState({}, '', 'kaart.html');
				setFilterPanelOpen(false);
			});
		}

		if (gebouwChip) {
			gebouwChip.addEventListener('click', async function() {
				var gebouwen = getGebouwen();
				if (gebouwen.length === 0) {
					return;
				}

				var currentIndex = Math.max(0, gebouwen.indexOf(currentGebouw));
				var nextGebouw = gebouwen[(currentIndex + 1) % gebouwen.length];
				var verdiepingen = getVerdiepingenForGebouw(nextGebouw);
				var nextVerdieping = verdiepingen.length > 0 ? String(verdiepingen[0].verdieping) : '0';
				await setMapByCode(getCodeFromSelection(nextGebouw, nextVerdieping), {
					animate: true,
					keepPan: false,
					clearMarker: true
				});
				hideMarkerPopup();
				activeLokaalNaam = '';
				window.history.replaceState({}, '', 'kaart.html');
			});
		}

		if (verdiepingChip) {
			verdiepingChip.addEventListener('click', async function() {
				var verdiepingen = getVerdiepingenForGebouw(currentGebouw);
				if (verdiepingen.length === 0) {
					return;
				}

				var index = verdiepingen.findIndex(function(item) {
					return String(item.verdieping) === currentVerdieping;
				});
				var next = verdiepingen[(Math.max(0, index) + 1) % verdiepingen.length];
				await setMapByCode(String(next.code || getCodeFromSelection(currentGebouw, next.verdieping)), {
					animate: true,
					keepPan: false,
					clearMarker: true
				});
				hideMarkerPopup();
				activeLokaalNaam = '';
				window.history.replaceState({}, '', 'kaart.html');
			});
		}
	}

	function initMarkerPopupControls() {
		if (marker) {
			marker.addEventListener('click', function(event) {
				event.stopPropagation();
				if (marker.classList.contains('hidden') || !activeLokaalNaam) {
					return;
				}

				showMarkerPopup(activeLokaalNaam, {
					x: Number(marker.style.left.replace('%', '')),
					y: Number(marker.style.top.replace('%', ''))
				});
			});
		}

		if (roomBadge) {
			roomBadge.addEventListener('click', function(event) {
				event.stopPropagation();
				if (!activeLokaalNaam || roomBadge.classList.contains('hidden')) {
					return;
				}

				showMarkerPopup(activeLokaalNaam, {
					x: Number(roomBadge.style.left.replace('%', '')),
					y: Number(roomBadge.style.top.replace('%', '')) + 2.8
				});
			});
		}

		if (startRouteBtn) {
			startRouteBtn.addEventListener('click', function(event) {
				event.stopPropagation();
				if (!activeLokaalNaam) {
					return;
				}

				saveRecentLokaal(activeLokaalNaam);

				window.location.href = 'route.html';
			});
		}

		if (stage) {
			stage.addEventListener('click', function(event) {
				if (event.target.closest('#kaartMarkerPopup') || event.target.closest('#kaartMarker') || event.target.closest('#kaartRoomBadge')) {
					return;
				}
				hideMarkerPopup();
			});
		}
	}

	function initPanning() {
		if (!stage || !mapLayer) {
			return;
		}

		stage.addEventListener('pointerdown', function(event) {
			if (event.target.closest('.kaart-overlay')) {
				return;
			}

			if (event.pointerType === 'mouse' && event.button !== 0) {
				return;
			}

			dragPointerId = event.pointerId;
			hideMarkerPopup();
			dragStartX = event.clientX;
			dragStartY = event.clientY;
			dragPanStartX = panX;
			dragPanStartY = panY;
			stage.classList.add('panning');
			stage.setPointerCapture(event.pointerId);
		});

		stage.addEventListener('pointermove', function(event) {
			if (dragPointerId === null || event.pointerId !== dragPointerId) {
				return;
			}

			var deltaX = event.clientX - dragStartX;
			var deltaY = event.clientY - dragStartY;
			applyPan(dragPanStartX + deltaX, dragPanStartY + deltaY, false);
		});

		function stopDrag(event) {
			if (dragPointerId === null || event.pointerId !== dragPointerId) {
				return;
			}

			dragPointerId = null;
			stage.classList.remove('panning');
		}

		stage.addEventListener('pointerup', stopDrag);
		stage.addEventListener('pointercancel', stopDrag);

		window.addEventListener('resize', function() {
			fitMapToViewport();
			applyPan(panX, panY, false);
		});
	}

	try {
		var response = await fetch('data/locaties.json');
		var data = await response.json();
		lokalen = Array.isArray(data.lokalen) ? data.lokalen : [];
		indeling = data && data.indeling ? data.indeling : {};

		updateFilterSelects(currentGebouw, currentVerdieping);
		initFilterControls();
		initMarkerPopupControls();
		setFilterPanelOpen(false);
		initPanning();
		await waitForImageReady();
		applyPan(0, 0, false);

		if (form) {
			form.addEventListener('submit', async function(event) {
				event.preventDefault();
				var value = input.value.trim();
				if (!value) {
					renderFallback('Kies een lokaal om de bijbehorende plattegrond te laden.');
					return;
				}

				await showLokaal(findLokaal(value), value);
			});
		}

		if (!query.trim()) {
			renderFallback('Kies een lokaal om de bijbehorende plattegrond te laden.');
			return;
		}

		await showLokaal(findLokaal(query), query);
	} catch (error) {
		renderFallback('De plattegrondgegevens konden niet geladen worden.');
		console.error(error);
	}
}

initKaartPagina();