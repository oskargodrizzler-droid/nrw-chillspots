// ======================================================
// NRW CHILLSPOTS - PROFILES.JS
// Profile + Nicknames
// ======================================================

const Profiles = {

  // ----------------------------------------------------
  // PROFIL DES AKTUELLEN USERS LADEN
  // ----------------------------------------------------
  async getMyProfile() {

    const user = await Auth.getUser();

    if (!user) {
      return null;
    }

    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profil konnte nicht geladen werden:", error);
      return null;
    }

    return data;
  },


  // ----------------------------------------------------
  // PROFIL EINES USERS LADEN
  // ----------------------------------------------------
  async getProfile(userId) {

    if (!userId) {
      return null;
    }

    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .select("id, nickname, avatar_url, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Profil konnte nicht geladen werden:", error);
      return null;
    }

    return data;
  },


  // ----------------------------------------------------
  // NICKNAME SPEICHERN
  // ----------------------------------------------------
  async saveNickname(nickname) {

    const user = await Auth.getUser();

    if (!user) {
      showStatus("❌ Du musst eingeloggt sein");
      return false;
    }

    nickname = String(nickname || "").trim();

    if (!nickname) {
      showStatus("❌ Gib einen Nickname ein");
      return false;
    }

    if (nickname.length < 3) {
      showStatus("❌ Der Nickname muss mindestens 3 Zeichen haben");
      return false;
    }

    if (nickname.length > 20) {
      showStatus("❌ Der Nickname darf maximal 20 Zeichen haben");
      return false;
    }

    // Nur normale Zeichen erlauben
    if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
      showStatus(
        "❌ Verwende nur Buchstaben, Zahlen und _"
      );
      return false;
    }

    showStatus("⏳ Nickname wird gespeichert...");

    // Prüfen, ob Nickname bereits vergeben ist
    const {
      data: existing,
      error: checkError
    } = await supabaseClient
      .from("profiles")
      .select("id")
      .ilike("nickname", nickname)
      .neq("id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error(checkError);
      showStatus("❌ Nickname konnte nicht geprüft werden");
      return false;
    }

    if (existing) {
      showStatus("❌ Dieser Nickname ist bereits vergeben");
      return false;
    }

    // Profil erstellen oder aktualisieren
    const {
      error
    } = await supabaseClient
      .from("profiles")
      .upsert({
        id: user.id,
        nickname: nickname
      });

    if (error) {
      console.error("Nickname speichern:", error);
      showStatus("❌ " + error.message);
      return false;
    }

    showStatus("✅ Nickname gespeichert!");

    await this.updateUI();

    return true;
  },


  // ----------------------------------------------------
  // PROFIL UI AKTUALISIEREN
  // ----------------------------------------------------
  async updateUI() {

    const profile =
      await this.getMyProfile();

    const nicknameElement =
      document.getElementById("currentNickname");

    const accountInfo =
      document.getElementById("accountInfo");

    if (!profile) {

      if (nicknameElement) {
        nicknameElement.textContent =
          "Noch kein Nickname";
      }

      return;
    }

    const nickname =
      profile.nickname || "Noch kein Nickname";

    if (nicknameElement) {
      nicknameElement.textContent =
        nickname;
    }

    if (accountInfo) {

      const user =
        await Auth.getUser();

      if (user) {

        accountInfo.textContent =
          "👤 @" + nickname;

      }
    }
  },


  // ----------------------------------------------------
  // NICKNAME VON USER ID
  // ----------------------------------------------------
  async getNickname(userId) {

    const profile =
      await this.getProfile(userId);

    if (!profile) {
      return "Unbekannt";
    }

    return profile.nickname ||
      "Unbekannt";
  }
};


// ======================================================
// KOMPATIBILITÄTS-FUNKTIONEN
// ======================================================

async function loadProfile() {
  return await Profiles.updateUI();
}


async function saveNickname() {

  const input =
    document.getElementById("nickname");

  if (!input) {
    showStatus("❌ Nickname-Feld nicht gefunden");
    return false;
  }

  return await Profiles.saveNickname(
    input.value
  );
}


async function getNickname(userId) {
  return await Profiles.getNickname(userId);
}


// ======================================================
// START
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    const user =
      await Auth.getUser();

    if (user) {
      await Profiles.updateUI();
    }

  }
);