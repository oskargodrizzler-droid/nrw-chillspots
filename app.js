const SUPABASE_URL = "https://ayukjqhmmgqbgtiusvsx.supabase.co";
const SUPABASE_KEY = "sb_publishable_oN4MVoqoeGLRPtEEgIpalQ_H_GZk1u0";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ===============================
// STATE
// ===============================

let map;
let selectedLat = null;
let selectedLng = null;
let selectedMarker = null;

let spots = [];
let markers = [];

let currentUser = null;
let currentProfile = null;


// ===============================
// START
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
  initMap();
  setupButtons();
  await loadUser();
  await loadSpots();
});


// ===============================
// KARTE
// ===============================

function initMap() {

  const mapElement = document.getElementById("map");

  if (!mapElement) {
    console.error("Map element fehlt");
    return;
  }

  map = L.map("map").setView(
    [51.48, 7.22],
    10
  );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);

  map.on("click", (e) => {

    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;

    if (selectedMarker) {
      map.removeLayer(selectedMarker);
    }

    selectedMarker = L.marker([
      selectedLat,
      selectedLng
    ]).addTo(map);

    const location = document.getElementById(
      "selectedLocation"
    );

    if (location) {
      location.textContent =
        `📍 ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`;
    }
  });
}


// ===============================
// BUTTONS
// ===============================

function setupButtons() {

  // =========================
  // HAUPT-BUTTONS
  // =========================

  const spotButton =
    document.getElementById("spotButton");

  const accountButton =
    document.getElementById("accountButton");

  const adminButton =
    document.getElementById("adminButton");


  if (spotButton) {
    spotButton.onclick = openSpotModal;
  }

  if (accountButton) {
    accountButton.onclick = openAuthModal;
  }

  if (adminButton) {
    adminButton.onclick = openAdminPanel;
  }


  // =========================
  // SPOT MODAL SCHLIESSEN
  // =========================

  const closeSpotBtn =
    document.getElementById("closeSpotBtn");

  const cancelSpotBtn =
    document.getElementById("cancelSpotBtn");

  if (closeSpotBtn) {
    closeSpotBtn.onclick = closeSpotModal;
  }

  if (cancelSpotBtn) {
    cancelSpotBtn.onclick = closeSpotModal;
  }


  // =========================
  // ACCOUNT MODAL SCHLIESSEN
  // =========================

  const closeAccountBtn =
    document.getElementById("closeAccountBtn");

  if (closeAccountBtn) {
    closeAccountBtn.onclick = closeAuthModal;
  }


  // =========================
  // ADMIN MODAL SCHLIESSEN
  // =========================

  const closeAdminBtn =
    document.getElementById("closeAdminBtn");

  if (closeAdminBtn) {

    closeAdminBtn.onclick = () => {

      document
        .getElementById("adminModal")
        ?.classList.remove("show");

    };
  }


  // =========================
  // SUCHE
  // =========================

  const search =
    document.getElementById("search");

  if (search) {

    search.addEventListener(
      "input",
      renderSpots
    );

  }
}

// ===============================
// STATUS
// ===============================

function showStatus(message) {

  let status = document.getElementById("status");

  if (!status) {

    status = document.createElement("div");

    status.id = "status";
    status.className = "status";

    document.body.appendChild(status);
  }

  status.textContent = message;
  status.style.display = "block";

  clearTimeout(window.statusTimer);

  window.statusTimer = setTimeout(() => {
    status.style.display = "none";
  }, 3000);
}


// ===============================
// MODALS
// ===============================

function openSpotModal() {

  if (!currentUser) {

    showStatus(
      "❌ Du musst zuerst einen Account erstellen"
    );

    openAuthModal();

    return;
  }

  document
    .getElementById("spotModal")
    ?.classList.add("show");
}

function closeSpotModal() {

  document
    .getElementById("spotModal")
    ?.classList.remove("show");
}

function openAuthModal() {

  document
    .getElementById("authModal")
    ?.classList.add("show");

  updateAccountUI();
}

function closeAuthModal() {

  document
    .getElementById("authModal")
    ?.classList.remove("show");
}


// ===============================
// ACCOUNT LADEN
// ===============================

async function loadUser() {

  const {
    data,
    error
  } = await supabaseClient.auth.getUser();

  if (error) {
    console.error(error);
    return;
  }

  currentUser = data.user || null;

  if (currentUser) {
    await loadProfile();
  }

  updateAccountUI();
}


// ===============================
// PROFIL
// ===============================

async function loadProfile() {

  if (!currentUser) return;

  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error("Profil:", error);
    return;
  }

  currentProfile = data;
}


// ===============================
// ACCOUNT UI
// ===============================

function updateAccountUI() {

  const info =
    document.getElementById("accountInfo");

  const logoutButton =
    document.getElementById("logoutButton");

  const adminButton =
    document.getElementById("adminButton");

  if (!currentUser) {

    if (info) {
      info.textContent = "Nicht eingeloggt";
    }

    if (logoutButton) {
      logoutButton.style.display = "none";
    }

    if (adminButton) {
      adminButton.style.display = "none";
    }

    return;
  }

  if (info) {

    info.textContent =
      `👤 ${currentUser.email}`;
  }

  if (logoutButton) {
    logoutButton.style.display = "block";
  }

  if (
    adminButton &&
    isAdmin()
  ) {

    adminButton.style.display = "block";

  } else if (adminButton) {

    adminButton.style.display = "none";
  }
}


// ===============================
// ADMIN
// ===============================

function isAdmin() {

  if (!currentProfile) {
    return false;
  }

  return (
    currentProfile.is_admin === true ||
    currentProfile.role === "admin"
  );
}


// ===============================
// REGISTRIEREN
// ===============================

async function signUp() {

  const email =
    document.getElementById("email")?.value.trim();

  const password =
    document.getElementById("password")?.value;

  if (!email || !password) {

    showStatus(
      "❌ E-Mail und Passwort eingeben"
    );

    return;
  }

  if (password.length < 6) {

    showStatus(
      "❌ Passwort mindestens 6 Zeichen"
    );

    return;
  }

  showStatus("⏳ Account wird erstellt...");

  const {
    data,
    error
  } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {

    showStatus(
      "❌ " + error.message
    );

    return;
  }

  currentUser = data.user;

  if (currentUser) {
    await loadProfile();
  }

  updateAccountUI();

  showStatus(
    "✅ Account erstellt"
  );
}


// ===============================
// EINLOGGEN
// ===============================

async function signIn() {

  const email =
    document.getElementById("email")?.value.trim();

  const password =
    document.getElementById("password")?.value;

  if (!email || !password) {

    showStatus(
      "❌ E-Mail und Passwort eingeben"
    );

    return;
  }

  showStatus("⏳ Einloggen...");

  const {
    data,
    error
  } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {

    showStatus(
      "❌ " + error.message
    );

    return;
  }

  currentUser = data.user;

  await loadProfile();

  updateAccountUI();

  closeAuthModal();

  showStatus("✅ Eingeloggt");
}


// ===============================
// AUSLOGGEN
// ===============================

async function logout() {

  const {
    error
  } =
    await supabaseClient.auth.signOut();

  if (error) {

    showStatus(
      "❌ " + error.message
    );

    return;
  }

  currentUser = null;
  currentProfile = null;

  updateAccountUI();

  showStatus("👋 Ausgeloggt");
}


// ===============================
// AUTH STATE
// ===============================

supabaseClient.auth.onAuthStateChange(
  async (_event, session) => {

    currentUser =
      session?.user || null;

    if (currentUser) {
      await loadProfile();
    } else {
      currentProfile = null;
    }

    updateAccountUI();
  }
);


// ===============================
// MEIN STANDORT
// ===============================

function useMyLocation() {

  if (!navigator.geolocation) {

    showStatus(
      "❌ Standort wird nicht unterstützt"
    );

    return;
  }

  showStatus(
    "📍 Standort wird gesucht..."
  );

  navigator.geolocation.getCurrentPosition(
    (position) => {

      selectedLat =
        position.coords.latitude;

      selectedLng =
        position.coords.longitude;

      if (map) {

        map.setView(
          [selectedLat, selectedLng],
          15
        );
      }

      if (selectedMarker) {
        map.removeLayer(selectedMarker);
      }

      selectedMarker =
        L.marker([
          selectedLat,
          selectedLng
        ]).addTo(map);

      const location =
        document.getElementById(
          "selectedLocation"
        );

      if (location) {
        location.textContent =
          "📍 Dein Standort";
      }

      showStatus(
        "✅ Standort ausgewählt"
      );
    },

    () => {

      showStatus(
        "❌ Standort konnte nicht abgerufen werden"
      );
    }
  );
}


// ===============================
// SPOT ERSTELLEN
// ===============================

async function createSpot() {

  if (!currentUser) {

    showStatus(
      "❌ Bitte zuerst einloggen"
    );

    return;
  }

  const name =
    document
      .getElementById("spotName")
      ?.value.trim();

  const description =
    document
      .getElementById("spotDescription")
      ?.value.trim();

  const category =
    document
      .getElementById("spotCategory")
      ?.value;

  const photoInput =
    document.getElementById("spotPhoto");

  const photoFile =
    photoInput?.files?.[0];

  if (!name) {

    showStatus(
      "❌ Spot-Name fehlt"
    );

    return;
  }

  if (
    selectedLat === null ||
    selectedLng === null
  ) {

    showStatus(
      "❌ Standort auswählen"
    );

    return;
  }

  showStatus(
    "⏳ Spot wird erstellt..."
  );

  let photoUrl = null;


  // FOTO

  if (photoFile) {

    const extension =
      photoFile.name
        .split(".")
        .pop()
        .toLowerCase();

    const fileName =
      `${currentUser.id}/${crypto.randomUUID()}.${extension}`;

    const {
      error: uploadError
    } =
      await supabaseClient
        .storage
        .from("spot-photos")
        .upload(
          fileName,
          photoFile,
          {
            cacheControl: "3600",
            upsert: false
          }
        );

    if (uploadError) {

      showStatus(
        "❌ Foto: " +
        uploadError.message
      );

      return;
    }

    const {
      data
    } =
      supabaseClient
        .storage
        .from("spot-photos")
        .getPublicUrl(fileName);

    photoUrl =
      data.publicUrl;
  }


  // SPOT

  const {
    data: newSpot,
    error
  } =
    await supabaseClient
      .from("spots")
      .insert({
        name,
        description,
        category,
        latitude: selectedLat,
        longitude: selectedLng,
        user_id: currentUser.id
      })
      .select()
      .single();

  if (error) {

    showStatus(
      "❌ " + error.message
    );

    return;
  }


  // FOTO ZU SPOT

  if (photoUrl && newSpot) {

    const {
      error: photoError
    } =
      await supabaseClient
        .from("spot_photos")
        .insert({
          spot_id: newSpot.id,
          image_url: photoUrl,
          user_id: currentUser.id
        });

    if (photoError) {

      console.error(
        "Foto DB:",
        photoError
      );
    }
  }


  showStatus(
    "✅ Spot veröffentlicht!"
  );

  document.getElementById("spotName").value = "";
  document.getElementById("spotDescription").value = "";

  if (photoInput) {
    photoInput.value = "";
  }

  selectedLat = null;
  selectedLng = null;

  if (selectedMarker) {
    map.removeLayer(selectedMarker);
    selectedMarker = null;
  }

  closeSpotModal();

  await loadSpots();
}


// ===============================
// SPOTS LADEN
// ===============================

async function loadSpots() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("spots")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {

    console.error(
      "Spots:",
      error
    );

    showStatus(
      "❌ Spots konnten nicht geladen werden"
    );

    return;
  }

  spots = data || [];

  await renderSpots();
  renderMarkers();
}


// ===============================
// MARKER
// ===============================

function renderMarkers() {

  markers.forEach(marker => {

    if (map) {
      map.removeLayer(marker);
    }
  });

  markers = [];

  spots.forEach(spot => {

    if (
      spot.latitude === null ||
      spot.longitude === null
    ) {
      return;
    }

    const marker =
      L.marker([
        Number(spot.latitude),
        Number(spot.longitude)
      ]).addTo(map);

    marker.bindPopup(`
      <strong>
        📍 ${escapeHtml(spot.name)}
      </strong>
      <br>
      ${escapeHtml(
        spot.category || ""
      )}
    `);

    markers.push(marker);
  });
}


// ===============================
// SPOTS RENDERN
// ===============================

async function renderSpots() {

  const container =
    document.getElementById("spotList");

  if (!container) return;

  const query =
    document
      .getElementById("search")
      ?.value
      .toLowerCase()
      .trim() || "";

  const filtered =
    spots.filter(spot => {

      const text =
        `${spot.name || ""}
         ${spot.description || ""}
         ${spot.category || ""}`
          .toLowerCase();

      return text.includes(query);
    });


  if (!filtered.length) {

    container.innerHTML = `
      <div class="empty">
        Noch keine Spots 😭
      </div>
    `;

    return;
  }


  container.innerHTML = "";


  for (const spot of filtered) {

    let imageUrl = null;

    const {
      data: photos
    } =
      await supabaseClient
        .from("spot_photos")
        .select("image_url")
        .eq(
          "spot_id",
          spot.id
        )
        .limit(1);

    if (
      photos &&
      photos.length
    ) {

      imageUrl =
        photos[0].image_url;
    }


    // LIKES

    const {
      count: likeCount
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


    let liked = false;

    if (currentUser) {

      const {
        data: myLike
      } =
        await supabaseClient
          .from("likes")
          .select("id")
          .eq(
            "spot_id",
            spot.id
          )
          .eq(
            "user_id",
            currentUser.id
          )
          .maybeSingle();

      liked = !!myLike;
    }


    // ERSTELLER

    let creatorText =
      "Unbekannter Nutzer";

    if (spot.user_id) {

      const {
        data: creator
      } =
        await supabaseClient
          .from("profiles")
          .select("email")
          .eq(
            "id",
            spot.user_id
          )
          .maybeSingle();

      if (creator?.email) {
        creatorText =
          creator.email;
      }
    }


    const card =
      document.createElement("div");

    card.className = "spot";


    card.innerHTML = `

      ${
        imageUrl
          ? `
            <img
              src="${escapeHtml(imageUrl)}"
              alt="Foto von ${escapeHtml(spot.name)}"
            >
          `
          : ""
      }

      <div class="spot-content">

        <h3>
          📍 ${escapeHtml(spot.name)}
        </h3>

        <span class="category">
          ${escapeHtml(
            spot.category || "Sonstiges"
          )}
        </span>

        <p>
          ${escapeHtml(
            spot.description ||
            "Keine Beschreibung"
          )}
        </p>

        <p class="creator">
          👤 Erstellt von:
          <strong>
            ${escapeHtml(creatorText)}
          </strong>
        </p>

        <button
          class="like-btn ${liked ? "liked" : ""}"
          data-like="${spot.id}"
        >
          ❤️ ${liked ? "Geliked" : "Like"}
          · ${likeCount || 0}
        </button>

        ${
          isAdmin() || spot.user_id === currentUser?.id
            ? `
              <button
                class="delete-btn"
                data-delete="${spot.id}"
              >
                🗑️ Löschen
              </button>
            `
            : ""
        }

      </div>
    `;


    const likeButton =
      card.querySelector(
        "[data-like]"
      );

    if (likeButton) {

      likeButton.onclick = () =>
        likeSpot(
          spot.id,
          likeButton
        );
    }


    const deleteButton =
      card.querySelector(
        "[data-delete]"
      );

    if (deleteButton) {

      deleteButton.onclick = () =>
        deleteSpot(
          spot.id
        );
    }


    container.appendChild(card);
  }
}


// ===============================
// LIKE
// ===============================

async function likeSpot(
  spotId,
  button
) {

  if (!currentUser) {

    showStatus(
      "❌ Bitte einloggen"
    );

    openAuthModal();

    return;
  }


  const {
    data: existing,
    error: findError
  } =
    await supabaseClient
      .from("likes")
      .select("id")
      .eq(
        "spot_id",
        spotId
      )
      .eq(
        "user_id",
        currentUser.id
      )
      .maybeSingle();


  if (findError) {

    showStatus(
      "❌ " +
      findError.message
    );

    return;
  }


  if (existing) {

    const {
      error
    } =
      await supabaseClient
        .from("likes")
        .delete()
        .eq(
          "id",
          existing.id
        );

    if (error) {

      showStatus(
        "❌ " +
        error.message
      );

      return;
    }

    showStatus(
      "💔 Like entfernt"
    );

  } else {

    const {
      error
    } =
      await supabaseClient
        .from("likes")
        .insert({
          spot_id: spotId,
          user_id: currentUser.id
        });

    if (error) {

      showStatus(
        "❌ " +
        error.message
      );

      return;
    }

    showStatus(
      "❤️ Geliked!"
    );
  }

  await renderSpots();
}


// ===============================
// SPOT LÖSCHEN
// ===============================

async function deleteSpot(
  spotId
) {

  if (!currentUser) {
    return;
  }

  const spot =
    spots.find(
      s => s.id === spotId
    );

  if (!spot) return;


  const allowed =
    isAdmin() ||
    spot.user_id === currentUser.id;

  if (!allowed) {

    showStatus(
      "❌ Keine Berechtigung"
    );

    return;
  }


  const confirmed =
    confirm(
      "Diesen Spot wirklich löschen?"
    );

  if (!confirmed) {
    return;
  }


  showStatus(
    "⏳ Spot wird gelöscht..."
  );


  // FOTOS

  await supabaseClient
    .from("spot_photos")
    .delete()
    .eq(
      "spot_id",
      spotId
    );


  // LIKES

  await supabaseClient
    .from("likes")
    .delete()
    .eq(
      "spot_id",
      spotId
    );


  // SPOT

  const {
    error
  } =
    await supabaseClient
      .from("spots")
      .delete()
      .eq(
        "id",
        spotId
      );


  if (error) {

    showStatus(
      "❌ " +
      error.message
    );

    return;
  }


  showStatus(
    "🗑️ Spot gelöscht"
  );

  await loadSpots();
}


// ===============================
// ADMIN INTERFACE
// ===============================

async function openAdminPanel() {

  if (!isAdmin()) {

    showStatus(
      "❌ Keine Admin-Rechte"
    );

    return;
  }

  let modal =
    document.getElementById(
      "adminModal"
    );

  if (!modal) {

    modal =
      document.createElement("div");

    modal.id =
      "adminModal";

    modal.className =
      "modal";

    modal.innerHTML = `

      <div class="modal-box">

        <h2>🛡️ Admin Panel</h2>

        <p>
          Hier siehst du alle Spots
          und ihre Ersteller.
        </p>

        <div id="adminSpots">
          Laden...
        </div>

        <button
          class="secondary"
          onclick="
            document
              .getElementById('adminModal')
              .classList.remove('show')
          "
        >
          Schließen
        </button>

      </div>
    `;

    document.body.appendChild(modal);
  }

  modal.classList.add("show");

  await renderAdminPanel();
}


async function renderAdminPanel() {

  const container =
    document.getElementById(
      "adminSpots"
    );

  if (!container) return;

  if (!spots.length) {

    container.innerHTML =
      "<p>Keine Spots vorhanden.</p>";

    return;
  }


  container.innerHTML = "";


  for (const spot of spots) {

    const row =
      document.createElement("div");

    row.style.padding =
      "12px 0";

    row.style.borderBottom =
      "1px solid #333";


    row.innerHTML = `

      <strong>
        📍 ${escapeHtml(spot.name)}
      </strong>

      <br>

      <small>
        ID:
        ${escapeHtml(spot.id)}
      </small>

      <br>

      <small>
        User:
        ${escapeHtml(
          spot.user_id || "unbekannt"
        )}
      </small>

      <br><br>

      <button
        class="delete-btn"
      >
        🗑️ Spot löschen
      </button>
    `;


    row
      .querySelector("button")
      .onclick = async () => {

        await deleteSpot(
          spot.id
        );

        await renderAdminPanel();
      };


    container.appendChild(row);
  }
}


// ===============================
// HTML SICHER MACHEN
// ===============================

function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
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


// ===============================
// GLOBALE BUTTON-FUNKTIONEN
// ===============================

window.openSpotModal =
  openSpotModal;

window.closeSpotModal =
  closeSpotModal;

window.openAuthModal =
  openAuthModal;

window.closeAuthModal =
  closeAuthModal;

window.useMyLocation =
  useMyLocation;

window.createSpot =
  createSpot;

window.signUp =
  signUp;

window.signIn =
  signIn;

window.logout =
  logout;

window.likeSpot =
  likeSpot;

window.deleteSpot =
  deleteSpot;

window.openAdminPanel =
  openAdminPanel;