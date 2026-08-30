// ===============================
// ADMIN
// ===============================

async function checkAdmin() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  if (!user) {
    return false;
  }


  const {
    data: profile,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "role,is_admin"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "ADMIN CHECK:",
      error
    );

    return false;
  }


  return (
    profile?.role === "admin" ||
    profile?.is_admin === true
  );

}



// ===============================
// ADMIN PAGE
// ===============================

async function loadAdminPage() {

  const allowed =
    await checkAdmin();


  if (!allowed) {

    window.location.replace(
      "../index.html"
    );

    return;
  }


  const loading =
    document.getElementById(
      "adminLoading"
    );


  const panel =
    document.getElementById(
      "adminPanel"
    );


  if (loading)
    loading.style.display =
      "none";


  if (panel)
    panel.style.display =
      "block";


  await loadAdminStats();

  await loadAdminUsers();

  await loadAdminSpots();

}



// ===============================
// STATS
// ===============================

async function loadAdminStats() {

  const stats =
    document.getElementById(
      "stats"
    );


  if (!stats) return;


  const spots =
    await supabaseClient
      .from("spots")
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      );


  const users =
    await supabaseClient
      .from("profiles")
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      );


  const admins =
    await supabaseClient
      .from("profiles")
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "role",
        "admin"
      );


  stats.innerHTML = `

    <div class="admin-stat">

      <strong>
        ${users.count ?? 0}
      </strong>

      <span>
        👥 User
      </span>

    </div>


    <div class="admin-stat">

      <strong>
        ${spots.count ?? 0}
      </strong>

      <span>
        📍 Spots
      </span>

    </div>


    <div class="admin-stat">

      <strong>
        ${admins.count ?? 0}
      </strong>

      <span>
        🛡️ Admins
      </span>

    </div>

  `;

}



// ===============================
// USERS
// ===============================

async function loadAdminUsers() {

  const container =
    document.getElementById(
      "users"
    );


  if (!container) return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id,nickname,username,role,is_admin,created_at"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    container.innerHTML =
      `<div class="empty">
        ❌ ${escapeHtml(error.message)}
      </div>`;

    return;
  }


  container.innerHTML = "";


  for (
    const user of data || []
  ) {

    const isAdmin =
      user.role === "admin" ||
      user.is_admin === true;


    const div =
      document.createElement(
        "div"
      );


    div.className =
      "admin-user";


    div.innerHTML = `

      <div class="admin-user-info">

        <strong>
          👤 @${escapeHtml(
            user.nickname ||
            user.username ||
            "Kein Nickname"
          )}
        </strong>

        <span>
          ${
            isAdmin
              ? "🛡️ Admin"
              : "👤 User"
          }
        </span>

      </div>


      <div>

        ${
          isAdmin
            ? `

              <button
                class="secondary"
                onclick="changeAdmin(
                  '${user.id}',
                  false
                )"
              >
                ⬇️ Admin entfernen
              </button>

            `
            : `

              <button
                class="primary"
                onclick="changeAdmin(
                  '${user.id}',
                  true
                )"
              >
                🛡️ Admin machen
              </button>

            `
        }

      </div>

    `;


    container.appendChild(
      div
    );

  }

}



// ===============================
// ADMIN RECHTE
// ===============================

async function changeAdmin(
  userId,
  makeAdmin
) {

  if (
    !(await checkAdmin())
  ) {

    showStatus(
      "❌ Keine Berechtigung"
    );

    return;
  }


  if (
    !confirm(
      makeAdmin
        ? "User zum Admin machen?"
        : "Adminrechte entfernen?"
    )
  ) {
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .rpc(
        "set_admin",
        {
          target_user:
            userId,

          make_admin:
            makeAdmin
        }
      );


  if (error) {

    showStatus(
      "❌ " + error.message
    );

    return;
  }


  if (!data) {

    showStatus(
      "❌ User nicht gefunden"
    );

    return;
  }


  showStatus(
    makeAdmin
      ? "🛡️ Admin hinzugefügt"
      : "⬇️ Admin entfernt"
  );


  await loadAdminStats();

  await loadAdminUsers();

}



// ===============================
// ADMIN SPOTS
// ===============================

async function loadAdminSpots() {

  const container =
    document.getElementById(
      "adminSpots"
    );


  if (!container) return;


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

    container.innerHTML =
      `<div class="empty">
        ❌ ${escapeHtml(error.message)}
      </div>`;

    return;
  }


  container.innerHTML = "";


  for (
    const spot of data || []
  ) {

    const div =
      document.createElement(
        "div"
      );


    div.className =
      "admin-spot";


    div.innerHTML = `

      <div>

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

      </div>


      <button
        class="delete-btn"
        onclick="adminDeleteSpot(
          '${spot.id}'
        )"
      >

        🗑️ Löschen

      </button>

    `;


    container.appendChild(
      div
    );

  }

}



// ===============================
// DELETE SPOT
// ===============================

async function adminDeleteSpot(
  spotId
) {

  if (
    !(await checkAdmin())
  ) {

    showStatus(
      "❌ Keine Berechtigung"
    );

    return;
  }


  if (
    !confirm(
      "Spot wirklich löschen?"
    )
  ) {
    return;
  }


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
      "❌ " + error.message
    );

    return;
  }


  showStatus(
    "🗑️ Spot gelöscht"
  );


  await loadAdminStats();

  await loadAdminSpots();

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
