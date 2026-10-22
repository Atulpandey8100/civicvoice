import { useCallback, useEffect, useRef, useState } from "react";

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [position, setPosition] = useState({ x: 20, y: 100 });

  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    const checkInstalled = () => {
      setInstalled(
        window.matchMedia("(display-mode: standalone)").matches ||
          window.navigator.standalone === true
      );
    };

    const handlePrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowPopup(false);
    };

    checkInstalled();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    mediaQuery.addEventListener?.("change", checkInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      mediaQuery.removeEventListener?.("change", checkInstalled);
    };
  }, []);

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
    return () => window.removeEventListener("resize", keepButtonVisible);
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) return;

    try {
      const promptEvent = installPrompt;
      setInstallPrompt(null);

      await promptEvent.prompt();
      const result = await promptEvent.userChoice;

      if (result.outcome === "accepted") {
        setShowPopup(false);
      }
    } catch (error) {
      console.error("PWA installation failed:", error);
    }
  }, [installPrompt]);

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;

    hasMoved.current = false;
    dragOffset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };

    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;

    const button = buttonRef.current;
    if (!button) return;

    const x = event.clientX - dragOffset.current.x;
    const y = event.clientY - dragOffset.current.y;

    if (
      Math.abs(x - position.x) > 3 ||
      Math.abs(y - position.y) > 3
    ) {
      hasMoved.current = true;
    }

    setPosition({
      x: Math.max(0, Math.min(x, window.innerWidth - button.offsetWidth)),
      y: Math.max(0, Math.min(y, window.innerHeight - button.offsetHeight)),
    });
  };

  const handlePointerUp = () => setDragging(false);

  const handleClick = (event) => {
    if (hasMoved.current) {
      event.preventDefault();
      event.stopPropagation();
      hasMoved.current = false;
      return;
    }

    if (installPrompt) {
      void installApp();
    } else {
      setShowPopup(true);
    }
  };

  useEffect(() => {
    if (!showPopup) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowPopup(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPopup]);

  if (installed) return null;

  return (
    <>
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
          gap: 10,
          padding: "12px 18px",
          border: 0,
          borderRadius: 999,
          background: "linear-gradient(135deg, #155EEF, #0847B8)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
          boxShadow: "0 6px 22px rgba(21,94,239,.3)",
        }}
      >
        <span aria-hidden="true">⬇</span>
        Install CivicVoice
      </button>

      {showPopup && (
        <div
          role="presentation"
          onClick={() => setShowPopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,.58)",
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
              maxWidth: 380,
              maxHeight: "calc(100dvh - 32px)",
              overflowY: "auto",
              boxSizing: "border-box",
              padding: "clamp(20px, 5vw, 28px)",
              borderRadius: 24,
              background: "#fff",
              color: "#172033",
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
                background: "#F1F5F9",
                color: "#334155",
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
                background: "#E8F1FF",
                color: "#155EEF",
                fontSize: 28,
              }}
            >
              ⬇
            </div>

            <h2
              id="install-title"
              style={{ margin: "0 0 10px", fontSize: 23 }}
            >
              Install CivicVoice
            </h2>

            <p style={{ lineHeight: 1.6, color: "#596579", margin: "0 0 18px" }}>
              Add CivicVoice to your home screen for quick access
              to community updates and reporting.
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
                  cursor: "pointer",
                }}
              >
                Install now
              </button>
            ) : (
              <div style={{ fontSize: 14, lineHeight: 1.7, textAlign: "left" }}>
                <p style={{ margin: "0 0 10px" }}>
                  <strong>Android / Desktop:</strong> Open your browser menu
                  and choose Install app or Add to Home Screen, if available.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>iPhone / iPad:</strong> Open this website in Safari,
                  tap Share, then Add to Home Screen.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowPopup(false)}
              style={{
                width: "100%",
                marginTop: 14,
                padding: 13,
                border: "1px solid #D8DFEA",
                borderRadius: 12,
                background: "#fff",
                color: "#263348",
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
