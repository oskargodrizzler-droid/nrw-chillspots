// ===============================
// ADMIN.JS
// NRW CHILLSPOTS
// ===============================


// ===============================
// ADMIN PRÜFEN
// ===============================

async function checkAdmin() {

  try {

    const {
      data: {
        user
      },
      error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {
      return false;
    }


    const {
      data: profile,
      error
    } = await supabaseClient
      .from("profiles")
      .select("role,is_admin,nickname")
      .eq("id", user.id)
      .maybeSingle();


    if (error) {

      console.error(
        "Admin check:",
        error
      );

      return false;
    }


    return (
      profile?.role === "admin" ||
      profile?.is_admin === true
    );

  } catch (error) {

    console.error(
      "Admin check crash:",
      error
    );

    return false;
  }
}



// ===============================
// ADMIN SEITE LADEN
// ===============================

async function loadAdminPage() {

  const allowed =
    await checkAdmin();


  if (!allowed) {

    showStatus(
      "❌ Du bist kein Admin"
    );


    setTimeout(() => {

      window.location.href =
        "../index.html";

    }, 1500);


    return;
  }


  console.log(
    "🛡️ Admin-Zugriff erlaubt"
  );


  await loadAdminStats();

  await loadAdminUsers();

  await loadAdminSpots();
}



// ===============================
// STATISTIKEN
// ===============================

async function loadAdminStats() {

  const stats =
    document.getElementById(
      "stats"
    );


  if (!stats) {
    return;
  }


  // SPOTS

  const {
    count: spotCount,
    error: spotError
  } =
    await supabaseClient
      .from("spots")
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      );


  if (spotError) {

    console.error(
      "Spot stats:",
      spotError
    );
  }


  // USERS

  const {
    count: userCount,
    error: userError
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      );


  if (userError) {

    console.error(
      "User stats:",
      userError
    );
  }


  // ADMINS

  const {
    count: adminCount,
    error: adminError
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      )
      .or(
        "role.eq.admin,is_admin.eq.true"
      );


  if (adminError) {

    console.error(
      "Admin stats:",
      adminError
    );
  }


  stats.innerHTML = `

    <div class="admin-stat">

      <strong>
        ${userCount ?? 0}
      </strong>

      <span>
        👥 User
      </span>

    </div>


    <div class="admin-stat">

      <strong>
        ${spotCount ?? 0}
      </strong>

      <span>
        📍 Spots
      </span>

    </div>


    <div class="admin-stat">

      <strong>
        ${adminCount ?? 0}
      </strong>

      <span>
        🛡️ Admins
      </span>

    </div>

  `;
}



// ===============================
// USER LADEN
// ===============================

async function loadAdminUsers() {

  const container =
    document.getElementById(
      "users"
    );


  if (!container) {
    return;
  }


  const {
    data: users,
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

    console.error(
      "Users:",
      error
    );


    container.innerHTML = `

      <div class="empty">

        ❌ Benutzer konnten nicht
        geladen werden

      </div>

    `;

    return;
  }


  if (!users?.length) {

    container.innerHTML = `

      <div class="empty">

        Keine Benutzer gefunden 😭

      </div>

    `;

    return;
  }


  container.innerHTML = "";


  for (const user of users) {

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


      <div class="admin-user-actions">

        ${
          isAdmin

            ? `

              <button
                class="secondary"
                onclick="changeAdmin(
                  '${escapeHtml(
                    String(user.id)
                  )}',
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
                  '${escapeHtml(
                    String(user.id)
                  )}',
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
// ADMIN RECHTE ÄNDERN
// ===============================

async function changeAdmin(
  userId,
  makeAdmin
) {

  const allowed =
    await checkAdmin();


  if (!allowed) {

    showStatus(
      "❌ Keine Berechtigung"
    );

    return;
  }


  const text =
    makeAdmin
      ? "Diesen User wirklich zum Admin machen?"
      : "Adminrechte wirklich entfernen?";


  if (!confirm(text)) {
    return;
  }


  showStatus(
    "⏳ Rechte werden geändert..."
  );


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

    console.error(
      "SET ADMIN:",
      error
    );


    showStatus(
      "❌ " +
      error.message
    );

    return;
  }


  if (!data) {

    showStatus(
      "❌ Benutzer wurde nicht gefunden"
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


  if (!container) {
    return;
  }


  const {
    data: spotsData,
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
      "Admin spots:",
      error
    );


    container.innerHTML = `

      <div class="empty">

        ❌ Spots konnten nicht
        geladen werden

      </div>

    `;

    return;
  }


  if (!spotsData?.length) {

    container.innerHTML = `

      <div class="empty">

        Noch keine Spots 😭

      </div>

    `;

    return;
  }


  // USER IDs

  const userIds =
    spotsData
      .map(
        spot => spot.user_id
      )
      .filter(Boolean);


  let profiles = [];


  if (userIds.length) {

    const {
      data,
      error: profileError
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id,nickname,username"
        )
        .in(
          "id",
          userIds
        );


    if (!profileError) {

      profiles =
        data || [];

    }
  }


  const profileMap =
    new Map(
      profiles.map(
        profile => [
          profile.id,
          profile
        ]
      )
    );


  container.innerHTML = "";


  // SPOTS

  for (
    const spot of spotsData
  ) {

    const profile =
      profileMap.get(
        spot.user_id
      );


    const nickname =
      profile?.nickname ||
      profile?.username ||
      "Unbekannt";


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


        <span>

          🏷️ ${escapeHtml(
            spot.category ||
            "Sonstiges"
          )}

        </span>


        <p>

          👤 erstellt von
          <strong>
            @${escapeHtml(
              nickname
            )}
          </strong>

        </p>


        <p class="admin-location">

          📍 ${Number(
            spot.latitude
          ).toFixed(5)},
          ${Number(
            spot.longitude
          ).toFixed(5)}

        </p>

      </div>


      <button
        class="delete-btn"
        onclick="adminDeleteSpot(
          '${escapeHtml(
            String(spot.id)
          )}'
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
// ADMIN SPOT LÖSCHEN
// ===============================

async function adminDeleteSpot(
  spotId
) {

  const allowed =
    await checkAdmin();


  if (!allowed) {

    showStatus(
      "❌ Keine Berechtigung"
    );

    return;
  }


  if (
    !confirm(
      "Diesen Spot wirklich endgültig löschen?"
    )
  ) {

    return;
  }


  showStatus(
    "⏳ Spot wird gelöscht..."
  );


  // FOTO-REFERENZEN LÖSCHEN

  const {
    error: photoError
  } =
    await supabaseClient
      .from("spot_photos")
      .delete()
      .eq(
        "spot_id",
        spotId
      );


  if (photoError) {

    console.warn(
      "Foto-Referenzen:",
      photoError
    );
  }


  // LIKES LÖSCHEN

  const {
    error: likeError
  } =
    await supabaseClient
      .from("likes")
      .delete()
      .eq(
        "spot_id",
        spotId
      );


  if (likeError) {

    console.warn(
      "Likes:",
      likeError
    );
  }


  // SPOT LÖSCHEN

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
      "ADMIN DELETE:",
      error
    );


    showStatus(
      "❌ " +
      error.message
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
// ESCAPE HTML
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