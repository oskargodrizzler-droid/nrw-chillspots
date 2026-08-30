// ======================================================
// NRW CHILLSPOTS - AUTH.JS
// Registrierung, Login, Logout und Session
// ======================================================

const Auth = {

  // ----------------------------------------------------
  // AKTUELLEN USER HOLEN
  // ----------------------------------------------------
  async getUser() {
    const {
      data: { user },
      error
    } = await supabaseClient.auth.getUser();

    if (error) {
      console.error("User konnte nicht geladen werden:", error);
      return null;
    }

    return user || null;
  },


  // ----------------------------------------------------
  // REGISTRIEREN
  // ----------------------------------------------------
  async signUp(email, password) {

    email = String(email || "").trim();
    password = String(password || "");

    if (!email || !password) {
      showStatus("❌ E-Mail und Passwort eingeben");
      return false;
    }

    if (password.length < 6) {
      showStatus("❌ Passwort muss mindestens 6 Zeichen haben");
      return false;
    }

    showStatus("⏳ Account wird erstellt...");

    const {
      data,
      error
    } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      console.error("Registrierung:", error);
      showStatus("❌ " + error.message);
      return false;
    }

    // Falls Supabase E-Mail-Bestätigung verlangt
    if (data.user && !data.session) {

      showStatus(
        "✅ Account erstellt! Prüfe deine E-Mail zur Bestätigung."
      );

    } else {

      showStatus("✅ Account erfolgreich erstellt!");

    }

    await this.updateUI();

    return true;
  },


  // ----------------------------------------------------
  // EINLOGGEN
  // ----------------------------------------------------
  async signIn(email, password) {

    email = String(email || "").trim();
    password = String(password || "");

    if (!email || !password) {
      showStatus("❌ E-Mail und Passwort eingeben");
      return false;
    }

    showStatus("⏳ Login...");

    const {
      data,
      error
    } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error("Login:", error);
      showStatus("❌ " + error.message);
      return false;
    }

    showStatus("✅ Erfolgreich eingeloggt!");

    await this.updateUI();

    // Modal schließen, falls vorhanden
    const modal = document.getElementById("authModal");

    if (modal) {
      modal.classList.remove("show");
    }

    // Profile laden
    if (typeof loadProfile === "function") {
      await loadProfile();
    }

    // Spots neu laden
    if (typeof loadSpots === "function") {
      await loadSpots();
    }

    return true;
  },


  // ----------------------------------------------------
  // AUSLOGGEN
  // ----------------------------------------------------
  async signOut() {

    showStatus("⏳ Ausloggen...");

    const {
      error
    } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Logout:", error);
      showStatus("❌ " + error.message);
      return false;
    }

    showStatus("👋 Erfolgreich ausgeloggt");

    await this.updateUI();

    return true;
  },


  // ----------------------------------------------------
  // UI AKTUALISIEREN
  // ----------------------------------------------------
  async updateUI() {

    const user = await this.getUser();

    const accountInfo =
      document.getElementById("accountInfo");

    const logoutButton =
      document.getElementById("logoutButton");

    const loginButton =
      document.getElementById("loginButton");

    const registerButton =
      document.getElementById("registerButton");

    const accountButton =
      document.getElementById("accountButton");


    if (user) {

      // User ist eingeloggt
      if (accountInfo) {
        accountInfo.textContent =
          "👤 " + (user.email || "Eingeloggt");
      }

      if (logoutButton) {
        logoutButton.style.display = "block";
      }

      if (loginButton) {
        loginButton.style.display = "none";
      }

      if (registerButton) {
        registerButton.style.display = "none";
      }

      if (accountButton) {
        accountButton.textContent = "👤 Profil";
      }

    } else {

      // User ist nicht eingeloggt
      if (accountInfo) {
        accountInfo.textContent =
          "Nicht eingeloggt";
      }

      if (logoutButton) {
        logoutButton.style.display = "none";
      }

      if (loginButton) {
        loginButton.style.display = "block";
      }

      if (registerButton) {
        registerButton.style.display = "block";
      }

      if (accountButton) {
        accountButton.textContent = "👤 Account";
      }
    }

    // Admin UI aktualisieren
    if (typeof updateAdminUI === "function") {
      await updateAdminUI();
    }
  }
};


// ======================================================
// KOMPATIBILITÄTS-FUNKTIONEN
// Damit alte Buttons weiterhin funktionieren
// ======================================================

async function signUp() {

  const emailElement =
    document.getElementById("email");

  const passwordElement =
    document.getElementById("password");

  const email =
    emailElement ? emailElement.value : "";

  const password =
    passwordElement ? passwordElement.value : "";

  return await Auth.signUp(
    email,
    password
  );
}


async function signIn() {

  const emailElement =
    document.getElementById("email");

  const passwordElement =
    document.getElementById("password");

  const email =
    emailElement ? emailElement.value : "";

  const password =
    passwordElement ? passwordElement.value : "";

  return await Auth.signIn(
    email,
    password
  );
}


async function logout() {
  return await Auth.signOut();
}


async function updateAccountUI() {
  return await Auth.updateUI();
}


// ======================================================
// AUTH STATUS LISTENER
// ======================================================

supabaseClient.auth.onAuthStateChange(
  async function(event, session) {

    console.log(
      "Auth Event:",
      event
    );

    await Auth.updateUI();

    // Profil nach Login laden
    if (
      session &&
      typeof loadProfile === "function"
    ) {
      setTimeout(async () => {
        await loadProfile();
      }, 0);
    }

  }
);


// ======================================================
// START
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    await Auth.updateUI();

  }
);