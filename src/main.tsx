import { createRoot } from "react-dom/client";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";
import "./accessibility.css";

// Initialize native plugins when running on a device
const initApp = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1a6dd4' });
    } catch (e) {
      // StatusBar plugin not available on iOS
    }

    try {
      Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('keyboard-open');
      });
      Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-open');
      });
    } catch (e) {
      // Keyboard plugin not available
    }

    await SplashScreen.hide();
  }
};

createRoot(document.getElementById("root")!).render(<App />);
initApp();
