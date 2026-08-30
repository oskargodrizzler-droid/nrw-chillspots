// ===============================
// AUTH
// ===============================

async function registerUser() {

  const email =
    document.getElementById(
      "authEmail"
    ).value.trim();

  const password =
    document.getElementById(
      "authPassword"
    ).value;


  if (!email || !password) {

    showStatus(
      "❌ E-Mail und Passwort eingeben"
    );

    return;
  }


  if (password.length < 6) {

    showStatus(
      "❌ Passwort muss mindestens 6 Zeichen haben"
    );

    return;
  }


  showStatus(
    "⏳ Account wird erstellt..."
  );


  const {
    data,
    error
  } =
    await supabaseClient.auth.signUp({
      email,
      password
    });


  if (error) {

    console.error(
      "REGISTER:",
      error
    );

    showStatus(
      "❌ " + error.message
    );

    return;
  }


  if (data.user) {

    await supabaseClient
      .from("profiles")
      .upsert({
        id: data.user.id,
        nickname: null
      });


    showStatus(
      "✅ Account erstellt!"
    );

    closeAuthModal();

    await updateAuthUI();

  }

}



// ===============================
// LOGIN
// ===============================

async function loginUser() {

  const email =
    document.getElementById(
      "authEmail"
    ).value.trim();

  const password =
    document.getElementById(
      "authPassword"
    ).value;


  if (!email || !password) {

    showStatus(
      "❌ E-Mail und Passwort eingeben"
    );

    return;
  }


  showStatus(
    "⏳ Login..."
  );


  const {
    data,
    error
  } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });


  if (error) {

    console.error(
      "LOGIN:",
      error
    );

    showStatus(
      "❌ " + error.message
    );

    return;
  }


  showStatus(
    "✅ Eingeloggt!"
  );


  closeAuthModal();

  await updateAuthUI();

  await loadSpots();

}



// ===============================
// LOGOUT
// ===============================

async function logoutUser() {

  const {
    error
  } =
    await supabaseClient.auth.signOut();


  if (error) {

    showStatus(
      "❌ " + error.message
    );

    return;
  }


  showStatus(
    "👋 Ausgeloggt"
  );


  closeAuthModal();

  await updateAuthUI();

  await loadSpots();

}



// ===============================
// UI
// ===============================

async function updateAuthUI() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  const accountButton =
    document.getElementById(
      "accountButton"
    );

  const profileButton =
    document.getElementById(
      "profileButton"
    );

  const adminButton =
    document.getElementById(
      "adminTopButton"
    );

  const addSpotButton =
    document.getElementById(
      "addSpotButton"
    );

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );


  if (!user) {

    if (accountButton)
      accountButton.textContent =
        "👤 Account";

    if (profileButton)
      profileButton.style.display =
        "none";

    if (adminButton)
      adminButton.style.display =
        "none";

    if (addSpotButton)
      addSpotButton.style.display =
        "inline-block";

    if (logoutButton)
      logoutButton.style.display =
        "none";

    return;
  }


  if (accountButton)
    accountButton.textContent =
      "👤 Eingeloggt";


  if (profileButton)
    profileButton.style.display =
      "inline-block";


  if (logoutButton)
    logoutButton.style.display =
      "block";


  const {
    data: profile
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "role,is_admin,nickname"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();


  const isAdmin =
    profile?.role === "admin" ||
    profile?.is_admin === true;


  if (adminButton) {

    adminButton.style.display =
      isAdmin
        ? "inline-block"
        : "none";

  }

}



// ===============================
// AUTH EVENTS
// ===============================

supabaseClient.auth.onAuthStateChange(
  async function () {

    await updateAuthUI();

  }
);
