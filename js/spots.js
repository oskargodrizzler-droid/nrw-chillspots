// ===============================
// SPOTS
// ===============================

let spots = [];


// ===============================
// LOAD
// ===============================

async function loadSpots() {

  console.log(
    "📍 Lade Spots..."
  );


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
      "SPOTS:",
      error
    );

    showStatus(
      "❌ Spots: " +
      error.message
    );

    return;
  }


  spots =
    data || [];


  await renderSpots();


  if (
    typeof renderMarkers === "function"
  ) {

    await renderMarkers();

  }

}



// ===============================
// RENDER
// ===============================

async function renderSpots() {

  const container =
    document.getElementById(
      "spotList"
    );


  if (!container) {
    return;
  }


  if (!spots.length) {

    container.innerHTML = `

      <div class="empty">
        Noch keine Spots 😭
      </div>

    `;

    return;
  }


  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  const ids =
    spots
      .map(
        spot => spot.user_id
      )
      .filter(Boolean);


  let profiles = [];


  if (ids.length) {

    const {
      data
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id,nickname,username"
        )
        .in(
          "id",
          ids
        );


    profiles =
      data || [];

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


  for (
    const spot of spots
  ) {

    const profile =
      profileMap.get(
        spot.user_id
      );


    const nickname =
      profile?.nickname ||
      profile?.username ||
      "Unbekannt";


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


    const card =
      document.createElement(
        "article"
      );


    card.className =
      "spot";


    const canDelete =
      user &&
      user.id === spot.user_id;


    card.innerHTML = `

      ${
        spot.photo_url
          ? `
            <img
              src="${escapeHtml(
                spot.photo_url
              )}"
              alt="Spot"
            >
          `
          : ""
      }


      <div class="spot-content">

        <h3>
          📍 ${escapeHtml(
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

          erstellt von
          <strong>
            @${escapeHtml(
              nickname
            )}
          </strong>

        </div>


        <button
          class="like-btn"
          onclick="likeSpot(
            '${spot.id}',
            this
          )"
        >

          ❤️ ${likeCount}

        </button>


        ${
          canDelete
            ? `

              <button
                class="delete-btn"
                onclick="deleteSpot(
                  '${spot.id}'
                )"
              >

                🗑️ Löschen

              </button>

            `
            : ""
        }

      </div>

    `;


    container.appendChild(
      card
    );

  }

}



// ===============================
// CREATE
// ===============================

async function createSpot() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  if (!user) {

    showStatus(
      "❌ Bitte einloggen"
    );

    return;
  }


  const name =
    document.getElementById(
      "spotName"
    ).value.trim();


  const description =
    document.getElementById(
      "spotDescription"
    ).value.trim();


  const category =
    document.getElementById(
      "spotCategory"
    ).value;


  if (!name) {

    showStatus(
      "❌ Spot braucht einen Namen"
    );

    return;
  }


  if (
    selectedLat === null ||
    selectedLng === null
  ) {

    showStatus(
      "❌ Wähle einen Standort auf der Karte"
    );

    return;
  }


  showStatus(
    "⏳ Spot wird erstellt..."
  );


  const {
    data,
    error
  } =
    await supabaseClient
      .from("spots")
      .insert({

        name,

        description:
          description || null,

        category,

        latitude:
          Number(selectedLat),

        longitude:
          Number(selectedLng),

        user_id:
          user.id

      })
      .select("*")
      .single();


  if (error) {

    console.error(
      "CREATE SPOT:",
      error
    );

    showStatus(
      "❌ " + error.message
    );

    return;
  }


  const file =
    document.getElementById(
      "spotPhoto"
    )?.files?.[0];


  if (file) {

    if (
      file.size >
      10 * 1024 * 1024
    ) {

      showStatus(
        "⚠️ Spot erstellt, Foto ist zu groß"
      );

    } else {

      const extension =
        file.name
          .split(".")
          .pop()
          .toLowerCase();


      const path =
        `${user.id}/${crypto.randomUUID()}.${extension}`;


      const {
        error: uploadError
      } =
        await supabaseClient
          .storage
          .from("spot-photos")
          .upload(
            path,
            file
          );


      if (!uploadError) {

        const {
          data: publicData
        } =
          supabaseClient
            .storage
            .from("spot-photos")
            .getPublicUrl(path);


        await supabaseClient
          .from("spot_photos")
          .insert({

            spot_id:
              data.id,

            image_url:
              publicData.publicUrl,

            user_id:
              user.id

          });

      }

    }

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


  clearSelectedLocation();

  closeSpotModal();


  showStatus(
    "✅ Spot veröffentlicht!"
  );


  await loadSpots();

}



// ===============================
// DELETE
// ===============================

async function deleteSpot(
  spotId
) {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  if (!user) {
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

    console.error(
      "DELETE:",
      error
    );

    showStatus(
      "❌ " + error.message
    );

    return;
  }


  showStatus(
    "🗑️ Spot gelöscht"
  );


  await loadSpots();

}
