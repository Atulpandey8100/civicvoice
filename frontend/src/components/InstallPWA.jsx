
import { useEffect, useRef, useState } from "react";

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [position, setPosition] = useState({
    x: 20,
    y: 100,
  });

  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    const checkInstalled = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

      setInstalled(standalone);
    };

    checkInstalled();

    const handlePrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowPopup(false);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener?.("change", checkInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      mediaQuery.removeEventListener?.("change", checkInstalled);
    };
  }, []);

  // Keep the floating button inside the visible screen.
  useEffect(() => {
    const handleResize = () => {
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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

    const dx = event.clientX - dragOffset.current.x;
    const dy = event.clientY - dragOffset.current.y;

    if (
      Math.abs(dx - position.x) > 3 ||
      Math.abs(dy - position.y) > 3
    ) {
      hasMoved.current = true;
    }

    const button = buttonRef.current;
    if (!button) return;

    setPosition({
      x: Math.max(
        0,
        Math.min(dx, window.innerWidth - button.offsetWidth)
      ),
      y: Math.max(
        0,
        Math.min(dy, window.innerHeight - button.offsetHeight)
      ),
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleClick = async (event) => {
    // Ignore the click generated after dragging the button.
    if (hasMoved.current) {
      event.preventDefault();
      hasMoved.current = false;
      return;
    }

    if (!installPrompt) {
      setShowPopup(true);
      return;
    }

    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;

      if (result.outcome === "accepted") {
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error("PWA installation failed:", error);
    }
  };

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
          padding: "13px 20px",
          border: "none",
          borderRadius: 999,
          background: "linear-gradient(135deg, #155EEF, #0847B8)",
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
          boxShadow: "0 6px 22px rgba(21, 94, 239, 0.35)",
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 18 }}>
          ⬇
        </span>
        Install CivicVoice
      </button>

      {showPopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-title"
          onClick={() => setShowPopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.55)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 360,
              padding: 26,
              borderRadius: 22,
              background: "#FFFFFF",
              color: "#172033",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,.2)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                margin: "0 auto 16px",
                borderRadius: 18,
                display: "grid",
                placeItems: "center",
                background: "#E8F1FF",
                color: "#155EEF",
                fontSize: 30,
              }}
              aria-hidden="true"
            >
              ⬇
            </div>

            <h2 id="install-title" style={{ margin: "0 0 10px" }}>
              Install CivicVoice
            </h2>

            <p style={{ lineHeight: 1.6, color: "#596579" }}>
              Add CivicVoice to your home screen for quick access
              to community updates and reporting.
            </p>

            {installPrompt ? (
              <button
                type="button"
                onClick={handleClick}
                style={{
                  width: "100%",
                  padding: 13,
                  border: 0,
                  borderRadius: 12,
                  background: "#155EEF",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Install now
              </button>
            ) : (
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                <strong>Android / Desktop:</strong> Check your
                browser menu for Install app or Add to Home Screen.
                <br />
                <strong>iPhone / iPad:</strong> Open this website
                in Safari, tap Share, then Add to Home Screen.
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowPopup(false)}
              style={{
                width: "100%",
                marginTop: 10,
                padding: 12,
                border: "1px solid #D8DFEA",
                borderRadius: 12,
                background: "#FFFFFF",
                color: "#263348",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
