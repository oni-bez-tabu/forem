import {
  ChatClient,
} from "@org/chat-core";
import {
  FirebaseAuthProvider,
  FirebaseFirestoreAdapter,
  FirebaseFunctionsAdapter,
  ensureFirebaseApp,
  getAuth,
  getFirestore,
} from "@org/chat-core/firebase";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const badge = document.getElementById("messages-unread-count");
const { firebaseApiKey, firebaseProjectId, firebaseUseEmulator, userStatus } = document.body.dataset;

if (!badge || userStatus !== "logged-in" || !firebaseApiKey || !firebaseProjectId) {
  // Brak badge lub brak danych konfiguracyjnych
} else if (!window.__messagesCountInitialized) {
  window.__messagesCountInitialized = true;
  void initMessagesCount();
}

async function initMessagesCount() {
  const trimmedApiKey = String(firebaseApiKey).trim();
  const trimmedProjectId = String(firebaseProjectId).trim();
  if (!trimmedApiKey || !trimmedProjectId) {
    return;
  }

  const firebaseConfig = {
    apiKey: trimmedApiKey,
    authDomain: `${trimmedProjectId}.firebaseapp.com`,
    projectId: trimmedProjectId,
    storageBucket: `${trimmedProjectId}.appspot.com`,
  };

  try {
    if (typeof window.__messagesCountUnsubscribe === "function") {
      try {
        window.__messagesCountUnsubscribe();
      } catch {
        // ignore
      }
      window.__messagesCountUnsubscribe = null;
    }

    const response = await fetch("/messages/session", {
      credentials: "include",
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const firebaseToken = typeof data?.firebaseToken === "string" ? data.firebaseToken.trim() : "";
    if (!firebaseToken) {
      return;
    }

    const app = ensureFirebaseApp(firebaseConfig);
    if (String(firebaseUseEmulator || "").toLowerCase() === "true") {
      try {
        connectFirestoreEmulator(getFirestore(app), "localhost", 8080);
      } catch (error) {
        if (!(error instanceof Error && error.message.includes("already been called"))) {
          console.warn("Błąd łączenia z Firestore emulatorem:", error);
        }
      }
      try {
        connectAuthEmulator(getAuth(app), "http://localhost:9099", { disableWarnings: true });
      } catch (error) {
        if (!(error instanceof Error && error.message.includes("already been called"))) {
          console.warn("Błąd łączenia z Auth emulatorem:", error);
        }
      }
      try {
        connectFunctionsEmulator(getFunctions(app), "localhost", 5001);
      } catch (error) {
        if (!(error instanceof Error && error.message.includes("already been called"))) {
          console.warn("Błąd łączenia z Functions emulatorem:", error);
        }
      }
    }
    const db = getFirestore(app);
    const auth = getAuth(app);

    const authProvider = new FirebaseAuthProvider({
      firebaseConfig,
      customToken: firebaseToken,
    });

    const authAdapter = {
      signInWithCustomToken: async (token) => {
        if (token && token !== firebaseToken) {
          console.warn("Otrzymano inny token niż oczekiwany, używam wartości z sesji.");
        }
        const { userId } = await authProvider.init();
        const idTokenResult = await auth.currentUser?.getIdTokenResult(true);
        const chatBanned = Boolean(idTokenResult?.claims?.chatBanned);
        const chatBanReason =
          typeof idTokenResult?.claims?.chatBanReason === "string" ? idTokenResult.claims.chatBanReason : undefined;
        return { uid: userId, chatBanned, chatBanReason };
      },
    };

    const firestoreAdapter = new FirebaseFirestoreAdapter(db);
    const functionsAdapter = new FirebaseFunctionsAdapter({ firebaseConfig, region: "europe-west1" });

    const client = new ChatClient({
      firebaseConfig,
      customToken: firebaseToken,
      auth: authAdapter,
      firestore: firestoreAdapter,
      media: functionsAdapter,
    });

    await client.init();

    const unsubscribe = client.subscribeTotalUnread((count) => {
      updateUnreadBadge(count);
    });

    const cleanup = () => {
      try {
        unsubscribe?.();
      } finally {
        if (window.__messagesCountUnsubscribe === cleanup) {
          window.__messagesCountUnsubscribe = null;
        }
      }
    };

    window.__messagesCountUnsubscribe = cleanup;
    window.addEventListener("pagehide", cleanup, { once: true });
    window.addEventListener("beforeunload", cleanup, { once: true });
  } catch (error) {
    console.error("Messages count init error:", error);
  }
}

function updateUnreadBadge(count) {
  if (!badge) return;
  const normalized = Number.isFinite(count) ? Number(count) : 0;
  if (normalized > 0) {
    badge.textContent = normalized > 99 ? "99+" : String(normalized);
    badge.classList.remove("hidden");
  } else {
    badge.textContent = "";
    badge.classList.add("hidden");
  }
}
