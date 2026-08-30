// ======================================================
// NRW CHILLSPOTS - SPOTS.JS
// Spots erstellen, laden, Fotos und löschen
// ======================================================

let spots = [];


// ======================================================
// ALLE SPOTS LADEN
// ======================================================

async function loadSpots() {

  const {
    data,
    error
  } = await supabaseClient
    .from("spots")
    .select(`
      *,
      profiles (
        nickname
      )
    `)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Spots laden:", error);
    showStatus("❌ Spots konnten nicht geladen werden");
    return;
  }

  spots = data || [];

  console.log("Spots geladen:", spots);

  // Karte aktualisieren
  if (typeof renderMarkers === "function") {
    renderMarkers();
  }

  // Liste aktualisieren
  await renderSpots();
}


// ======================================================
// SPOT ERSTELLEN
// ======================================================

async function createSpot() {

  const user =
    await Auth.getUser();

  if (!user) {
    showStatus(
      "❌ Du musst zuerst eingeloggt sein"
    );
    return;
  }


  const name =
    document
      .getElementById("spotName")
      ?.value
      .trim();


  const description =
    document
      .getElementById("spotDescription")
      ?.value
      .trim();


  const category =
    document
      .getElementById("spotCategory")
      ?.value;


  const photoInput =
    document.getElementById("spotPhoto");


  const photoFile =
    photoInput?.files?.[0];


  // Standort
  if (
    typeof selectedLat === "undefined" ||
    typeof selectedLng === "undefined" ||
    selectedLat === null ||
    selectedLng === null
  ) {

    showStatus(
      "❌ Wähle zuerst einen Standort auf der Karte"
    );

    return;
  }


  if (!name) {

    showStatus(
      "❌ Gib deinem Spot einen Namen"
    );

    return;
  }


  showStatus(
    "⏳ Spot wird erstellt..."
  );


  // ====================================================
  // SPOT IN DATENBANK ERSTELLEN
  // ====================================================

  const {
    data: newSpot,
    error
  } =
    await supabaseClient
      .from("spots")
      .insert({

        name: name,

        description:
          description || null,

        category:
          category || "Sonstiges",

        latitude:
          selectedLat,

        longitude:
          selectedLng,

        user_id:
          user.id

      })
      .select()
      .single();


  if (error) {

    console.error(
      "Spot erstellen:",
      error
    );

    showStatus(
      "❌ " + error.message
    );

    return;
  }


  // ====================================================
  // FOTO HOCHLADEN
  // ====================================================

  if (photoFile) {

    const extension =
      photoFile.name
        .split(".")
        .pop()
        .toLowerCase();


    const fileName =
      `${user.id}/${crypto.randomUUID()}.${extension}`;


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

      console.error(
        "Foto Upload:",
        uploadError
      );

      showStatus(
        "⚠️ Spot erstellt, aber Foto konnte nicht hochgeladen werden"
      );

    } else {

      const {
        data: publicData
      } =
        supabaseClient
          .storage
          .from("spot-photos")
          .getPublicUrl(
            fileName
          );


      const imageUrl =
        publicData.publicUrl;


      // Foto mit Spot verbinden
      const {
        error: photoError
      } =
        await supabaseClient
          .from("spot_photos")
          .insert({

            spot_id:
              newSpot.id,

            image_url:
              imageUrl,

            user_id:
              user.id

          });


      if (photoError) {

        console.error(
          "Foto DB:",
          photoError
        );

      }

    }
  }


  // ====================================================
  // FORMULAR ZURÜCKSETZEN
  // ====================================================

  const nameInput =
    document.getElementById("spotName");

  const descriptionInput =
    document.getElementById("spotDescription");

  const photoInputElement =
    document.getElementById("spotPhoto");


  if (nameInput) {
    nameInput.value = "";
  }

  if (descriptionInput) {
    descriptionInput.value = "";
  }

  if (photoInputElement) {
    photoInputElement.value = "";
  }


  // Standort zurücksetzen
  selectedLat = null;
  selectedLng = null;


  if (
    typeof selectedMarker !== "undefined" &&
    selectedMarker
  ) {

    map.removeLayer(
      selectedMarker
    );

    selectedMarker = null;
  }


  // Modal schließen
  const modal =
    document.getElementById("spotModal");

  if (modal) {
    modal.classList.remove("show");
  }


  showStatus(
    "✅ Spot veröffentlicht!"
  );


  // Neu laden
  await loadSpots();
}


// ======================================================
// SPOT LÖSCHEN
// ======================================================

async function deleteSpot(spotId) {

  const user =
    await Auth.getUser();

  if (!user) {

    showStatus(
      "❌ Du musst eingeloggt sein"
    );

    return;
  }


  if (!spotId) {
    return;
  }


  // Spot suchen
  const spot =
    spots.find(
      s => String(s.id) === String(spotId)
    );


  if (!spot) {

    showStatus(
      "❌ Spot nicht gefunden"
    );

    return;
  }


  // Prüfen ob eigener Spot
  const isOwner =
    String(spot.user_id) ===
    String(user.id);


  // Admin prüfen
  let isAdmin = false;


  try {

    const {
      data: profile
    } =
      await supabaseClient
        .from("profiles")
        .select("is_admin")
        .eq(
          "id",
          user.id
        )
        .maybeSingle();


    isAdmin =
      profile?.is_admin === true;

  } catch (error) {

    console.error(
      "Admin-Prüfung:",
      error
    );

  }


  if (!isOwner && !isAdmin) {

    showStatus(
      "❌ Du darfst diesen Spot nicht löschen"
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


  // Fotos aus DB löschen
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

    console.error(
      "Fotos löschen:",
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

    console.error(
      "Likes löschen:",
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

    return;
  }


  showStatus(
    "🗑️ Spot gelöscht"
  );


  await loadSpots();
}


// ======================================================
// SPOT LISTE RENDERN
// ======================================================

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
        Noch keine Spots 😭<br>
        Sei der Erste!
      </div>
    `;

    return;
  }


  container.innerHTML = "";


  const user =
    await Auth.getUser();


  // Admin prüfen
  let isAdmin = false;


  if (user) {

    const {
      data: profile
    } =
      await supabaseClient
        .from("profiles")
        .select("is_admin")
        .eq(
          "id",
          user.id
        )
        .maybeSingle();


    isAdmin =
      profile?.is_admin === true;
  }


  for (const spot of spots) {

    // ==================================================
    // FOTO
    // ==================================================

    let imageUrl = null;


    const {
      data: photos
    } =
      await supabaseClient
        .from("spot_photos")
        .select(
          "image_url"
        )
        .eq(
          "spot_id",
          spot.id
        )
        .limit(1);


    if (
      photos &&
      photos.length > 0
    ) {

      imageUrl =
        photos[0].image_url;
    }


    // ==================================================
    // NICKNAME
    // ==================================================

    const nickname =
      spot.profiles?.nickname ||
      "Unbekannt";


    // ==================================================
    // HTML
    // ==================================================

    const div =
      document.createElement(
        "div"
      );


    div.className =
      "spot";


    const canDelete =
      user &&
      (
        String(spot.user_id) ===
        String(user.id)
        ||
        isAdmin
      );


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
          📍 ${escapeHtml(spot.name)}
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

        <p class="spot-author">
          👤 erstellt von
          <strong>
            @${escapeHtml(nickname)}
          </strong>
        </p>

        <div class="spot-actions">

          <button
            class="like-btn"
            onclick="likeSpot('${spot.id}', this)"
          >
            ❤️ Like
          </button>

          ${
            canDelete
              ? `
                <button
                  class="delete-btn"
                  onclick="deleteSpot('${spot.id}')"
                >
                  🗑️ Löschen
                </button>
              `
              : ""
          }

        </div>

      </div>
    `;


    container.appendChild(
      div
    );
  }


  // Suche anwenden
  if (
    typeof filterSpots ===
    "function"
  ) {

    filterSpots();
  }
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
// START
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    // Kleine Verzögerung,
    // damit Auth geladen ist
    setTimeout(
      async function() {

        await loadSpots();

      },
      100
    );

  }
);