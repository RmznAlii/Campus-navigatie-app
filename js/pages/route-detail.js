(function() {
    function getRoomFromQuery() {
        var params = new URLSearchParams(window.location.search);
        return params.get('q') || '';
    }

    function parseRoomName(naam) {
        var match = naam.match(/([A-Z]+)(\d+)\.(\d+)/);
        if (match) {
            return {
                building: match[1],
                floor: parseInt(match[2], 10),
                room: match[3]
            };
        }

        return null;
    }

    function getMapForBuilding(building) {
        var maps = {
            AC: 'IMG/plattegronden/AC1_NIEUW.png',
            AL: 'IMG/plattegronden/AL1_NIEUW.png'
        };
        return maps[building] || 'IMG/plattegronden/AC1_NIEUW.png';
    }

    async function loadLokalen() {
        try {
            var response = await fetch('data/locaties.json');
            var data = await response.json();
            return Array.isArray(data.lokalen) ? data.lokalen : [];
        } catch (error) {
            console.error('Error loading lokalen:', error);
            return [];
        }
    }

    function findRoom(rooms, name) {
        return rooms.find(function(room) {
            return room.naam && room.naam.toLowerCase() === name.toLowerCase();
        });
    }

    function hasCoordinates(coordinaten) {
        return coordinaten
            && coordinaten.x !== null
            && coordinaten.y !== null
            && !Number.isNaN(Number(coordinaten.x))
            && !Number.isNaN(Number(coordinaten.y));
    }

    function mapCoordinatesForRoute(lokaalNaam, coordinaten) {
        if (!hasCoordinates(coordinaten)) {
            return coordinaten;
        }

        var naam = String(lokaalNaam || '').toUpperCase();
        if (naam.indexOf('AC1.') !== 0) {
            return coordinaten;
        }

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

    function showRoute(mapImg, coords) {
        if (!coords || !coords.x || !coords.y) {
            return;
        }

        var startMarker = document.getElementById('startMarker');
        var endMarker = document.getElementById('endMarker');
        var routeLine = document.getElementById('routeLine');

        if (!startMarker || !endMarker || !routeLine) {
            return;
        }

        startMarker.style.display = 'block';
        endMarker.style.display = 'block';
        routeLine.style.display = 'block';

        var startX = 16;
        var startY = 72;
        var endX = coords.x;
        var endY = coords.y;

        startMarker.style.left = startX + '%';
        startMarker.style.top = startY + '%';
        endMarker.style.left = endX + '%';
        endMarker.style.top = endY + '%';

        var mapRect = mapImg.getBoundingClientRect();
        if (mapRect.width > 0 && mapRect.height > 0) {
            routeLine.setAttribute('width', mapRect.width);
            routeLine.setAttribute('height', mapRect.height);
            routeLine.setAttribute('viewBox', '0 0 ' + mapRect.width + ' ' + mapRect.height);

            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            var sx = (startX / 100) * mapRect.width;
            var sy = (startY / 100) * mapRect.height;
            var ex = (endX / 100) * mapRect.width;
            var ey = (endY / 100) * mapRect.height;
            var cx = (sx + ex) / 2;
            var cy = Math.min(sy, ey) - mapRect.height * 0.14;

            path.setAttribute('d', 'M ' + sx + ' ' + sy + ' Q ' + cx + ' ' + cy + ' ' + ex + ' ' + ey);
            path.setAttribute('stroke', '#232323');
            path.setAttribute('stroke-width', '4');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');

            routeLine.innerHTML = '';
            routeLine.appendChild(path);
        }
    }

    async function initRouteDetailPage() {
        var roomName = getRoomFromQuery();
        if (!roomName) {
            return;
        }

        var title = document.getElementById('roomTitle');
        if (title) {
            title.textContent = 'Room ' + roomName;
        }

        var parsed = parseRoomName(roomName);
        if (!parsed) {
            return;
        }

        var allRooms = await loadLokalen();
        var room = findRoom(allRooms, roomName);
        if (!room) {
            return;
        }

        var infoText = document.getElementById('routeInfoText');
        if (infoText) {
            infoText.innerHTML = 'Start location: Aula<br>'
                + 'Walk time: 1 min<br>'
                + 'Floor: ' + parsed.floor + '<br>'
                + 'Arrival: 14:25';
        }

        var mapPath = getMapForBuilding(parsed.building);
        var mapImg = document.getElementById('mapImage');
        if (!mapImg) {
            return;
        }

        mapImg.src = mapPath;
        mapImg.onload = function() {
            var mappedCoords = mapCoordinatesForRoute(roomName, room.coordinaten);
            showRoute(mapImg, mappedCoords);
        };

        var accessibilityToggle = document.getElementById('accessibilityToggle');
        if (accessibilityToggle) {
            accessibilityToggle.addEventListener('change', function() {
                document.body.classList.toggle('accessibility-enabled', this.checked);
            });
        }

        var startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', function() {
                alert('Route gestart naar ' + roomName + '!');
            });
        }
    }

    initRouteDetailPage();
})();
