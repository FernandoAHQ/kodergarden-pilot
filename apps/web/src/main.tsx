import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "./AppErrorBoundary.js";
import { RootApp } from "./RootApp.js";
import { I18nProvider } from "./i18n.js";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <I18nProvider><RootApp /></I18nProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
