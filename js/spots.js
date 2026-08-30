// ===============================
// SPOTS
// ===============================

let spots = [];


// ===============================
// SPOT ERSTELLEN
// ===============================

async function createSpot() {

  try {

    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error(userError);
      showStatus("❌ Account konnte nicht geprüft werden");
      return;
    }

    if (!user) {
      showStatus("❌ Bitte zuerst einloggen");
      openAuthModal();
      return;
    }


    const name =
      document.getElementById("spotName").value.trim();

    const description =
      document.getElementById("spotDescription").value.trim();

    const category =
      document.getElementById("spotCategory").value;

    const photoInput =
      document.getElementById("spotPhoto");

    const photoFile =
      photoInput?.files?.[0] || null;


    if (!name) {
      showStatus("❌ Gib einen Namen ein");
      return;
    }

    if (
      typeof selectedLat === "undefined" ||
      typeof selectedLng === "undefined" ||
      selectedLat === null ||
      selectedLng === null
    ) {
      showStatus("❌ Wähle zuerst einen Standort auf der Karte");
      return;
    }


    showStatus("⏳ Spot wird erstellt...");


    let photoUrl = null;


    // ===============================
    // FOTO
    // ===============================

    if (photoFile) {

      if (photoFile.size > 10 * 1024 * 1024) {
        showStatus("❌ Foto darf maximal 10 MB groß sein");
        return;
      }


      const extension =
        photoFile.name.split(".").pop().toLowerCase();

      const fileName =
        `${user.id}/${crypto.randomUUID()}.${extension}`;


      const {
        error: uploadError
      } = await supabaseClient
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

        console.error(
          "Foto Upload Fehler:",
          uploadError
        );

        showStatus(
          "❌ Foto konnte nicht hochgeladen werden"
        );

        return;
      }


      const {
        data: publicData
      } = supabaseClient
        .storage
        .from("spot-photos")
        .getPublicUrl(fileName);


      photoUrl =
        publicData?.publicUrl || null;
    }


    // ===============================
    // SPOT
    // ===============================

    const spotData = {

      name: name,

      description:
        description || null,

      category:
        category || "Sonstiges",

      latitude:
        Number(selectedLat),

      longitude:
        Number(selectedLng),

      user_id:
        user.id

    };


    // Nur photo_url mitsenden,
    // wenn die Spalte existiert und wir sie benutzen wollen.
    //
    // Der eigentliche Spot wird zuerst erstellt.

    const {
      data: newSpot,
      error: spotError
    } = await supabaseClient
      .from("spots")
      .insert(spotData)
      .select("*")
      .single();


    if (spotError) {

      console.error(
        "SPOT DATABASE ERROR:",
        spotError
      );

      showStatus(
        "❌ Spot: " +
        (spotError.message || "Unbekannter Fehler")
      );

      return;
    }


    // ===============================
    // FOTO MIT SPOT VERKNÜPFEN
    // ===============================

    if (photoUrl && newSpot) {

      const {
        error: photoError
      } = await supabaseClient
        .from("spot_photos")
        .insert({

          spot_id:
            newSpot.id,

          image_url:
            photoUrl,

          user_id:
            user.id

        });


      if (photoError) {

        console.error(
          "PHOTO DATABASE ERROR:",
          photoError
        );

        // Spot bleibt trotzdem erhalten.
        showStatus(
          "⚠️ Spot erstellt, Foto konnte nicht gespeichert werden"
        );

      }
    }


    // ===============================
    // FORMULAR ZURÜCKSETZEN
    // ===============================

    document.getElementById("spotName").value = "";

    document.getElementById(
      "spotDescription"
    ).value = "";

    document.getElementById(
      "spotPhoto"
    ).value = "";


    closeSpotModal();

    clearSelectedLocation?.();


    showStatus(
      "✅ Spot veröffentlicht!"
    );


    await loadSpots();

  } catch (error) {

    console.error(
      "CREATE SPOT CRASH:",
      error
    );

    showStatus(
      "❌ Fehler beim Erstellen"
    );
  }
}



// ===============================
// SPOTS LADEN
// ===============================

async function loadSpots() {

  console.log("📍 Lade Spots...");


  try {

    const {
      data,
      error
    } = await supabaseClient
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
        "SUPABASE SPOTS ERROR:",
        error
      );

      showStatus(
        "❌ Spots: " +
        error.message
      );

      return;
    }


    console.log(
      "✅ Spots geladen:",
      data
    );


    spots =
      Array.isArray(data)
        ? data
        : [];


    renderSpots();


    if (
      typeof renderMarkers === "function"
    ) {
      renderMarkers();
    }


  } catch (error) {

    console.error(
      "LOAD SPOTS CRASH:",
      error
    );

    showStatus(
      "❌ Fehler beim Laden der Spots"
    );
  }
}



// ===============================
// SPOTS ANZEIGEN
// ===============================

async function renderSpots() {

  const container =
    document.getElementById("spotList");


  if (!container) {
    console.error(
      "spotList nicht gefunden"
    );
    return;
  }


  if (!spots.length) {

    container.innerHTML = `
      <div class="empty">
        Noch keine Spots 😭<br>
        Sei der Erste!
      </div>
    `;

    return;
  }


  container.innerHTML = `
    <div class="empty">
      ⏳ Spots werden geladen...
    </div>
  `;


  // ===============================
  // PROFILE LADEN
  // ===============================

  const userIds =
    spots
      .map(spot => spot.user_id)
      .filter(Boolean);


  let profiles = [];


  if (userIds.length) {

    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .select(
        "id,nickname,username"
      )
      .in(
        "id",
        userIds
      );


    if (error) {

      console.warn(
        "Profile konnten nicht geladen werden:",
        error
      );

    } else {

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


  // ===============================
  // USER
  // ===============================

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  container.innerHTML = "";


  // ===============================
  // SPOTS
  // ===============================

  for (const spot of spots) {

    const profile =
      profileMap.get(
        spot.user_id
      );


    const nickname =
      profile?.nickname ||
      profile?.username ||
      "Unbekannt";


    // ===============================
    // FOTO
    // ===============================

    let imageUrl =
      spot.photo_url ||
      null;


    if (!imageUrl) {

      const {
        data: photos,
        error
      } = await supabaseClient
        .from("spot_photos")
        .select(
          "image_url"
        )
        .eq(
          "spot_id",
          spot.id
        )
        .limit(1);


      if (!error && photos?.length) {

        imageUrl =
          photos[0].image_url;

      }
    }


    // ===============================
    // HTML
    // ===============================

    const div =
      document.createElement(
        "article"
      );


    div.className =
      "spot";


    const canDelete =
      user &&
      user.id === spot.user_id;


    div.innerHTML = `

      ${
        imageUrl
          ? `
            <img
              src="${escapeHtml(imageUrl)}"
              alt="Foto von ${escapeHtml(spot.name)}"
              loading="lazy"
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
            '${escapeHtml(
              String(spot.id)
            )}',
            this
          )"
        >
          ❤️ Like
        </button>


        ${
          canDelete
            ? `
              <button
                class="delete-btn"
                onclick="deleteSpot(
                  '${escapeHtml(
                    String(spot.id)
                  )}'
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
      div
    );
  }
}



// ===============================
// SPOT LÖSCHEN
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

    showStatus(
      "❌ Bitte einloggen"
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
      "DELETE ERROR:",
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


  await loadSpots();
}