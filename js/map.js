// ===============================
// MAP
// ===============================

let map = null;

let markers = [];

let selectedLat = null;
let selectedLng = null;

let selectedMarker = null;


// ===============================
// INIT
// ===============================

function initMap() {

  const element =
    document.getElementById("map");


  if (!element) {
    return;
  }


  if (map) {
    return;
  }


  map =
    L.map("map").setView(
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


  map.on(
    "click",
    function (event) {

      selectedLat =
        event.latlng.lat;

      selectedLng =
        event.latlng.lng;


      if (selectedMarker) {

        map.removeLayer(
          selectedMarker
        );

      }


      selectedMarker =
        L.marker([
          selectedLat,
          selectedLng
        ]).addTo(map);


      selectedMarker
        .bindPopup(
          "📍 Ausgewählter Standort"
        )
        .openPopup();


      const text =
        document.getElementById(
          "selectedLocation"
        );


      if (text) {

        text.textContent =
          `📍 ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`;

      }

    }
  );


  renderMarkers();

}



// ===============================
// MEIN STANDORT
// ===============================

function useMyLocation() {

  if (
    !navigator.geolocation
  ) {

    showStatus(
      "❌ Standort wird nicht unterstützt"
    );

    return;
  }


  showStatus(
    "📍 Standort wird gesucht..."
  );


  navigator.geolocation.getCurrentPosition(

    function (position) {

      selectedLat =
        position.coords.latitude;

      selectedLng =
        position.coords.longitude;


      if (map) {

        map.setView(
          [
            selectedLat,
            selectedLng
          ],
          16
        );

      }


      if (selectedMarker) {

        map.removeLayer(
          selectedMarker
        );

      }


      selectedMarker =
        L.marker([
          selectedLat,
          selectedLng
        ]).addTo(map);


      selectedMarker
        .bindPopup(
          "📍 Dein Standort"
        )
        .openPopup();


      const text =
        document.getElementById(
          "selectedLocation"
        );


      if (text) {

        text.textContent =
          "📍 Dein Standort ausgewählt";

      }


      showStatus(
        "✅ Standort ausgewählt"
      );

    },


    function (error) {

      console.error(
        "GEOLOCATION:",
        error
      );


      if (error.code === 1) {

        showStatus(
          "❌ Standortzugriff verweigert"
        );

      } else {

        showStatus(
          "❌ Standort konnte nicht ermittelt werden"
        );

      }

    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

  );

}



// ===============================
// SPOT MARKER
// ===============================

async function renderMarkers() {

  if (!map) {
    return;
  }


  markers.forEach(
    marker =>
      map.removeLayer(marker)
  );


  markers = [];


  if (
    !Array.isArray(spots)
  ) {
    return;
  }


  for (
    const spot of spots
  ) {

    if (
      spot.latitude == null ||
      spot.longitude == null
    ) {
      continue;
    }


    let likeCount = 0;


    const {
      count
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


    likeCount =
      count || 0;


    const marker =
      L.marker([
        Number(spot.latitude),
        Number(spot.longitude)
      ]).addTo(map);


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
          ❤️ <strong>${likeCount}</strong>
          ${likeCount === 1 ? "Like" : "Likes"}
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
// CLEAR LOCATION
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


  const text =
    document.getElementById(
      "selectedLocation"
    );


  if (text) {

    text.textContent =
      "Noch kein Standort ausgewählt";

  }

}



// ===============================
// ESCAPE
// ===============================

function escapeHtml(value) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}
