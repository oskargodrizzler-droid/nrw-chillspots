// ===============================
// SUPABASE
// ===============================

const SUPABASE_URL =
  "https://ayukjqhmmgqbgtiusvsx.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_oN4MVoqoeGLRPtEEgIpalQ_H_GZk1u0";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


// ===============================
// STATUS
// ===============================

function showStatus(message) {

  const status =
    document.getElementById("status");

  if (!status) return;

  status.textContent = message;
  status.style.display = "block";

  clearTimeout(
    window.statusTimer
  );

  window.statusTimer =
    setTimeout(() => {

      status.style.display =
        "none";

    }, 3500);
}


// ===============================
// MODALS
// ===============================

function openAuthModal() {

  const modal =
    document.getElementById("authModal");

  if (modal) {
    modal.style.display = "flex";
  }
}


function closeAuthModal() {

  const modal =
    document.getElementById("authModal");

  if (modal) {
    modal.style.display = "none";
  }
}


function openSpotModal() {

  supabaseClient.auth.getUser()
    .then(({ data }) => {

      if (!data.user) {

        showStatus(
          "❌ Bitte zuerst einloggen"
        );

        openAuthModal();

        return;
      }

      const modal =
        document.getElementById("spotModal");

      if (modal) {
        modal.style.display = "flex";
      }

    });

}


function closeSpotModal() {

  const modal =
    document.getElementById("spotModal");

  if (modal) {
    modal.style.display = "none";
  }
}


function openProfile() {

  window.location.href =
    "pages/profile.html";

}


// ===============================
// START
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    if (
      typeof initMap === "function"
    ) {
      initMap();
    }

    if (
      typeof loadSpots === "function"
    ) {
      await loadSpots();
    }

    if (
      typeof updateAuthUI === "function"
    ) {
      await updateAuthUI();
    }

  }
);
