import { lightTheme } from "thirdweb/react";

/** Light theme aligned with RemitClaw brand tokens in globals.css */
export const remitClawTheme = lightTheme({
  colors: {
    modalBg: "#ffffff",
    modalOverlayBg: "rgba(15, 15, 20, 0.45)",
    primaryText: "#16161d",
    secondaryText: "#6e6e7e",
    accentText: "#6c2bd9",
    borderColor: "#ecebf2",
    separatorLine: "#ecebf2",
    tertiaryBg: "#f6f5fb",
    primaryButtonBg: "#6c2bd9",
    primaryButtonText: "#ffffff",
    accentButtonBg: "#6c2bd9",
    accentButtonText: "#ffffff",
    secondaryButtonBg: "#f6f5fb",
    secondaryButtonText: "#16161d",
    secondaryButtonHoverBg: "#ede7fe",
    connectedButtonBg: "#f6f5fb",
    connectedButtonBgHover: "#ede7fe",
    selectedTextBg: "#e7dcff",
    selectedTextColor: "#4a1d96",
    tooltipBg: "#16161d",
    tooltipText: "#ffffff",
  },
  fontFamily:
    'var(--font-jakarta), "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
});
