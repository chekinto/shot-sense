import type { Metadata, Viewport } from "next";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import "@/styles/globals.css";

export const metadata: Metadata = {
  applicationName: "Shot Sense",
  title: {
    default: "Shot Sense",
    template: "%s · Shot Sense",
  },
  description: "Understand where your score is really going.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Shot Sense",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1f7a4d" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
