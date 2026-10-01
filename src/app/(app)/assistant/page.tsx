"use client";

import { useEffect, useRef, useState } from "react";

type PrototypeWindow = Window & { enterHub?: () => void };

export default function AssistantPage() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const frame = frameRef.current;
      const original = frame?.contentWindow as PrototypeWindow | null;
      const document = frame?.contentDocument;

      if (
        document?.readyState === "complete" &&
        typeof original?.enterHub === "function"
      ) {
        if (!document.head.querySelector("style[data-host-shell]")) {
          const style = document.createElement("style");
          style.dataset.hostShell = "true";
          style.textContent = `
            .sidebar, .top-header { display: none !important; }
            .main-wrapper { margin-left: 0 !important; min-height: 100vh !important; }
            #page-hub { height: 100vh !important; }
          `;
          document.head.appendChild(style);
        }
        original.enterHub();
        original.scrollTo(0, 0);
        const home = document.getElementById("hub-home");
        if (home) home.scrollTop = 0;
        setReady(true);
        window.clearInterval(timer);
      } else if (attempts >= 200) {
        setError(true);
        window.clearInterval(timer);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="科研超级中枢"
      style={{
        width: "calc(100% + 48px)",
        height: "calc(100dvh - 58px)",
        margin: "-22px -24px -36px",
        overflow: "hidden",
        background: "#f4f8fd",
      }}
    >
      {!ready && !error && (
        <p role="status" style={{ padding: 24 }}>
          正在载入科研超级中枢…
        </p>
      )}
      {error && (
        <p role="alert" style={{ padding: 24 }}>
          原型页面加载失败，请刷新后重试。
        </p>
      )}
      <iframe
        ref={frameRef}
        title="科研超级中枢原型"
        src="/AI4S科研平台原型设计.html"
        style={{
          width: "100%",
          height: "100%",
          border: 0,
          display: "block",
          visibility: ready ? "visible" : "hidden",
        }}
      />
    </section>
  );
}
