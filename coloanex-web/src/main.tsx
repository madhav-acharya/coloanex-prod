import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureBoneyard } from "boneyard-js/react";

import { store } from "./store/index.ts";
import { Toaster } from "./components/ui/sonner";
import "./bones/registry";
import "./index.css";
import App from "./App.tsx";

configureBoneyard({
  animate: "shimmer",
  color: "hsla(220, 14%, 88%, 1)",
  darkColor: "hsla(222, 28%, 22%, 1)",
  transition: 280,
  stagger: 60,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" expand={false} />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
