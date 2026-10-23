import { useCallback, useEffect, useRef, useState } from "react";

const POS_KEY = "civicvoice-install-pos";

const getDefaultPosition = () => ({
  x: Math.max(0, window.innerWidth - 190),
  y: Math.max(0, window.innerHeight - 140),
});

const loadPosition = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(POS_KEY));
    if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
      return saved;
    }
  } catch {
    // ignore
  }
  return getDefaultPosition();
};

const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
  (window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1);

function DownloadIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dark, setDark] = useState(false);
  const [position, setPosition] = useState(loadPosition);

  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const buttonRef = useRef(null);

  // Install event + installed detection
  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const checkInstalled = () => {
      const standalone =
        mediaQuery.matches || window.navigator.standalone === true;
      setInstalled(standalone);
    };

    // main.jsx me pakda hua event uthao
    if (window.__deferredInstallPrompt) {
      setInstallPrompt(window.__deferredInstallPrompt);
    }

    const handleReady = () => setInstallPrompt(window.__deferredInstallPrompt);

    const handleAppInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowPopup(false);
    };

    checkInstalled();

    window.addEventListener("pwa-install-ready", handleReady);
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery.addEventListener?.("change", checkInstalled);

    return () => {
      window.removeEventListener("pwa-install-ready", handleReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener?.("change", checkInstalled);
    };
  }, []);

  // Button ko screen ke andar rakho
  useEffect(() => {
    const keepButtonVisible = () => {
      const button = buttonRef.current;
      if (!button) return;

      setPosition((current) => ({
        x: Math.max(
          0,
          Math.min(current.x, window.innerWidth - button.offsetWidth)
        ),
        y: Math.max(
          0,
          Math.min(current.y, window.innerHeight - button.offsetHeight)
        ),
      }));
    };

    window.addEventListener("resize", keepButtonVisible);
    keepButtonVisible();

    return () => window.removeEventListener("resize", keepButtonVisible);
  }, [installed]);

  // Native install dialog kholo
  const installApp = useCallback(async () => {
    if (!installPrompt) {
      setDark(document.documentElement.classList.contains("dark"));
      setShowPopup(true);
      return;
    }

    try {
      const promptEvent = installPrompt;

      // Saved prompt sirf ek baar use hota hai
      setInstallPrompt(null);
      window.__deferredInstallPrompt = null;

      await promptEvent.prompt();
      const result = await promptEvent.userChoice;

      if (result.outcome === "accepted") {
        setShowPopup(false);
      }
    } catch (error) {
      console.error("CivicVoice installation failed:", error);
      setDark(document.documentElement.classList.contains("dark"));
      setShowPopup(true);
    }
  }, [installPrompt]);

  // Drag handlers
  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    hasMoved.current = false;
    dragOffset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };

    setDragging(true);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;

    const button = buttonRef.current;
    if (!button) return;

    const x = event.clientX - dragOffset.current.x;
    const y = event.clientY - dragOffset.current.y;

    if (Math.abs(x - position.x) > 3 || Math.abs(y - position.y) > 3) {
      hasMoved.current = true;
    }

    setPosition({
      x: Math.max(0, Math.min(x, window.innerWidth - button.offsetWidth)),
      y: Math.max(0, Math.min(y, window.innerHeight - button.offsetHeight)),
    });
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);

    if (hasMoved.current) {
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(position));
      } catch {
        // ignore
      }
    }
  };

  const handleClick = (event) => {
    // Drag ke baad install trigger na ho
    if (hasMoved.current) {
      event.preventDefault();
      event.stopPropagation();
      hasMoved.current = false;
      return;
    }

    void installApp();
  };

  // Escape se popup band
  useEffect(() => {
    if (!showPopup) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowPopup(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPopup]);

  if (installed) return null;

  const ios = isIOS();

  const theme = dark
    ? {
        card: "#171B22",
        text: "#F1F5F9",
        muted: "#9AA6B8",
        iconBg: "#1E2A44",
        closeBg: "#242B36",
        closeText: "#CBD5E1",
        border: "#2E3744",
        laterText: "#E2E8F0",
        laterBg: "#171B22",
      }
    : {
        card: "#FFFFFF",
        text: "#172033",
        muted: "#596579",
        iconBg: "#E8F1FF",
        closeBg: "#F1F5F9",
        closeText: "#334155",
        border: "#D8DFEA",
        laterText: "#263348",
        laterBg: "#FFFFFF",
      };

  return (
    <>
      {/* Floating install button */}
      <button
        ref={buttonRef}
        type="button"
        aria-label="Install CivicVoice app. Drag to move."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "12px 18px",
          border: 0,
          borderRadius: 999,
          background: "linear-gradient(135deg, #155EEF, #0847B8)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          cursor: dragging ? "grabbing" : "pointer",
          touchAction: "none",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          boxShadow: "0 6px 22px rgba(21,94,239,.3)",
        }}
      >
        <DownloadIcon />
        Install CivicVoice
      </button>

      {/* Manual install fallback */}
      {showPopup && (
        <div
          role="presentation"
          onClick={() => setShowPopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            paddingTop: "max(16px, env(safe-area-inset-top))",
            paddingBottom: "max(16px, env(safe-area-inset-bottom))",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 400,
              maxHeight: "calc(100dvh - 32px)",
              overflowY: "auto",
              boxSizing: "border-box",
              padding: "clamp(20px, 5vw, 28px)",
              borderRadius: 24,
              background: theme.card,
              color: theme.text,
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,.24)",
            }}
          >
            <button
              type="button"
              aria-label="Close install dialog"
              onClick={() => setShowPopup(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                border: 0,
                borderRadius: 999,
                background: theme.closeBg,
                color: theme.closeText,
                fontSize: 22,
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <div
              aria-hidden="true"
              style={{
                width: 60,
                height: 60,
                margin: "4px auto 16px",
                borderRadius: 18,
                display: "grid",
                placeItems: "center",
                background: theme.iconBg,
                color: "#155EEF",
              }}
            >
              <DownloadIcon size={28} />
            </div>

            <h2 id="install-title" style={{ margin: "0 0 10px", fontSize: 23 }}>
              Install CivicVoice
            </h2>

            <p
              style={{
                lineHeight: 1.6,
                color: theme.muted,
                margin: "0 0 20px",
              }}
            >
              Add CivicVoice to your home screen for quick access to community
              updates and reporting.
            </p>

            {installPrompt ? (
              <button
                type="button"
                onClick={() => void installApp()}
                style={{
                  width: "100%",
                  padding: 14,
                  border: 0,
                  borderRadius: 12,
                  background: "#155EEF",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Install now
              </button>
            ) : (
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  textAlign: "left",
                  color: theme.text,
                }}
              >
                {ios ? (
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Is website ko <strong>Safari</strong> me kholo.</li>
                    <li>Neeche <strong>Share</strong> button dabao.</li>
                    <li><strong>Add to Home Screen</strong> chuno.</li>
                    <li><strong>Add</strong> dabao.</li>
                  </ol>
                ) : (
                  <>
                    <ol style={{ margin: "0 0 12px", paddingLeft: 20 }}>
                      <li>
                        <strong>Chrome</strong> me site kholo (WhatsApp /
                        Instagram ke andar nahi).
                      </li>
                      <li>
                        Upar menu <strong>(⋮)</strong> dabao.
                      </li>
                      <li>
                        <strong>Install app</strong> ya{" "}
                        <strong>Add to Home screen</strong> chuno.
                      </li>
                    </ol>
                    <p style={{ margin: 0, color: theme.muted, fontSize: 13 }}>
                      Agar option nahi dikh raha, page ek baar reload karke
                      dobara try karo.
                    </p>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowPopup(false)}
              style={{
                width: "100%",
                marginTop: 14,
                padding: 13,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                background: theme.laterBg,
                color: theme.laterText,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Maybe later
            </button>
          </section>
        </div>
      )}
    </>
  );
}