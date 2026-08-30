// ===============================
// LIKE
// ===============================

async function likeSpot(
  spotId,
  button
) {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  if (!user) {

    showStatus(
      "❌ Bitte zuerst einloggen"
    );

    openAuthModal();

    return;
  }


  const {
    data: existing
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

      showStatus(
        "❌ " + error.message
      );

      return;
    }


    if (button) {
      button.textContent =
        "❤️ Like";
    }


    showStatus(
      "💔 Like entfernt"
    );

  } else {

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

      showStatus(
        "❌ " + error.message
      );

      return;
    }


    if (button) {
      button.textContent =
        "💖 Geliked";
    }


    showStatus(
      "❤️ Like!"
    );

  }


  if (
    typeof loadSpots === "function"
  ) {
    await loadSpots();
  }

}
