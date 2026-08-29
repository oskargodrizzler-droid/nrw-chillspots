document.addEventListener("DOMContentLoaded", () => {

  const loginBtn =
    document.getElementById("loginBtn");

  const registerBtn =
    document.getElementById("registerBtn");

  const logoutBtn =
    document.getElementById("logoutBtn");

  const adminBtn =
    document.getElementById("adminBtn");


  if (loginBtn) {
    loginBtn.addEventListener(
      "click",
      () => signIn()
    );
  }

  if (registerBtn) {
    registerBtn.addEventListener(
      "click",
      () => signUp()
    );
  }

  if (logoutBtn) {
    logoutBtn.addEventListener(
      "click",
      () => logout()
    );
  }

  if (adminBtn) {
    adminBtn.addEventListener(
      "click",
      () => openAdminPanel()
    );
  }


  createNicknameEditor();

  refreshNickname();

  watchSpots();

});


// ===============================
// NICKNAME
// ===============================

function createNicknameEditor() {

  const area =
    document.getElementById(
      "loggedInArea"
    );

  if (!area) return;

  if (
    document.getElementById(
      "nicknameEditor"
    )
  ) {
    return;
  }


  const editor =
    document.createElement("div");

  editor.id =
    "nicknameEditor";

  editor.style.marginBottom =
    "16px";

  editor.innerHTML = `

    <label>
      Dein Nickname
    </label>

    <div style="
      display:flex;
      gap:8px;
      margin-top:6px;
    ">

      <input
        id="nicknameInput"
        maxlength="24"
        placeholder="z.B. Oskar123"
      >

      <button
        id="saveNicknameBtn"
        class="primary"
        type="button"
      >
        Speichern
      </button>

    </div>

    <small style="
      display:block;
      color:#888;
      margin-top:6px;
    ">
      Andere sehen diesen Namen bei deinen Spots.
    </small>
  `;


  area.insertBefore(
    editor,
    area.firstChild
  );


  document
    .getElementById(
      "saveNicknameBtn"
    )
    .addEventListener(
      "click",
      saveNickname
    );
}


// ===============================
// NICKNAME LADEN
// ===============================

async function refreshNickname() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();

  if (!user) return;

  createNicknameEditor();


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .maybeSingle();


  if (error) {
    console.error(error);
    return;
  }


  const input =
    document.getElementById(
      "nicknameInput"
    );

  if (input) {
    input.value =
      data?.nickname || "";
  }
}


// ===============================
// NICKNAME SPEICHERN
// ===============================

async function saveNickname() {

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

    return;
  }


  const input =
    document.getElementById(
      "nicknameInput"
    );


  const nickname =
    input?.value.trim();


  if (
    !nickname ||
    nickname.length < 2 ||
    nickname.length > 24
  ) {

    showStatus(
      "❌ Nickname muss 2–24 Zeichen haben"
    );

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("profiles")
      .update({
        nickname: nickname
      })
      .eq(
        "id",
        user.id
      );


  if (error) {

    if (error.code === "23505") {

      showStatus(
        "❌ Dieser Nickname ist bereits vergeben"
      );

    } else {

      showStatus(
        "❌ " +
        error.message
      );
    }

    return;
  }


  showStatus(
    "✅ Nickname gespeichert!"
  );


  replaceCreatorNames();
}


// ===============================
// SPOT-NAMEN ERSETZEN
// ===============================

async function replaceCreatorNames() {

  const list =
    document.getElementById(
      "spotList"
    );

  if (!list || !spots.length) {
    return;
  }


  const userIds =
    [
      ...new Set(
        spots
          .map(
            spot => spot.user_id
          )
          .filter(Boolean)
      )
    ];


  if (!userIds.length) return;


  const {
    data: profiles
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id,nickname"
      )
      .in(
        "id",
        userIds
      );


  const profileMap =
    Object.fromEntries(
      (profiles || []).map(
        profile => [
          profile.id,
          profile.nickname
        ]
      )
    );


  const cards =
    list.querySelectorAll(
      ".spot"
    );


  cards.forEach(
    (card, index) => {

      const spot =
        spots[index];

      const creator =
        card.querySelector(
          ".creator"
        );


      if (
        !spot ||
        !creator
      ) {
        return;
      }


      const nickname =
        profileMap[
          spot.user_id
        ] ||
        "Unbekannter Nutzer";


      creator.textContent =
        `👤 Erstellt von: ${nickname}`;
    }
  );
}


// ===============================
// SPOT-LISTE ÜBERWACHEN
// ===============================

function watchSpots() {

  const list =
    document.getElementById(
      "spotList"
    );

  if (!list) return;


  const observer =
    new MutationObserver(
      () => {
        replaceCreatorNames();
      }
    );


  observer.observe(
    list,
    {
      childList: true,
      subtree: true
    }
  );
}