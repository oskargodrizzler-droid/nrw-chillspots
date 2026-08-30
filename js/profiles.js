// ===============================
// PROFILE
// ===============================

async function loadProfilePage() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  if (!user) {

    window.location.href =
      "../index.html";

    return;
  }


  const email =
    document.getElementById(
      "profileEmail"
    );

  if (email) {
    email.textContent =
      user.email;
  }


  const {
    data: profile
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "nickname,username"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();


  const nickname =
    document.getElementById(
      "nickname"
    );


  if (nickname) {

    nickname.value =
      profile?.nickname ||
      profile?.username ||
      "";

  }

}



// ===============================
// SPEICHERN
// ===============================

async function saveProfile() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  if (!user) {

    showStatus(
      "❌ Nicht eingeloggt"
    );

    return;
  }


  const input =
    document.getElementById(
      "nickname"
    );


  const nickname =
    input.value.trim();


  if (
    nickname.length < 2 ||
    nickname.length > 30
  ) {

    showStatus(
      "❌ Nickname muss 2–30 Zeichen haben"
    );

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("profiles")
      .update({
        nickname
      })
      .eq(
        "id",
        user.id
      );


  if (error) {

    console.error(
      "PROFILE:",
      error
    );

    showStatus(
      "❌ " + error.message
    );

    return;
  }


  showStatus(
    "✅ Nickname gespeichert!"
  );

}
