const SUPABASE_URL =
  "https://ayukjqhmmgqbgtiusvsx.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_oN4MVoqoeGLRPtEEgIpalQ_H_GZk1u0";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

let map = null;
let selectedLat = null;
let selectedLng = null;
let selectedMarker = null;

let markers = [];
let spots = [];

let currentUser = null;
let currentProfile = null;


// ===============================
// START
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    initMap();
    setupButtons();

    await loadUser();
    await loadSpots();

  }
);


// ===============================
// KARTE
// ===============================

function initMap() {

  const mapElement =
    document.getElementById("map");

  if (!mapElement) return;

  map =
    L.map("map").setView(
      [51.48, 7.22],
      10
    );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }
  ).addTo(map);


  map.on("click", (event) => {

    selectedLat =
      event.latlng.lat;

    selectedLng =
      event.latlng.lng;

    setSelectedMarker(
      selectedLat,
      selectedLng
    );

    const location =
      document.getElementById(
        "selectedLocation"
      );

    if (location) {

      location.textContent =
        `📍 ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`;

    }

  });

}


// ===============================
// MARKER
// ===============================

function setSelectedMarker(
  lat,
  lng
) {

  if (!map) return;

  if (selectedMarker) {

    map.removeLayer(
      selectedMarker
    );

  }

  selectedMarker =
    L.marker([
      lat,
      lng
    ]).addTo(map);

}


// ===============================
// BUTTONS
// ===============================

function setupButtons() {

  const buttons = {

    spotButton:
      openSpotModal,

    accountButton:
      openAuthModal,

    adminButton:
      openAdminPanel,

    closeSpotBtn:
      closeSpotModal,

    cancelSpotBtn:
      closeSpotModal,

    closeAccountBtn:
      closeAuthModal,

    closeAdminBtn:
      closeAdminPanel,

    myLocationBtn:
      useMyLocation,

    publishSpotBtn:
      createSpot,

    loginBtn:
      signIn,

    registerBtn:
      signUp,

    logoutBtn:
      logout,

    saveNicknameBtn:
      saveNickname

  };


  Object.entries(buttons)
    .forEach(
      ([id, functionToRun]) => {

        const button =
          document.getElementById(id);

        if (!button) return;

        button.addEventListener(
          "click",
          functionToRun
        );

      }
    );


  const search =
    document.getElementById(
      "search"
    );

  if (search) {

    search.addEventListener(
      "input",
      renderSpots
    );

  }


  // Klick außerhalb des Fensters
  document
    .querySelectorAll(".modal")
    .forEach((modal) => {

      modal.addEventListener(
        "click",
        (event) => {

          if (
            event.target === modal
          ) {

            modal.classList.remove(
              "show"
            );

          }

        }
      );

    });

}


// ===============================
// STATUS
// ===============================

function showStatus(
  message
) {

  const status =
    document.getElementById(
      "status"
    );

  if (!status) return;

  status.textContent =
    message;

  status.style.display =
    "block";

  clearTimeout(
    window.statusTimer
  );

  window.statusTimer =
    setTimeout(
      () => {

        status.style.display =
          "none";

      },
      3500
    );

}


// ===============================
// MODALS
// ===============================

function openSpotModal() {

  if (!currentUser) {

    showStatus(
      "❌ Bitte zuerst einloggen"
    );

    openAuthModal();

    return;
  }

  document
    .getElementById(
      "spotModal"
    )
    ?.classList.add("show");

}


function closeSpotModal() {

  document
    .getElementById(
      "spotModal"
    )
    ?.classList.remove("show");

}


function openAuthModal() {

  document
    .getElementById(
      "authModal"
    )
    ?.classList.add("show");

  updateAccountUI();

}


function closeAuthModal() {

  document
    .getElementById(
      "authModal"
    )
    ?.classList.remove("show");

}


function openAdminPanel() {

  if (!isAdmin()) {

    showStatus(
      "❌ Keine Admin-Berechtigung"
    );

    return;
  }

  document
    .getElementById(
      "adminModal"
    )
    ?.classList.add("show");

  renderAdminPanel();

}


function closeAdminPanel() {

  document
    .getElementById(
      "adminModal"
    )
    ?.classList.remove("show");

}


// ===============================
// USER LADEN
// ===============================

async function loadUser() {

  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .getUser();


  if (
    error &&
    error.name !==
      "AuthSessionMissingError"
  ) {

    console.error(error);

  }


  currentUser =
    data?.user || null;


  if (currentUser) {

    await ensureProfile();

    await loadProfile();

  }


  updateAccountUI();

}


// ===============================
// PROFIL
// ===============================

async function ensureProfile() {

  if (!currentUser) return;


  const {
    data
  } =
    await supabaseClient
      .from("profiles")
      .select("id")
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();


  if (!data) {

    await supabaseClient
      .from("profiles")
      .insert({

        id:
          currentUser.id,

        nickname:
          null

      });

  }

}


async function loadProfile() {

  if (!currentUser) return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id,nickname,is_admin,role"
      )
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Profil:",
      error
    );

    return;
  }


  currentProfile =
    data || null;

}


// ===============================
// ACCOUNT UI
// ===============================

function updateAccountUI() {

  const info =
    document.getElementById(
      "accountInfo"
    );

  const loggedOut =
    document.getElementById(
      "loggedOutArea"
    );

  const loggedIn =
    document.getElementById(
      "loggedInArea"
    );

  const email =
    document.getElementById(
      "loggedInEmail"
    );

  const adminButton =
    document.getElementById(
      "adminButton"
    );

  const nickname =
    document.getElementById(
      "nicknameInput"
    );


  if (!currentUser) {

    if (info)
      info.textContent =
        "Nicht eingeloggt";

    if (loggedOut)
      loggedOut.style.display =
        "block";

    if (loggedIn)
      loggedIn.style.display =
        "none";

    if (adminButton)
      adminButton.style.display =
        "none";

    return;
  }


  if (info) {

    info.textContent =
      `👤 ${
        currentProfile?.nickname ||
        "Nickname fehlt"
      }`;

  }


  if (email) {

    email.textContent =
      `E-Mail: ${currentUser.email}`;

  }


  if (loggedOut)
    loggedOut.style.display =
      "none";


  if (loggedIn)
    loggedIn.style.display =
      "block";


  if (nickname) {

    nickname.value =
      currentProfile?.nickname ||
      "";

  }


  if (adminButton) {

    adminButton.style.display =
      isAdmin()
        ? "inline-block"
        : "none";

  }

}


// ===============================
// ADMIN
// ===============================

function isAdmin() {

  return (
    currentProfile?.is_admin ===
      true ||
    currentProfile?.role ===
      "admin"
  );

}


// ===============================
// REGISTRIEREN
// ===============================

async function signUp() {

  const email =
    document
      .getElementById("email")
      ?.value
      .trim();

  const password =
    document
      .getElementById("password")
      ?.value;


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


  showStatus(
    "⏳ Account wird erstellt..."
  );


  const {
    data,
    error
  } =
    await supabaseClient.auth.signUp({

      email,
      password

    });


  if (error) {

    showStatus(
      "❌ " + error.message
    );

    return;
  }


  if (
    data.user &&
    data.session
  ) {

    currentUser =
      data.user;

    await ensureProfile();

    await loadProfile();

    updateAccountUI();

    showStatus(
      "✅ Account erstellt!"
    );

    return;
  }


  showStatus(
    "✅ Account erstellt! Prüfe deine E-Mail zur Bestätigung."
  );

}


// ===============================
// LOGIN
// ===============================

async function signIn() {

  const email =
    document
      .getElementById("email")
      ?.value
      .trim();

  const password =
    document
      .getElementById("password")
      ?.value;


  if (!email || !password) {

    showStatus(
      "❌ E-Mail und Passwort eingeben"
    );

    return;
  }


  showStatus(
    "⏳ Einloggen..."
  );


  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .signInWithPassword({

        email,
        password

      });


  if (error) {

    showStatus(
      "❌ " + error.message
    );

    return;
  }


  currentUser =
    data.user;


  await ensureProfile();

  await loadProfile();

  updateAccountUI();

  closeAuthModal();

  showStatus(
    "✅ Eingeloggt!"
  );

}


// ===============================
// LOGOUT
// ===============================

async function logout() {

  const {
    error
  } =
    await supabaseClient
      .auth
      .signOut();


  if (error) {

    showStatus(
      "❌ " + error.message
    );

    return;
  }


  currentUser =
    null;

  currentProfile =
    null;

  updateAccountUI();

  showStatus(
    "👋 Ausgeloggt"
  );

}


// ===============================
// AUTH STATE
// ===============================

supabaseClient.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    currentUser =
      session?.user || null;


    if (currentUser) {

      await ensureProfile();

      await loadProfile();

    } else {

      currentProfile =
        null;

    }


    updateAccountUI();

  }
);


// ===============================
// NICKNAME
// ===============================

async function saveNickname() {

  if (!currentUser) {

    showStatus(
      "❌ Bitte zuerst einloggen"
    );

    return;
  }


  const input =
    document.getElementById(
      "nicknameInput"
    );

  const nickname =
    input?.value
      .trim();


  if (
    nickname.length < 2 ||
    nickname.length > 24
  ) {

    showStatus(
      "❌ Nickname muss 2–24 Zeichen haben"
    );

    return;
  }


  if (
    !/^[A-Za-z0-9ÄÖÜäöüß_ -]+$/
      .test(nickname)
  ) {

    showStatus(
      "❌ Nickname enthält ungültige Zeichen"
    );

    return;
  }


  // Prüfen, ob Nickname schon benutzt wird

  const {
    data: existing,
    error: checkError
  } =
    await supabaseClient
      .from("profiles")
      .select("id")
      .ilike(
        "nickname",
        nickname
      )
      .neq(
        "id",
        currentUser.id
      )
      .limit(1);


  if (checkError) {

    showStatus(
      "❌ " +
      checkError.message
    );

    return;
  }


  if (
    existing &&
    existing.length > 0
  ) {

    showStatus(
      "❌ Dieser Nickname ist bereits vergeben"
    );

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("profiles")
      .upsert({

        id:
          currentUser.id,

        nickname

      });


  if (error) {

    showStatus(
      "❌ " +
      error.message
    );

    return;
  }


  currentProfile = {

    ...currentProfile,

    id:
      currentUser.id,

    nickname

  };


  updateAccountUI();

  await loadSpots();

  showStatus(
    "✅ Nickname gespeichert!"
  );

}


// ===============================
// STANDORT
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

    (position) => {

      selectedLat =
        position.coords.latitude;

      selectedLng =
        position.coords.longitude;


      setSelectedMarker(
        selectedLat,
        selectedLng
      );


      if (map) {

        map.setView(
          [
            selectedLat,
            selectedLng
          ],
          15
        );

      }


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
        "❌ Standortzugriff wurde verweigert"
      );

    },

    {
      enableHighAccuracy:
        true,

      timeout:
        10000
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
      .getElementById(
        "spotName"
      )
      ?.value
      .trim();


  const description =
    document
      .getElementById(
        "spotDescription"
      )
      ?.value
      .trim();


  const category =
    document
      .getElementById(
        "spotCategory"
      )
      ?.value;


  const photo =
    document
      .getElementById(
        "spotPhoto"
      )
      ?.files?.[0];


  if (!name) {

    showStatus(
      "❌ Name eingeben"
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


  let photoUrl =
    null;


  // FOTO

  if (photo) {

    if (
      photo.size >
      8 * 1024 * 1024
    ) {

      showStatus(
        "❌ Foto darf maximal 8 MB groß sein"
      );

      return;
    }


    const extension =
      photo.name
        .split(".")
        .pop()
        .toLowerCase();


    const path =
      `${currentUser.id}/${Date.now()}.${extension}`;


    const {
      error
    } =
      await supabaseClient
        .storage
        .from("spot-photos")
        .upload(
          path,
          photo,
          {
            cacheControl:
              "3600",

            upsert:
              false,

            contentType:
              photo.type
          }
        );


    if (error) {

      showStatus(
        "❌ Foto: " +
        error.message
      );

      return;
    }


    photoUrl =
      supabaseClient
        .storage
        .from("spot-photos")
        .getPublicUrl(
          path
        )
        .data
        .publicUrl;

  }


  // SPOT

  const {
    data: spot,
    error
  } =
    await supabaseClient
      .from("spots")
      .insert({

        name,

        description,

        category,

        latitude:
          selectedLat,

        longitude:
          selectedLng,

        user_id:
          currentUser.id

      })
      .select()
      .single();


  if (error) {

    showStatus(
      "❌ " +
      error.message
    );

    return;
  }


  // FOTO DB

  if (
    photoUrl &&
    spot
  ) {

    await supabaseClient
      .from("spot_photos")
      .insert({

        spot_id:
          spot.id,

        image_url:
          photoUrl,

        user_id:
          currentUser.id

      });

  }


  closeSpotModal();

  selectedLat =
    null;

  selectedLng =
    null;


  if (selectedMarker) {

    map.removeLayer(
      selectedMarker
    );

    selectedMarker =
      null;

  }


  document.getElementById(
    "spotName"
  ).value = "";


  document.getElementById(
    "spotDescription"
  ).value = "";


  document.getElementById(
    "spotPhoto"
  ).value = "";


  document.getElementById(
    "selectedLocation"
  ).textContent =
    "📍 Noch kein Standort ausgewählt";


  showStatus(
    "✅ Spot veröffentlicht!"
  );


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
          ascending:
            false
        }
      );


  if (error) {

    console.error(
      error
    );

    showStatus(
      "❌ Spots konnten nicht geladen werden"
    );

    return;
  }


  spots =
    data || [];


  renderMarkers();

  await renderSpots();

}


// ===============================
// MARKER RENDERN
// ===============================

function renderMarkers() {

  markers.forEach(
    marker => {

      map.removeLayer(
        marker
      );

    }
  );


  markers = [];


  spots.forEach(
    spot => {

      if (
        spot.latitude === null ||
        spot.longitude === null
      ) return;


      const marker =
        L.marker([

          Number(
            spot.latitude
          ),

          Number(
            spot.longitude
          )

        ]).addTo(map);


      marker.bindPopup(`

        <strong>
          ${escapeHtml(
            spot.name
          )}
        </strong>

        <br>

        ${escapeHtml(
          spot.category ||
          ""
        )}

      `);


      markers.push(
        marker
      );

    }
  );

}


// ===============================
// SPOTS ANZEIGEN
// ===============================

async function renderSpots() {

  const container =
    document.getElementById(
      "spotList"
    );


  if (!container) return;


  const query =
    document
      .getElementById(
        "search"
      )
      ?.value
      .toLowerCase()
      .trim() ||
      "";


  const filtered =
    spots.filter(
      spot => {

        const text =
          `${spot.name || ""}
           ${spot.description || ""}
           ${spot.category || ""}`
            .toLowerCase();


        return text.includes(
          query
        );

      }
    );


  if (!filtered.length) {

    container.innerHTML = `

      <div class="empty">

        Noch keine passenden Spots 😭

      </div>

    `;

    return;
  }


  const ids =
    filtered.map(
      spot => spot.id
    );


  const userIds =
    [
      ...new Set(
        filtered
          .map(
            spot =>
              spot.user_id
          )
          .filter(Boolean)
      )
    ];


  let profiles = [];
  let photos = [];
  let likes = [];


  if (userIds.length) {

    const result =
      await supabaseClient
        .from("profiles")
        .select(
          "id,nickname"
        )
        .in(
          "id",
          userIds
        );

    profiles =
      result.data || [];

  }


  if (ids.length) {

    const photoResult =
      await supabaseClient
        .from("spot_photos")
        .select(
          "spot_id,image_url"
        )
        .in(
          "spot_id",
          ids
        );


    photos =
      photoResult.data || [];


    const likeResult =
      await supabaseClient
        .from("likes")
        .select(
          "spot_id,user_id"
        )
        .in(
          "spot_id",
          ids
        );


    likes =
      likeResult.data || [];

  }


  const profileMap =
    Object.fromEntries(
      profiles.map(
        profile => [

          profile.id,

          profile.nickname

        ]
      )
    );


  const photoMap = {};


  photos.forEach(
    photo => {

      if (
        !photoMap[
          photo.spot_id
        ]
      ) {

        photoMap[
          photo.spot_id
        ] =
          photo.image_url;

      }

    }
  );


  container.innerHTML =
    filtered
      .map(
        spot => {

          const spotLikes =
            likes.filter(
              like =>
                like.spot_id ===
                spot.id
            );


          const liked =
            !!currentUser &&
            spotLikes.some(
              like =>
                like.user_id ===
                currentUser.id
            );


          const canDelete =
            !!currentUser &&
            (
              spot.user_id ===
                currentUser.id ||
              isAdmin()
            );


          const nickname =
            profileMap[
              spot.user_id
            ] ||
            "Unbekannter Nutzer";


          const image =
            photoMap[
              spot.id
            ];


          return `

            <article class="spot">

              ${
                image
                  ? `
                    <img
                      src="${escapeHtml(image)}"
                      alt="Spot Foto"
                      loading="lazy"
                    >
                  `
                  : ""
              }

              <div class="spot-content">

                <h3>
                  📍
                  ${escapeHtml(
                    spot.name
                  )}
                </h3>


                <span class="category">

                  ${escapeHtml(
                    spot.category ||
                    "Sonstiges"
                  )}

                </span>


                <p>

                  ${escapeHtml(
                    spot.description ||
                    "Keine Beschreibung"
                  )}

                </p>


                <div class="creator">

                  👤 Erstellt von:
                  ${escapeHtml(
                    nickname
                  )}

                </div>


                <button

                  class="like-btn ${
                    liked
                      ? "liked"
                      : ""
                  }"

                  type="button"

                  onclick="
                    toggleLike(
                      '${escapeAttr(
                        spot.id
                      )}'
                    )
                  "

                >

                  ❤️
                  ${
                    liked
                      ? "Geliked"
                      : "Like"
                  }

                  ·
                  ${spotLikes.length}

                </button>


                ${
                  canDelete
                    ? `

                      <button

                        class="delete-btn"

                        type="button"

                        onclick="
                          deleteSpot(
                            '${escapeAttr(
                              spot.id
                            )}'
                          )
                        "

                      >

                        🗑️ Spot löschen

                      </button>

                    `
                    : ""
                }

              </div>

            </article>

          `;

        }
      )
      .join("");

}


// ===============================
// LIKE
// ===============================

async function toggleLike(
  spotId
) {

  if (!currentUser) {

    showStatus(
      "❌ Bitte zuerst einloggen"
    );

    openAuthModal();

    return;
  }


  const {
    data: existing,
    error
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


  if (error) {

    showStatus(
      "❌ " +
      error.message
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

          spot_id:
            spotId,

          user_id:
            currentUser.id

        });


    if (error) {

      showStatus(
        "❌ " +
        error.message
      );

      return;
    }


    showStatus(
      "❤️ Geliked"
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

    showStatus(
      "❌ Bitte einloggen"
    );

    return;
  }


  const spot =
    spots.find(
      item =>
        String(item.id) ===
        String(spotId)
    );


  if (!spot) return;


  if (
    spot.user_id !==
      currentUser.id &&
    !isAdmin()
  ) {

    showStatus(
      "❌ Keine Berechtigung"
    );

    return;
  }


  if (
    !confirm(
      `Spot "${spot.name}" wirklich löschen?`
    )
  ) return;


  showStatus(
    "⏳ Lösche Spot..."
  );


  await supabaseClient
    .from("likes")
    .delete()
    .eq(
      "spot_id",
      spotId
    );


  await supabaseClient
    .from("spot_photos")
    .delete()
    .eq(
      "spot_id",
      spotId
    );


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
    "✅ Spot gelöscht"
  );


  await loadSpots();


  if (isAdmin()) {

    renderAdminPanel();

  }

}


// ===============================
// ADMIN PANEL
// ===============================

async function renderAdminPanel() {

  const container =
    document.getElementById(
      "adminContent"
    );


  if (!container) return;


  if (!isAdmin()) {

    container.innerHTML =
      "<p>Keine Berechtigung.</p>";

    return;
  }


  container.innerHTML = `

    <h3>
      📍 Alle Spots
    </h3>

    ${
      spots.length
        ? spots
            .map(
              spot => `

                <div class="admin-user">

                  <strong>

                    ${escapeHtml(
                      spot.name
                    )}

                  </strong>

                  <br>

                  <small>

                    Erstellt von:
                    ${escapeHtml(
                      spot.user_id
                    )}

                  </small>


                  <button

                    class="delete-btn"

                    type="button"

                    onclick="
                      deleteSpot(
                        '${escapeAttr(
                          spot.id
                        )}'
                      )
                    "

                  >

                    🗑️ Löschen

                  </button>

                </div>

              `
            )
            .join("")
        : `
          <p style="color:#777">
            Keine Spots vorhanden.
          </p>
        `
    }

  `;

}


// ===============================
// SICHERHEIT
// ===============================

function escapeHtml(
  value
) {

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


function escapeAttr(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "'",
      "&#039;"
    );

}


// ===============================
// GLOBAL
// ===============================

window.signUp =
  signUp;

window.signIn =
  signIn;

window.logout =
  logout;

window.saveNickname =
  saveNickname;

window.createSpot =
  createSpot;

window.useMyLocation =
  useMyLocation;

window.toggleLike =
  toggleLike;

window.deleteSpot =
  deleteSpot;

window.openSpotModal =
  openSpotModal;

window.closeSpotModal =
  closeSpotModal;

window.openAuthModal =
  openAuthModal;

window.closeAuthModal =
  closeAuthModal;

window.openAdminPanel =
  openAdminPanel;

window.closeAdminPanel =
  closeAdminPanel;