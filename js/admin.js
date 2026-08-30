// ======================================================
// NRW CHILLSPOTS - ADMIN.JS
// Admin-System + Admin-Dashboard
// ======================================================

const Admin = {

  // ----------------------------------------------------
  // AKTUELLER USER IST ADMIN?
  // ----------------------------------------------------
  async isAdmin() {

    const user = await Auth.getUser();

    if (!user) {
      return false;
    }

    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Admin-Prüfung:", error);
      return false;
    }

    return data?.is_admin === true;
  },


  // ----------------------------------------------------
  // ADMIN UI AKTUALISIEREN
  // ----------------------------------------------------
  async updateUI() {

    const admin = await this.isAdmin();

    const adminButtons =
      document.querySelectorAll(".admin-only");

    adminButtons.forEach(button => {

      button.style.display =
        admin ? "" : "none";

    });

    return admin;
  },


  // ----------------------------------------------------
  // ADMIN-DASHBOARD ÖFFNEN
  // ----------------------------------------------------
  async openDashboard() {

    const admin = await this.isAdmin();

    if (!admin) {

      showStatus(
        "❌ Keine Admin-Berechtigung"
      );

      return;
    }

    window.location.href =
      "pages/admin.html";
  },


  // ----------------------------------------------------
  // ALLE USER LADEN
  // ----------------------------------------------------
  async getUsers() {

    const admin = await this.isAdmin();

    if (!admin) {
      return [];
    }

    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .select(
        "id, nickname, is_admin, created_at"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (error) {

      console.error(
        "Benutzer laden:",
        error
      );

      showStatus(
        "❌ Benutzer konnten nicht geladen werden"
      );

      return [];
    }

    return data || [];
  },


  // ----------------------------------------------------
  // ADMIN-STATUS ÄNDERN
  // ----------------------------------------------------
  async setAdmin(
    userId,
    makeAdmin
  ) {

    const currentUser =
      await Auth.getUser();

    if (!currentUser) {

      showStatus(
        "❌ Du musst eingeloggt sein"
      );

      return false;
    }


    const admin =
      await this.isAdmin();

    if (!admin) {

      showStatus(
        "❌ Keine Admin-Berechtigung"
      );

      return false;
    }


    if (!userId) {
      return false;
    }


    // Sich selbst nicht versehentlich entfernen
    if (
      String(userId) ===
      String(currentUser.id) &&
      !makeAdmin
    ) {

      const confirmed =
        confirm(
          "Willst du dir wirklich selbst die Admin-Rechte entziehen?"
        );

      if (!confirmed) {
        return false;
      }
    }


    const {
      error
    } = await supabaseClient
      .from("profiles")
      .update({
        is_admin: Boolean(makeAdmin)
      })
      .eq(
        "id",
        userId
      );


    if (error) {

      console.error(
        "Admin-Rechte:",
        error
      );

      showStatus(
        "❌ " + error.message
      );

      return false;
    }


    showStatus(
      makeAdmin
        ? "🛡️ Admin-Rechte vergeben"
        : "🔒 Admin-Rechte entfernt"
    );


    // Dashboard neu laden
    if (
      typeof loadAdminDashboard ===
      "function"
    ) {

      await loadAdminDashboard();

    }


    return true;
  },


  // ----------------------------------------------------
  // SPOT VON ADMIN LÖSCHEN
  // ----------------------------------------------------
  async deleteSpot(
    spotId
  ) {

    const admin =
      await this.isAdmin();

    if (!admin) {

      showStatus(
        "❌ Keine Admin-Berechtigung"
      );

      return false;
    }


    if (!spotId) {
      return false;
    }


    const confirmed =
      confirm(
        "Diesen Spot als Admin wirklich löschen?"
      );


    if (!confirmed) {
      return false;
    }


    showStatus(
      "⏳ Spot wird gelöscht..."
    );


    // Fotos löschen
    const {
      error: photosError
    } =
      await supabaseClient
        .from("spot_photos")
        .delete()
        .eq(
          "spot_id",
          spotId
        );


    if (photosError) {

      console.warn(
        "Spot-Fotos:",
        photosError
      );

    }


    // Likes löschen
    const {
      error: likesError
    } =
      await supabaseClient
        .from("likes")
        .delete()
        .eq(
          "spot_id",
          spotId
        );


    if (likesError) {

      console.warn(
        "Likes:",
        likesError
      );

    }


    // Spot löschen
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

      console.error(
        "Spot löschen:",
        error
      );

      showStatus(
        "❌ " + error.message
      );

      return false;
    }


    showStatus(
      "🗑️ Spot gelöscht"
    );


    if (
      typeof loadAdminDashboard ===
      "function"
    ) {

      await loadAdminDashboard();

    }


    if (
      typeof loadSpots ===
      "function"
    ) {

      await loadSpots();

    }


    return true;
  }
};


// ======================================================
// KOMPATIBILITÄT
// ======================================================

async function isAdmin() {
  return await Admin.isAdmin();
}


async function updateAdminUI() {
  return await Admin.updateUI();
}


async function openAdminDashboard() {
  return await Admin.openDashboard();
}


// ======================================================
// ADMIN DASHBOARD LADEN
// ======================================================

async function loadAdminDashboard() {

  const container =
    document.getElementById(
      "adminContent"
    );

  if (!container) {
    return;
  }


  const admin =
    await Admin.isAdmin();


  if (!admin) {

    container.innerHTML = `
      <div class="admin-error">
        ❌ Du hast keine Admin-Berechtigung.
      </div>
    `;

    return;
  }


  container.innerHTML = `
    <div class="admin-loading">
      ⏳ Dashboard wird geladen...
    </div>
  `;


  // ====================================================
  // USER LADEN
  // ====================================================

  const users =
    await Admin.getUsers();


  // ====================================================
  // SPOTS LADEN
  // ====================================================

  const {
    data: adminSpots,
    error
  } =
    await supabaseClient
      .from("spots")
      .select(`
        *,
        profiles (
          nickname
        )
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Admin-Spots:",
      error
    );

    container.innerHTML = `
      <div class="admin-error">
        ❌ Spots konnten nicht geladen werden
      </div>
    `;

    return;
  }


  // ====================================================
  // DASHBOARD
  // ====================================================

  container.innerHTML = `

    <section class="admin-section">

      <h2>📊 Übersicht</h2>

      <div class="admin-stats">

        <div class="admin-stat">
          <strong>${users.length}</strong>
          <span>Benutzer</span>
        </div>

        <div class="admin-stat">
          <strong>${adminSpots?.length || 0}</strong>
          <span>Spots</span>
        </div>

        <div class="admin-stat">
          <strong>
            ${
              users.filter(
                user =>
                  user.is_admin === true
              ).length
            }
          </strong>
          <span>Admins</span>
        </div>

      </div>

    </section>


    <section class="admin-section">

      <h2>👥 Benutzer</h2>

      <div id="adminUsers"></div>

    </section>


    <section class="admin-section">

      <h2>📍 Spots</h2>

      <div id="adminSpots"></div>

    </section>
  `;


  // ====================================================
  // USER LISTE
  // ====================================================

  const usersContainer =
    document.getElementById(
      "adminUsers"
    );


  if (!users.length) {

    usersContainer.innerHTML =
      "<p>Keine Benutzer gefunden.</p>";

  } else {

    usersContainer.innerHTML =
      users.map(
        user => {

          const nickname =
            escapeHtml(
              user.nickname ||
              "Kein Nickname"
            );


          const adminText =
            user.is_admin
              ? "🛡️ Admin"
              : "👤 User";


          const buttonText =
            user.is_admin
              ? "Admin entfernen"
              : "Zum Admin machen";


          return `

            <div class="admin-user">

              <div>

                <strong>
                  @${nickname}
                </strong>

                <div class="admin-user-role">
                  ${adminText}
                </div>

              </div>

              <button
                class="admin-action-btn"
                onclick="
                  Admin.setAdmin(
                    '${user.id}',
                    ${!user.is_admin}
                  )
                "
              >
                ${buttonText}
              </button>

            </div>

          `;

        }
      ).join("");
  }


  // ====================================================
  // SPOT LISTE
  // ====================================================

  const spotsContainer =
    document.getElementById(
      "adminSpots"
    );


  if (
    !adminSpots ||
    !adminSpots.length
  ) {

    spotsContainer.innerHTML =
      "<p>Keine Spots vorhanden.</p>";

  } else {

    spotsContainer.innerHTML =
      adminSpots.map(
        spot => {

          const name =
            escapeHtml(
              spot.name ||
              "Unbenannter Spot"
            );


          const nickname =
            escapeHtml(
              spot.profiles?.nickname ||
              "Unbekannt"
            );


          const category =
            escapeHtml(
              spot.category ||
              "Sonstiges"
            );


          return `

            <div class="admin-spot">

              <div>

                <strong>
                  📍 ${name}
                </strong>

                <div class="admin-spot-info">
                  Kategorie: ${category}
                </div>

                <div class="admin-spot-info">
                  Erstellt von:
                  <strong>
                    @${nickname}
                  </strong>
                </div>

              </div>

              <button
                class="admin-delete-btn"
                onclick="
                  Admin.deleteSpot(
                    '${spot.id}'
                  )
                "
              >
                🗑️ Löschen
              </button>

            </div>

          `;

        }
      ).join("");
  }
}


// ======================================================
// START
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    await updateAdminUI();

    // Nur auf admin.html
    if (
      document.getElementById(
        "adminContent"
      )
    ) {

      await loadAdminDashboard();

    }

  }
);