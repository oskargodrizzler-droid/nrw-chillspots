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


// ========================================
// START
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    initMap();

    setupButtons();

    await loadUser();

    await loadSpots();

  }
);


// ========================================
// MAP
// ========================================

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


  map.on(
    "click",
    (event) => {

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


      const location =
        document.getElementById(
          "selectedLocation"
        );


      if (location) {

        location.textContent =
          `📍 ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`;

      }

    }
  );

}


// ========================================
// BUTTONS
// ========================================

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

    registerBtn:
      signUp,

    loginBtn:
      signIn,

    logoutBtn:
      logout,

    saveNicknameBtn:
      saveNickname

  };


  Object.entries(buttons)
    .forEach(
      ([id, fn]) => {

        const button =
          document.getElementById(id);


        if (!button) return;


        button.addEventListener(
          "click",
          fn
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


  document
    .querySelectorAll(".modal")
    .forEach(
      (modal) => {

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

      }
    );

}


// ========================================
// STATUS
// ========================================

function showStatus(
  message
) {

  const element =
    document.getElementById(
      "status"
    );


  if (!element) return;


  element.textContent =
    message;


  element.style.display =
    "block";


  clearTimeout(
    window.statusTimer
  );


  window.statusTimer =
    setTimeout(
      () => {

        element.style.display =
          "none";

      },
      3500
    );

}


// ========================================
// MODALS
// ========================================

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


// ========================================
// AUTH
// ========================================

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

    console.error(
      error
    );

  }


  currentUser =
    data?.user || null;


  if (currentUser) {

    await ensureProfile();

    await loadProfile();

  }


  updateAccountUI();

}


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
      "Profil konnte nicht geladen werden:",
      error
    );

    return;
  }


  currentProfile =
    data || null;

}


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


// ========================================
// REGISTER
// ========================================

async function signUp() {

  const email =
    document
      .getElementById(
        "email"
      )
      ?.value
      .trim();


  const password =
    document
      .getElementById(
        "password"
      )
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
    await supabaseClient
      .auth
      .signUp({

        email,

        password

      });


  if (error) {

    showStatus(
      "❌ " +
      error.message
    );

    return;
  }


  if (
    data?.user &&
    data?.session
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
    "✅ Account erstellt! Prüfe deine E-Mail."
  );

}


// ========================================
// LOGIN
// ========================================

async function signIn() {

  const email =
    document
      .getElementById(
        "email"
      )
      ?.value
      .trim();


  const password =
    document
      .getElementById(
        "password"
      )
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
      "❌ " +
      error.message
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


// ========================================
// LOGOUT
// ========================================

async function logout() {

  const {
    error
  } =
    await supabaseClient
      .auth
      .signOut();


  if (error) {

    showStatus(
      "❌ " +
      error.message
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


// ========================================
// AUTH STATE
// ========================================

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


// ========================================
// NICKNAME
// ========================================

async function saveNickname() {

  if (!currentUser) {

    showStatus(
      "❌ Bitte zuerst einloggen"
    );

    return;
  }


  const nickname =
    document
      .getElementById(
        "nicknameInput"
      )
      ?.value
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
      "❌ Ungültige Zeichen im Nickname"
    );

    return;
  }


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


// ========================================
// LOCATION
// ========================================

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


      map.setView(
        [
          selectedLat,
          selectedLng
        ],
        15
      );


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
        "❌ Standortzugriff verweigert"
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


// ========================================
// CREATE SPOT
// ========================================

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
      "❌ Gib einen Namen ein"
    );

    return;
  }


  if (
    selectedLat === null ||
    selectedLng === null
  ) {

    showStatus(
      "❌ Wähle zuerst einen Standort"
    );

    return;
  }


  if (
    photo &&
    photo.size >
      8 * 1024 * 1024
  ) {

    showStatus(
      "❌ Das Foto darf maximal 8 MB groß sein"
    );

    return;
  }


  showStatus(
    "⏳ Spot wird erstellt..."
  );


  let photoUrl =
    null;


  // FOTO HOCHLADEN

  if (photo) {

    const extension =
      photo.name
        .split(".")
        .pop()
        .toLowerCase();


    const filePath =
      `${currentUser.id}/${Date.now()}.${extension}`;


    const {
      error
    } =
      await supabaseClient
        .storage
        .from("spot-photos")
        .upload(
          filePath,
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
          filePath
        )
        .data
        .publicUrl;

  }


  // SPOT SPEICHERN

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


  // FOTO MIT SPOT VERKNÜPFEN

  if (
    photoUrl &&
    spot
  ) {

    const {
      error:
        photoError
    } =
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


    if (photoError) {

      console.error(
        photoError
      );

    }

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


  const fields = [

    "spotName",

    "spotDescription",

    "spotPhoto"

  ];


  fields.forEach(
    (id) => {

      const element =
        document.getElementById(
          id
        );

      if (element)
        element.value = "";

    }
  );


  const location =
    document.getElementById(
      "selectedLocation"
    );


  if (location) {

    location.textContent =
      "📍 Noch kein Standort ausgewählt";

  }


  showStatus(
    "✅ Spot veröffentlicht!"
  );


  await loadSpots();

}


// ========================================
// LOAD SPOTS
// ========================================

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


// ========================================
// MARKERS
// ========================================

function renderMarkers() {

  markers.forEach(
    (marker) => {

      map.removeLayer(
        marker
      );

    }
  );


  markers = [];


  spots.forEach(
    (spot) => {

      if (
        spot.latitude === null ||
        spot.longitude === null
      ) {

        return;

      }


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


// ========================================
// RENDER SPOTS
// ========================================

async function renderSpots() {

  const container =
    document.getElementById(
      "spotList"
    );


  if (!container) return;


  const search =
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
      (spot) => {

        const text =
          `${spot.name || ""}
           ${spot.description || ""}
           ${spot.category || ""}`
            .toLowerCase();


        return text.includes(
          search
        );

      }
    );


  const count =
    document.getElementById(
      "spotCount"
    );


  if (count) {

    count.textContent =
      `${filtered.length} ${
        filtered.length === 1
          ? "Spot"
          : "Spots"
      }`;

  }


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
      spot =>
        spot.id
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


    if (result.error) {

      console.error(
        result.error
      );

    }


    profiles =
      result.data || [];

  }


  if (ids.length) {

    const photoResult =
      await supabaseClient
        .from("spot_photos")
        .select(
          "id,nickname"
        )
        .in(
          "id",
          userIds
        );


    if (result.error) {

      console.error(
        result.error
      );

    }


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
        (profile) => [

          profile.id,

          profile.nickname

        ]
      )
    );


  const photoMap = {};


  photos.forEach(
    (photo) => {

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
        (spot) => {

          const spotLikes =
            likes.filter(
              (like) =>
                like.spot_id ===
                spot.id
            );


          const liked =
            !!currentUser &&
            spotLikes.some(
              (like) =>
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
                      src="${escapeHtml(
                        image
                      )}"
                      alt="Foto von ${escapeHtml(
                        spot.name
                      )}"
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
                  <strong>
                    ${escapeHtml(
                      nickname
                    )}
                  </strong>

                </div>


                <button

                  class="like-btn ${
                    liked
                      ? "liked"
                      : ""
                  }"

                  type="button"

                  data-like-id="${escapeHtml(
                    spot.id
                  )}"

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

                        data-delete-id="${escapeHtml(
                          spot.id
                        )}"

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


  // Like-Buttons

  container
    .querySelectorAll(
      "[data-like-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            toggleLike(
              button.dataset.likeId
            );

          }
        );

      }
    );


  // Delete-Buttons

  container
    .querySelectorAll(
      "[data-delete-id]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            deleteSpot(
              button.dataset.deleteId
            );

          }
        );

      }
    );

}


// ========================================
// LIKE
// ========================================

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
      error:
        deleteError
    } =
      await supabaseClient
        .from("likes")
        .delete()
        .eq(
          "id",
          existing.id
        );


    if (deleteError) {

      showStatus(
        "❌ " +
        deleteError.message
      );

      return;
    }


    showStatus(
      "💔 Like entfernt"
    );

  } else {

    const {
      error:
        insertError
    } =
      await supabaseClient
        .from("likes")
        .insert({

          spot_id:
            spotId,

          user_id:
            currentUser.id

        });


    if (insertError) {

      showStatus(
        "❌ " +
        insertError.message
      );

      return;
    }


    showStatus(
      "❤️ Geliked"
    );

  }


  await renderSpots();

}


// ========================================
// DELETE SPOT
// ========================================

async function deleteSpot(
  spotId
) {

  if (!currentUser) {

    showStatus(
      "❌ Bitte zuerst einloggen"
    );

    return;
  }


  const spot =
    spots.find(
      (item) =>
        String(item.id) ===
        String(spotId)
    );


  if (!spot) return;


  const allowed =
    spot.user_id ===
      currentUser.id ||
    isAdmin();


  if (!allowed) {

    showStatus(
      "❌ Keine Berechtigung"
    );

    return;
  }


  const confirmed =
    confirm(
      `Spot "${spot.name}" wirklich löschen?`
    );


  if (!confirmed) return;


  showStatus(
    "⏳ Spot wird gelöscht..."
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


// ========================================
// ADMIN
// ========================================

function isAdmin() {

  return (
    currentProfile?.is_admin ===
      true ||

    currentProfile?.role ===
      "admin"
  );

}


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


  if (!spots.length) {

    container.innerHTML = `

      <div class="empty">

        Keine Spots vorhanden.

      </div>

    `;

    return;
  }


  container.innerHTML =
    spots
      .map(
        (spot) => `

          <div class="admin-user">

            <strong>

              📍
              ${escapeHtml(
                spot.name
              )}

            </strong>

            <small>

              User-ID:
              ${escapeHtml(
                spot.user_id
              )}

            </small>


            <button

              class="delete-btn"

              type="button"

              data-admin-delete="${escapeHtml(
                spot.id
              )}"

            >

              🗑️ Spot löschen

            </button>

          </div>

        `
      )
      .join("");


  container
    .querySelectorAll(
      "[data-admin-delete]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            deleteSpot(
              button.dataset.adminDelete
            );

          }
        );

      }
    );

}


// ========================================
// ESCAPE
// ========================================

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


// ========================================
// GLOBAL
// ========================================

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