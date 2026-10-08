import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "./AppErrorBoundary.js";
import { RootApp } from "./RootApp.js";
import { I18nProvider } from "./i18n.js";
import "./styles.css";
import { CatalogProvider } from "./catalog.js";
import { AdminApp } from "./admin/AdminApp.js";
import { DynamicGardenLab } from "./lab/DynamicGardenLab.js";

const dynamicLab = import.meta.env.DEV && window.location.pathname === "/lab/dynamic-garden";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <I18nProvider>{dynamicLab ? <DynamicGardenLab /> : window.location.pathname.startsWith("/admin") ? <AdminApp /> : <CatalogProvider><RootApp /></CatalogProvider>}</I18nProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
