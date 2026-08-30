// ===============================
// MAP.JS
// ===============================

let map = null;
let markers = [];


// ===============================
// KARTE INITIALISIEREN
// ===============================

function initMap() {

  const mapElement =
    document.getElementById("map");

  if (!mapElement) {
    console.error("Map element nicht gefunden");
    return;
  }

  map = L.map("map").setView(
    [51.5177, 7.0857],
    10
  );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; OpenStreetMap contributors'
    }
  ).addTo(map);

  renderMarkers();
}


// ===============================
// MARKER ANZEIGEN
// ===============================

async function renderMarkers() {

  if (!map) return;

  // alte Marker entfernen

  markers.forEach(marker => {
    map.removeLayer(marker);
  });

  markers = [];


  if (!Array.isArray(spots)) {
    return;
  }


  for (const spot of spots) {

    if (
      spot.latitude === undefined ||
      spot.longitude === undefined
    ) {
      continue;
    }


    // ===============================
    // LIKES LADEN
    // ===============================

    let likeCount = 0;

    try {

      const {
        count,
        error
      } = await supabaseClient
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
        likeCount = count || 0;
      }

    } catch (error) {

      console.error(
        "Likes konnten nicht geladen werden:",
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
      ]);


    marker.addTo(map);


    // ===============================
    // POPUP
    // ===============================

    marker.bindPopup(`

      <div class="map-popup">

        <h3>
          📍 ${escapeHtml(
            spot.name
          )}
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
// MARKER NEU LADEN
// ===============================

async function refreshMapMarkers() {

  await loadSpots();

  await renderMarkers();

}