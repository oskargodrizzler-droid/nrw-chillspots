// ===============================
// MAP.JS
// ===============================

let map = null;
let markers = [];

let selectedLat = null;
let selectedLng = null;
let selectedMarker = null;


// ===============================
// KARTE INITIALISIEREN
// ===============================

function initMap() {

  const mapElement = document.getElementById("map");

  if (!mapElement) {
    console.error("❌ #map nicht gefunden");
    return;
  }

  if (map) {
    return;
  }

  map = L.map("map").setView(
    [51.48, 7.22],
    10
  );


  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);


  // ===============================
  // AUF KARTE KLICKEN
  // ===============================

  map.on("click", function(e) {

    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;


    // alten Auswahl-Marker entfernen

    if (selectedMarker) {
      map.removeLayer(selectedMarker);
    }


    // neuen Marker setzen

    selectedMarker =
      L.marker([
        selectedLat,
        selectedLng
      ]).addTo(map);


    selectedMarker.bindPopup(
      "📍 Ausgewählter Standort"
    );


    // Text im Spot-Modal aktualisieren

    const locationText =
      document.getElementById(
        "selectedLocation"
      );


    if (locationText) {

      locationText.textContent =
        `📍 ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`;

    }

  });


  renderMarkers();
}



// ===============================
// STANDORT VERWENDEN
// ===============================

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

      selectedLat =
        position.coords.latitude;

      selectedLng =
        position.coords.longitude;


      // Karte zum Standort bewegen

      if (map) {

        map.setView(
          [
            selectedLat,
            selectedLng
          ],
          16
        );

      }


      // alten Marker entfernen

      if (selectedMarker && map) {

        map.removeLayer(
          selectedMarker
        );

      }


      // neuen Marker erstellen

      if (map) {

        selectedMarker =
          L.marker([
            selectedLat,
            selectedLng
          ]).addTo(map);


        selectedMarker.bindPopup(
          "📍 Dein Standort"
        ).openPopup();

      }


      // Modal aktualisieren

      const locationText =
        document.getElementById(
          "selectedLocation"
        );


      if (locationText) {

        locationText.textContent =
          "📍 Dein Standort ausgewählt";

      }


      showStatus(
        "✅ Standort ausgewählt"
      );

    },


    function(error) {

      console.error(
        "Geolocation Fehler:",
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
          "❌ Standort ist momentan nicht verfügbar";

      }

      if (error.code === 3) {

        message =
          "❌ Standortabfrage dauerte zu lange";

      }


      showStatus(message);

    },


    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

  );

}



// ===============================
// MARKER VON SPOTS
// ===============================

async function renderMarkers() {

  if (!map) {
    return;
  }


  // alte Spot-Marker entfernen

  markers.forEach(
    marker => map.removeLayer(marker)
  );

  markers = [];


  if (!Array.isArray(spots)) {
    return;
  }


  for (const spot of spots) {

    if (
      spot.latitude === null ||
      spot.latitude === undefined ||
      spot.longitude === null ||
      spot.longitude === undefined
    ) {

      continue;

    }


    let likeCount = 0;


    // ===============================
    // LIKES
    // ===============================

    try {

      const {
        count,
        error
      } =
        await supabaseClient
          .from("likes")
          .select(
            "*",
            {
              count: "exact",
              head: true
            }
          )
          .eq(
            "spot_id",
            spot.id
          );


      if (!error) {

        likeCount =
          count || 0;

      }

    } catch (error) {

      console.error(
        "Like Count Fehler:",
        error
      );

    }


    // ===============================
    // MARKER
    // ===============================

    const marker =
      L.marker([
        Number(spot.latitude),
        Number(spot.longitude)
      ]).addTo(map);


    // ===============================
    // POPUP
    // ===============================

    marker.bindPopup(`

      <div class="map-popup">

        <h3>
          📍 ${escapeHtml(spot.name)}
        </h3>

        <p>
          ${escapeHtml(
            spot.description ||
            "Keine Beschreibung"
          )}
        </p>

        <div class="popup-likes">

          ❤️
          <strong>
            ${likeCount}
          </strong>

          ${
            likeCount === 1
              ? "Like"
              : "Likes"
          }

        </div>

        <span class="popup-category">

          🏷️ ${escapeHtml(
            spot.category ||
            "Sonstiges"
          )}

        </span>

      </div>

    `);


    markers.push(marker);

  }

}



// ===============================
// AUSGEWÄHLTEN STANDORT LÖSCHEN
// ===============================

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



// ===============================
// KARTE AKTUALISIEREN
// ===============================

async function refreshMapMarkers() {

  if (
    typeof loadSpots === "function"
  ) {

    await loadSpots();

  }

}



// ===============================
// START
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    initMap();

  }
);