import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/toaster";
import { UpdateNotification } from "@/components/UpdateNotification";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster />
      <UpdateNotification />
    </>
  );
}
