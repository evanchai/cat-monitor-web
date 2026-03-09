import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import xhsHtml from "./xhs.html?raw";

if (window.location.pathname === "/xhs") {
  document.open();
  document.write(xhsHtml);
  document.close();
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
