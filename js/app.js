// ======================================================
// NRW CHILLSPOTS - APP.JS
// Zentrale Konfiguration + gemeinsame Funktionen
// ======================================================


// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL =
  "https://ayukjqhmmgqbgtiusvsx.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_oN4MVoqoeGLRPtEEgIpalQ_H_GZk1u0";


// Supabase Client erstellen
const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ======================================================
// STATUS-NACHRICHT
// ======================================================

let statusTimeout = null;


function showStatus(message) {

  const status =
    document.getElementById("status");


  if (!status) {

    console.log(message);

    return;
  }


  status.textContent =
    message;


  status.style.display =
    "block";


  if (statusTimeout) {

    clearTimeout(
      statusTimeout
    );

  }


  statusTimeout =
    setTimeout(
      function() {

        status.style.display =
          "none";

      },
      3500
    );
}


// ======================================================
// HTML SICHER MACHEN
// ======================================================

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


// ======================================================
// AUTH MODAL
// ======================================================

function openAuthModal() {

  const modal =
    document.getElementById(
      "authModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.add(
    "show"
  );


  if (
    typeof updateAccountUI ===
    "function"
  ) {

    updateAccountUI();

  }
}


function closeAuthModal() {

  const modal =
    document.getElementById(
      "authModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "show"
  );
}


// ======================================================
// SPOT MODAL
// ======================================================

function openSpotModal() {

  // User muss eingeloggt sein
  if (
    typeof Auth !== "undefined"
  ) {

    Auth.getUser().then(
      function(user) {

        if (!user) {

          showStatus(
            "❌ Bitte zuerst einloggen"
          );

          openAuthModal();

          return;
        }


        const modal =
          document.getElementById(
            "spotModal"
          );


        if (modal) {

          modal.classList.add(
            "show"
          );

        }


        if (
          typeof refreshMap ===
          "function"
        ) {

          refreshMap();

        }

      }
    );

    return;
  }


  // Fallback
  const modal =
    document.getElementById(
      "spotModal"
    );


  if (modal) {

    modal.classList.add(
      "show"
    );

  }
}


function closeSpotModal() {

  const modal =
    document.getElementById(
      "spotModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "show"
  );


  // Standort zurücksetzen
  if (
    typeof clearSelectedLocation ===
    "function"
  ) {

    clearSelectedLocation();

  }
}


// ======================================================
// MODALS DURCH KLICK AUSSEN SCHLIESSEN
// ======================================================

document.addEventListener(
  "click",
  function(event) {

    const authModal =
      document.getElementById(
        "authModal"
      );

    const spotModal =
      document.getElementById(
        "spotModal"
      );


    if (
      authModal &&
      event.target === authModal
    ) {

      closeAuthModal();

    }


    if (
      spotModal &&
      event.target === spotModal
    ) {

      closeSpotModal();

    }

  }
);


// ======================================================
// ESC-TASTE SCHLIESST MODALS
// ======================================================

document.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key !==
      "Escape"
    ) {

      return;
    }


    closeAuthModal();
    closeSpotModal();

  }
);


// ======================================================
// SUCHE
// ======================================================

function filterSpots() {

  const input =
    document.getElementById(
      "search"
    );


  if (!input) {
    return;
  }


  const query =
    input.value
      .toLowerCase()
      .trim();


  const elements =
    document.querySelectorAll(
      ".spot"
    );


  elements.forEach(
    function(element) {

      const text =
        element.textContent
          .toLowerCase();


      element.style.display =
        text.includes(query)
          ? ""
          : "none";

    }
  );
}


// ======================================================
// ESCAPE FÜR SUCHFUNKTION
// ======================================================

function clearSearch() {

  const input =
    document.getElementById(
      "search"
    );


  if (!input) {
    return;
  }


  input.value = "";


  filterSpots();
}


// ======================================================
// AUTH STATUS
// ======================================================

async function checkAuth() {

  try {

    const {
      data: {
        session
      }
    } =
      await supabaseClient.auth.getSession();


    return session || null;

  } catch (error) {

    console.error(
      "Session:",
      error
    );

    return null;
  }
}


// ======================================================
// SEITE STARTEN
// ======================================================

async function startApp() {

  console.log(
    "🚀 NRW Chillspots startet..."
  );


  // Auth laden
  if (
    typeof updateAccountUI ===
    "function"
  ) {

    await updateAccountUI();

  }


  // Karte laden
  if (
    typeof initMap ===
    "function"
  ) {

    initMap();

  }


  // Spots laden
  if (
    typeof loadSpots ===
    "function"
  ) {

    await loadSpots();

  }


  // Admin UI
  if (
    typeof updateAdminUI ===
    "function"
  ) {

    await updateAdminUI();

  }


  console.log(
    "✅ NRW Chillspots bereit"
  );
}


// ======================================================
// AUTH ÄNDERUNGEN
// ======================================================

supabaseClient.auth.onAuthStateChange(
  function(event, session) {

    console.log(
      "Auth:",
      event
    );


    // UI aktualisieren
    setTimeout(
      async function() {

        if (
          typeof updateAccountUI ===
          "function"
        ) {

          await updateAccountUI();

        }


        if (
          typeof updateAdminUI ===
          "function"
        ) {

          await updateAdminUI();

        }


        if (
          typeof loadSpots ===
          "function"
        ) {

          await loadSpots();

        }

      },
      0
    );

  }
);


// ======================================================
// START
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    // Andere JS-Dateien müssen
    // zuerst geladen werden.
    setTimeout(
      function() {

        startApp();

      },
      200
    );

  }
);