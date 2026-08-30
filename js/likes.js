// ======================================================
// NRW CHILLSPOTS - LIKES.JS
// Likes hinzufügen, entfernen und anzeigen
// ======================================================


// ======================================================
// LIKE STATUS EINES SPOTS
// ======================================================

async function getLikeStatus(spotId) {

  const user = await Auth.getUser();

  if (!user) {
    return {
      liked: false,
      count: 0
    };
  }

  // Anzahl aller Likes
  const {
    count,
    error: countError
  } = await supabaseClient
    .from("likes")
    .select("*", {
      count: "exact",
      head: true
    })
    .eq("spot_id", spotId);

  if (countError) {
    console.error(
      "Like-Anzahl:",
      countError
    );
  }


  // Prüfen ob dieser User geliked hat
  const {
    data,
    error
  } = await supabaseClient
    .from("likes")
    .select("id")
    .eq("spot_id", spotId)
    .eq("user_id", user.id)
    .maybeSingle();


  if (error) {
    console.error(
      "Like-Status:",
      error
    );
  }


  return {
    liked: !!data,
    count: count || 0
  };
}


// ======================================================
// LIKE / UNLIKE
// ======================================================

async function likeSpot(
  spotId,
  button
) {

  const user =
    await Auth.getUser();


  // Nicht eingeloggt
  if (!user) {

    showStatus(
      "❌ Du musst eingeloggt sein"
    );

    // Account öffnen
    if (
      typeof openAuthModal ===
      "function"
    ) {
      openAuthModal();
    }

    return;
  }


  if (!spotId) {
    return;
  }


  // Button während der Anfrage deaktivieren
  if (button) {
    button.disabled = true;
  }


  try {

    // Prüfen ob Like existiert
    const {
      data: existing,
      error: checkError
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
          user.id
        )
        .maybeSingle();


    if (checkError) {

      console.error(
        "Like prüfen:",
        checkError
      );

      showStatus(
        "❌ Like konnte nicht geprüft werden"
      );

      return;
    }


    // ==================================================
    // LIKE ENTFERNEN
    // ==================================================

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

        console.error(
          "Unlike:",
          error
        );

        showStatus(
          "❌ " + error.message
        );

        return;
      }


      showStatus(
        "💔 Like entfernt"
      );

    }


    // ==================================================
    // LIKE HINZUFÜGEN
    // ==================================================

    else {

      const {
        error
      } =
        await supabaseClient
          .from("likes")
          .insert({

            spot_id:
              spotId,

            user_id:
              user.id

          });


      if (error) {

        console.error(
          "Like:",
          error
        );

        showStatus(
          "❌ " + error.message
        );

        return;
      }


      showStatus(
        "❤️ Geliked!"
      );
    }


    // Button aktualisieren
    await updateLikeButton(
      spotId,
      button
    );

  } finally {

    if (button) {
      button.disabled = false;
    }
  }
}


// ======================================================
// LIKE-BUTTON AKTUALISIEREN
// ======================================================

async function updateLikeButton(
  spotId,
  button
) {

  if (!button) {
    return;
  }


  const status =
    await getLikeStatus(
      spotId
    );


  button.classList.toggle(
    "liked",
    status.liked
  );


  button.textContent =
    status.liked
      ? `❤️ Geliked · ${status.count}`
      : `❤️ Like · ${status.count}`;
}


// ======================================================
// ALLE LIKE-BUTTONS AKTUALISIEREN
// ======================================================

async function updateAllLikeButtons() {

  const buttons =
    document.querySelectorAll(
      ".like-btn"
    );


  for (const button of buttons) {

    const spotId =
      button.dataset.spotId;


    if (!spotId) {
      continue;
    }


    await updateLikeButton(
      spotId,
      button
    );
  }
}


// ======================================================
// LIKE-ANZAHL
// ======================================================

async function getLikeCount(
  spotId
) {

  const {
    count,
    error
  } =
    await supabaseClient
      .from("likes")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq(
        "spot_id",
        spotId
      );


  if (error) {

    console.error(
      "Like Count:",
      error
    );

    return 0;
  }


  return count || 0;
}


// ======================================================
// EIGENER LIKE
// ======================================================

async function hasLikedSpot(
  spotId
) {

  const user =
    await Auth.getUser();


  if (!user) {
    return false;
  }


  const {
    data,
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
        user.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "hasLikedSpot:",
      error
    );

    return false;
  }


  return !!data;
}


// ======================================================
// REALTIME LIKES
// ======================================================

let likesChannel = null;


function startLikesRealtime() {

  // Falls bereits aktiv
  if (likesChannel) {
    return;
  }


  likesChannel =
    supabaseClient
      .channel(
        "likes-realtime"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes"
        },
        async function() {

          console.log(
            "❤️ Likes aktualisiert"
          );


          // Buttons aktualisieren
          await updateAllLikeButtons();

        }
      )
      .subscribe();
}


// ======================================================
// REALTIME BEENDEN
// ======================================================

async function stopLikesRealtime() {

  if (!likesChannel) {
    return;
  }


  await supabaseClient.removeChannel(
    likesChannel
  );


  likesChannel = null;
}


// ======================================================
// START
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    setTimeout(
      function() {

        startLikesRealtime();

      },
      500
    );

  }
);