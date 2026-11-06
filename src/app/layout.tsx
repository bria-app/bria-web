import "./globals.css";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["600", "700", "800"],
});
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", weight: ["400", "500"] });

const fontVars = `${sans.variable} ${display.variable} ${mono.variable}`;

// Restore the color mode and motion preference before first paint so nothing flashes, and keep
// «Como el sistema» following the OS while the app is open.
const appearanceBootstrap = `(function(){try{var d=document.documentElement,s=localStorage,q=matchMedia("(prefers-color-scheme: dark)"),m=s.getItem("dss-mode")||"light";if(m==="system"){m=q.matches?"dark":"light"}d.setAttribute("data-mode",m);d.setAttribute("data-motion",s.getItem("dss-motion")||"full");q.addEventListener("change",function(e){if(s.getItem("dss-mode")==="system")d.setAttribute("data-mode",e.matches?"dark":"light")})}catch(e){}})();`;

export const metadata = {
  title: { default: "bria.", template: "%s · bria." },
  description: "Ventas, inventario y pronóstico de demanda para tu tienda.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-mode="light" data-motion="full" className={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceBootstrap }} />
      </head>
      {/* Browser extensions add attributes to <body> before React loads (e.g. location="…"): not a real mismatch. */}
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
