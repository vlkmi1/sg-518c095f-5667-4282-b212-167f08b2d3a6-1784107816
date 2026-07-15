import "@/styles/globals.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";

// Import browser-only components with ssr: false to prevent hydration errors
const UpdateNotification = dynamic(
  () => import("@/components/UpdateNotification").then((mod) => mod.UpdateNotification),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Header />
      <Component {...pageProps} />
      <Footer />
      <MobileNav />
      <Toaster />
      <UpdateNotification />
    </ThemeProvider>
  );
}
