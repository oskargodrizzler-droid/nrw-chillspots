// ======================================================
// NRW CHILLSPOTS - MAP.JS
// Leaflet Karte + Marker + Standortauswahl
// ======================================================

let map = null;
let selectedLat = null;
let selectedLng = null;
let selectedMarker = null;
let markers = [];


// ======================================================
// KARTE INITIALISIEREN
// ======================================================

function initMap() {

  const mapElement =
    document.getElementById("map");

  if (!mapElement) {
    console.error("❌ Element #map nicht gefunden");
    return;
  }

  // Falls die Karte schon existiert
  if (map) {
    return;
  }

  map = L.map("map").setView(
    [51.48, 7.22],
    10
  );


  // OpenStreetMap
  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);


  // Klick auf Karte
  map.on(
    "click",
    function(event) {

      selectLocation(
        event.latlng.lat,
        event.latlng.lng
      );

    }
  );


  // Wichtig bei mobilen Browsern
  setTimeout(
    function() {
      map.invalidateSize();
    },
    300
  );


  console.log("🗺️ Karte geladen");
}


// ======================================================
// STANDORT AUF KARTE AUSWÄHLEN
// ======================================================

function selectLocation(
  lat,
  lng
) {

  selectedLat = lat;
  selectedLng = lng;


  // Alten Marker entfernen
  if (selectedMarker) {

    map.removeLayer(
      selectedMarker
    );

  }


  // Neuen Auswahl-Marker erstellen
  selectedMarker =
    L.marker([
      lat,
      lng
    ])
    .addTo(map);


  selectedMarker.bindPopup(
    "📍 Ausgewählter Standort"
  ).openPopup();


  // Text im Spot-Formular
  const locationText =
    document.getElementById(
      "selectedLocation"
    );


  if (locationText) {

    locationText.textContent =
      `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  }
}


// ======================================================
// EIGENEN STANDORT VERWENDEN
// ======================================================

function useMyLocation() {

  if (!navigator.geolocation) {

    showStatus(
      "❌ Dein Browser unterstützt keinen Standort"
    );

    return;
  }


  showStatus(
    "📍 Standort wird gesucht..."
  );


  navigator.geolocation.getCurrentPosition(

    function(position) {

      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;


      selectLocation(
        lat,
        lng
      );


      if (map) {

        map.setView(
          [lat, lng],
          15
        );

      }


      const locationText =
        document.getElementById(
          "selectedLocation"
        );


      if (locationText) {

        locationText.textContent =
          "📍 Dein aktueller Standort";

      }


      showStatus(
        "✅ Standort ausgewählt"
      );

    },


    function(error) {

      console.error(
        "Geolocation:",
        error
      );


      let message =
        "❌ Standort konnte nicht abgerufen werden";


      if (error.code === 1) {
        message =
          "❌ Standortzugriff wurde verweigert";
      }

      if (error.code === 2) {
        message =
          "❌ Standort konnte nicht ermittelt werden";
      }

      if (error.code === 3) {
        message =
          "❌ Standortabfrage dauerte zu lange";
      }


      showStatus(
        message
      );

    },


    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }

  );
}


// ======================================================
// MARKER VON SPOTS RENDERN
// ======================================================

function renderMarkers() {

  if (!map) {
    return;
  }


  // Alte Spot-Marker löschen
  markers.forEach(
    function(marker) {

      map.removeLayer(
        marker
      );

    }
  );


  markers = [];


  if (
    typeof spots === "undefined" ||
    !Array.isArray(spots)
  ) {

    return;
  }


  spots.forEach(
    function(spot) {

      if (
        spot.latitude === null ||
        spot.longitude === null ||
        spot.latitude === undefined ||
        spot.longitude === undefined
      ) {

        return;
      }


      const lat =
        Number(spot.latitude);

      const lng =
        Number(spot.longitude);


      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {

        return;
      }


      // Marker
      const marker =
        L.marker([
          lat,
          lng
        ])
        .addTo(map);


      // Name sicher machen
      const name =
        typeof escapeHtml === "function"
          ? escapeHtml(spot.name || "Chillspot")
          : String(spot.name || "Chillspot");


      const category =
        typeof escapeHtml === "function"
          ? escapeHtml(
              spot.category || "Sonstiges"
            )
          : String(
              spot.category || "Sonstiges"
            );


      const description =
        typeof escapeHtml === "function"
          ? escapeHtml(
              spot.description || ""
            )
          : String(
              spot.description || ""
            );


      marker.bindPopup(`
        <div style="min-width:180px">
          <strong>📍 ${name}</strong>
          <br>
          <span>${category}</span>
          ${
            description
              ? `<p style="margin:6px 0 0">${description}</p>`
              : ""
          }
        </div>
      `);


      // Marker speichern
      markers.push(
        marker
      );

    }
  );


  console.log(
    `🗺️ ${markers.length} Marker angezeigt`
  );
}


// ======================================================
// ZU EINEM SPOT SPRINGEN
// ======================================================

function goToSpot(
  spotId
) {

  if (!map) {
    return;
  }


  if (
    typeof spots === "undefined"
  ) {
    return;
  }


  const spot =
    spots.find(
      function(item) {

        return String(item.id) ===
          String(spotId);

      }
    );


  if (!spot) {
    return;
  }


  const lat =
    Number(spot.latitude);

  const lng =
    Number(spot.longitude);


  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {

    return;
  }


  map.setView(
    [lat, lng],
    16
  );


  // passenden Marker öffnen
  const marker =
    markers.find(
      function(item) {

        const position =
          item.getLatLng();

        return (
          Math.abs(position.lat - lat) < 0.00001 &&
          Math.abs(position.lng - lng) < 0.00001
        );

      }
    );


  if (marker) {
    marker.openPopup();
  }
}


// ======================================================
// KARTE NEU BERECHNEN
// ======================================================

function refreshMap() {

  if (!map) {
    return;
  }


  setTimeout(
    function() {

      map.invalidateSize();

    },
    100
  );
}


// ======================================================
// AUSGEWÄHLTEN STANDORT ZURÜCKSETZEN
// ======================================================

function clearSelectedLocation() {

  selectedLat = null;
  selectedLng = null;


  if (
    selectedMarker &&
    map
  ) {

    map.removeLayer(
      selectedMarker
    );

  }


  selectedMarker = null;


  const locationText =
    document.getElementById(
      "selectedLocation"
    );


  if (locationText) {

    locationText.textContent =
      "Noch kein Standort ausgewählt";

  }
}


// ======================================================
// START
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    initMap();

  }
);