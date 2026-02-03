import { h, render } from "preact";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ChatProvider, ChatLayout, ChatLayoutError, ChatLayoutSkeleton, useChat, useChatContext } from "@org/chat-ui-preact";
import {
  getAuth,
  onIdTokenChanged,
  FirebaseAuthProvider,
  FirebaseFirestoreAdapter,
  FirebaseFunctionsAdapter,
  ensureFirebaseApp,
  getFirestore,
} from "@org/chat-core/firebase";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { ChatClient } from "@org/chat-core";
import { Route, Router, useLocation, useRoute } from "wouter";

const API_BASE_URL = "";
const { firebaseApiKey, firebaseProjectId, firebaseUseEmulator } = document.body.dataset;

function ensureChatUiStylesheetLoaded() {
  if (typeof document === "undefined") return;
  if (document.getElementById("chat-ui-stylesheet")) return;

  const link = document.createElement("link");
  link.id = "chat-ui-stylesheet";
  link.rel = "stylesheet";
  link.href = "/chat-ui.css";
  document.head?.appendChild(link);
}

function buildFirebaseConfig() {
  const trimmedApiKey = String(firebaseApiKey || "").trim();
  const trimmedProjectId = String(firebaseProjectId || "").trim();
  if (!trimmedApiKey || !trimmedProjectId) {
    return null;
  }
  return {
    apiKey: trimmedApiKey,
    authDomain: `${trimmedProjectId}.firebaseapp.com`,
    projectId: trimmedProjectId,
    storageBucket: `${trimmedProjectId}.appspot.com`,
  };
}

function TobyBanner({ tobyAlertUrl }) {
  const src = tobyAlertUrl || "/assets/toby-alert.png";
  return (
    <div
      className="forem-chat-toby-banner"
      style={{
        marginTop: "auto",
        paddingTop: "24px",
        marginBottom: "24px",
        paddingBottom: "50px",
        display: "flex",
        justifyContent: "center",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
    >
      <div style={{ position: "relative", display: "flex", width: "100%", maxWidth: "28rem", flexDirection: "column", alignItems: "center" }}>
        <img
          src={src}
          alt="Przypomnienie o kulturze w rozmowie"
          style={{ position: "relative", zIndex: 10, height: "192px", width: "auto", maxWidth: "100%" }}
        />
        <p
          style={{
            position: "relative",
            zIndex: 0,
            marginTop: "-16px",
            width: "100%",
            borderRadius: "12px",
            backgroundColor: "white",
            padding: "16px",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1f2937",
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          }}
        >
          Zachowaj kulturę i szanuj granice. Wszystkie zachowania niezgodne z kodeksem zgłaszaj.
        </p>
      </div>
    </div>
  );
}

function ChatWithRouting({ currentUserId, client, tobyAlertUrl }) {
  const { threads, loading: threadsLoading } = useChat();
  const { getProfile, profilesVersion } = useChatContext();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/:threadIdentifier?");
  const [preselectedMember, setPreselectedMember] = useState(null);
  const checkUserTimeoutRef = useRef(null);
  const pendingThreadIdRef = useRef(null);
  const selectedThreadIdRef = useRef(null);

  const threadIdentifier = params?.threadIdentifier || null;
  const showTobyBanner = threads.length <= 2;

  const selectedThreadId = useMemo(() => {
    if (!threadIdentifier) return null;

    const isUserIdentifier = threadIdentifier.startsWith("@");
    const cleanId = isUserIdentifier ? threadIdentifier.slice(1) : threadIdentifier;

    // Jeśli właśnie utworzyliśmy wątek i jeszcze nie ma go w `threads`,
    // pozwól wejść w widok wątku po samym ID.
    if (!isUserIdentifier && pendingThreadIdRef.current === threadIdentifier) {
      return threadIdentifier;
    }

    if (isUserIdentifier) {
      for (const thread of threads) {
        if (thread.type === "direct") {
          for (const memberId of thread.members) {
            if (memberId === currentUserId) continue;
            if (memberId === cleanId) return thread.id;
            const profile = getProfile(memberId);
            if (profile?.username === cleanId) return thread.id;
          }
        }
      }
      return null;
    }

    const namedThread = threads.find(
      (t) => (t.type === "group" || t.type === "community") && t.name === threadIdentifier,
    );
    if (namedThread) return namedThread.id;

    const threadById = threads.find((t) => t.id === threadIdentifier);
    return threadById?.id || null;
  }, [threadIdentifier, threads, getProfile, currentUserId, profilesVersion]);

  selectedThreadIdRef.current = selectedThreadId;

  // Gdy `threads` w końcu zawiera pending thread, wyczyść pending ref.
  useEffect(() => {
    const pending = pendingThreadIdRef.current;
    if (!pending) return;
    const existsNow = threads.some((t) => t.id === pending);
    if (existsNow) {
      pendingThreadIdRef.current = null;
    }
  }, [threads]);

  // Gdy wątek się znajdzie (np. po załadowaniu threads), wyczyść preselectedMember żeby nie otwierać modala.
  useEffect(() => {
    if (selectedThreadId) {
      setPreselectedMember(null);
    }
  }, [selectedThreadId]);

  // Track if threads subscription has delivered at least once
  const threadsLoadedOnceRef = useRef(false);
  const wasLoadingRef = useRef(true);
  useEffect(() => {
    if (wasLoadingRef.current && !threadsLoading) {
      threadsLoadedOnceRef.current = true;
    }
    wasLoadingRef.current = threadsLoading;
  }, [threadsLoading]);

  // Handle opening new thread modal for unknown users – only after threads have loaded at least once
  useEffect(() => {
    if (!threadIdentifier) return;
    if (selectedThreadId) return;
    if (threadsLoading) return;
    if (!threadsLoadedOnceRef.current) return;

    const isUserIdentifier = threadIdentifier.startsWith("@");
    if (!isUserIdentifier) return;

    const cleanId = threadIdentifier.slice(1);

    if (checkUserTimeoutRef.current) {
      clearTimeout(checkUserTimeoutRef.current);
    }

    checkUserTimeoutRef.current = setTimeout(async () => {
      checkUserTimeoutRef.current = null;
      if (selectedThreadIdRef.current) return;

      try {
        const response = await fetch(`${API_BASE_URL}/search/usernames?username=${encodeURIComponent(cleanId)}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const backendUsers = Array.isArray(data.result) ? data.result : [];
          const matchedUser = backendUsers.find((user) => user.username === cleanId);

          if (matchedUser) {
            setPreselectedMember(cleanId);
          } else {
            setLocation("/");
          }
        } else {
          setLocation("/");
        }
      } catch {
        setLocation("/");
      }
    }, 1500);

    return () => {
      if (checkUserTimeoutRef.current) {
        clearTimeout(checkUserTimeoutRef.current);
        checkUserTimeoutRef.current = null;
      }
    };
  }, [threadIdentifier, selectedThreadId, setLocation, threadsLoading]);

  const handleThreadSelect = useCallback(
    (threadId, thread) => {
      if (!threadId) {
        setLocation("/");
        return;
      }

      const foundThread = thread || threads.find((t) => t.id === threadId);
      if (!foundThread) {
        // Pierwszy wątek: często mamy już `threadId`, ale subskrypcja `threads` jeszcze nie zdążyła go dostarczyć.
        // Wtedy nawiguj po samym ID, żeby od razu wejść w widok wątku.
        pendingThreadIdRef.current = threadId;
        setLocation(`/${threadId}`);
        return;
      }

      if (foundThread.type === "direct") {
        const otherMember = foundThread.members.find((m) => m !== currentUserId);
        if (otherMember) {
          const profile = getProfile(otherMember);
          const username = profile?.username ?? otherMember;
          setLocation(`/@${username}`);
        }
      } else if (foundThread.name) {
        setLocation(`/${foundThread.name}`);
      } else {
        setLocation(`/${foundThread.id}`);
      }
    },
    [threads, currentUserId, getProfile, setLocation],
  );

  const handleThreadCreated = useCallback(
    (thread) => {
      setPreselectedMember(null);

      // Stabilne zachowanie dla 1. wątku: najpierw wejdź w /{thread.id},
      // bo `threads` i profile mogą jeszcze nie być zsynchronizowane.
      pendingThreadIdRef.current = thread.id;
      setLocation(`/${thread.id}`);

      if (thread.type === "direct") {
        const otherMember = thread.members.find((m) => m !== currentUserId);
        if (otherMember) {
          const profile = getProfile(otherMember);
          const username = profile?.username ?? otherMember;
          // Jeśli profil już jest dostępny, to od razu popraw URL na /@username.
          // Jeśli nie - zostaniemy na /{thread.id} (wątek i tak będzie otwarty).
          if (profile?.username) {
            setLocation(`/@${username}`);
          }
        }
      } else if (thread.name) {
        setLocation(`/${thread.name}`);
      } else {
        setLocation(`/${thread.id}`);
      }
    },
    [currentUserId, getProfile, setLocation],
  );

  const handleBack = useCallback(() => {
    setLocation("/");
  }, [setLocation]);

  return (
    <ChatLayout
      currentUserId={currentUserId}
      client={client}
      apiBaseUrl={API_BASE_URL}
      footerSlot={showTobyBanner ? <TobyBanner tobyAlertUrl={tobyAlertUrl} /> : null}
      selectedThreadId={selectedThreadId}
      onThreadSelect={handleThreadSelect}
      onThreadCreated={handleThreadCreated}
      preselectedMember={preselectedMember}
      onNewThreadModalClose={() => setPreselectedMember(null)}
      onBack={handleBack}
    />
  );
}

export function App() {
  const [state, setState] = useState({
    client: null,
    currentUserId: null,
    user: null,
    loading: true,
    error: null,
  });

  const sessionLoadingRef = useRef(false);
  const reauthInProgressRef = useRef(false);

  const startSession = useCallback(async () => {
    sessionLoadingRef.current = true;
    setState({ client: null, currentUserId: null, user: null, loading: true, error: null });

    const firebaseConfig = buildFirebaseConfig();
    if (!firebaseConfig) {
      setState({
        client: null,
        currentUserId: null,
        user: null,
        loading: false,
        error: "Brak konfiguracji Firebase dla chatu.",
      });
      sessionLoadingRef.current = false;
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/messages/session`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Nie udało się pobrać sesji (status ${response.status}).`);
      }

      const data = await response.json();
      if (!data?.firebaseToken) {
        throw new Error("Brak firebaseToken w odpowiedzi backendu.");
      }

      const { client: createdClient, currentUserId: resolvedUserId } = await createChatClient(
        data.firebaseToken,
        firebaseConfig,
      );

      setState({
        client: createdClient,
        currentUserId: resolvedUserId,
        user: data.user ?? null,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState({ client: null, currentUserId: null, user: null, loading: false, error: message });
    } finally {
      sessionLoadingRef.current = false;
    }
  }, []);

  const handleReauth = useCallback(async () => {
    if (reauthInProgressRef.current || sessionLoadingRef.current) {
      return;
    }
    reauthInProgressRef.current = true;
    try {
      await startSession();
    } finally {
      reauthInProgressRef.current = false;
    }
  }, [startSession]);

  useEffect(() => {
    void startSession();
  }, [startSession]);

  useEffect(() => {
    if (!state.client) {
      return;
    }

    const auth = getAuth();
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (sessionLoadingRef.current || reauthInProgressRef.current) {
        return;
      }

      if (!firebaseUser) {
        await handleReauth();
        return;
      }

      try {
        await firebaseUser.getIdToken(true);
      } catch {
        await handleReauth();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [state.client, handleReauth]);

  const containerStyle = useMemo(
    () => ({
      display: "flex",
      height: "100%",
      width: "100%",
      flexDirection: "column",
      overflow: "hidden",
    }),
    [],
  );

  const tobyAlertUrl = useMemo(() => {
    const el = document.getElementById("chat-app");
    return el?.dataset?.tobyAlertUrl || "";
  }, []);

  if (state.loading) {
    return (
      <div style={containerStyle}>
        <ChatLayoutSkeleton />
      </div>
    );
  }

  if (state.error || !state.client || !state.currentUserId) {
    return (
      <div style={containerStyle}>
        <ChatLayoutError
          error={state.error ?? "Nieznany błąd"}
          onRetry={() => void startSession()}
          footerSlot={<TobyBanner tobyAlertUrl={tobyAlertUrl} />}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <ChatProvider client={state.client} currentUserId={state.currentUserId}>
        <Router base="/message">
          <Route path="/:threadIdentifier?">
            <ChatWithRouting currentUserId={state.currentUserId} client={state.client} tobyAlertUrl={tobyAlertUrl} />
          </Route>
        </Router>
      </ChatProvider>
    </div>
  );
}

async function createChatClient(customToken, firebaseConfig) {
  const trimmedToken = String(customToken || "").trim();
  if (!trimmedToken) {
    throw new Error("Brak poprawnego tokenu Firebase.");
  }

  const app = ensureFirebaseApp(firebaseConfig);

  // Utworzenie instancji Firebase przed połączeniem z emulatorami
  const db = getFirestore(app);
  const auth = getAuth(app);
  const functions = getFunctions(app);

  // Connect to emulator if enabled
  if (String(firebaseUseEmulator || "").toLowerCase() === "true") {
    try {
      connectFirestoreEmulator(db, "localhost", 8080);
    } catch (error) {
      if (!(error instanceof Error && error.message.includes("already been called"))) {
        console.warn("Błąd łączenia z Firestore emulatorem:", error);
      }
    }
    try {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    } catch (error) {
      if (!(error instanceof Error && error.message.includes("already been called"))) {
        console.warn("Błąd łączenia z Auth emulatorem:", error);
      }
    }
    try {
      connectFunctionsEmulator(functions, "localhost", 5001);
    } catch (error) {
      if (!(error instanceof Error && error.message.includes("already been called"))) {
        console.warn("Błąd łączenia z Functions emulatorem:", error);
      }
    }
  }

  const authProvider = new FirebaseAuthProvider({
    firebaseConfig,
    customToken: trimmedToken,
  });

  let signedInUserId = null;

  const authAdapter = {
    signInWithCustomToken: async (token) => {
      if (token && token !== trimmedToken) {
        console.warn("Otrzymano inny token niż oczekiwany, używam wartości z sesji.");
      }
      const { userId } = await authProvider.init();
      signedInUserId = userId;
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
    customToken: trimmedToken,
    auth: authAdapter,
    firestore: firestoreAdapter,
    media: functionsAdapter,
  });

  await client.init();

  const currentUserId = signedInUserId ?? auth.currentUser?.uid;
  if (!currentUserId) {
    throw new Error("Nie udało się ustalić użytkownika po zalogowaniu.");
  }

  return { client, currentUserId };
}

const rootElement = document.getElementById("chat-app");
if (rootElement) {
  ensureChatUiStylesheetLoaded();
  render(<App />, rootElement);
}
