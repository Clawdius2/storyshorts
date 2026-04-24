import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Manrope } from "next/font/google";
import { Header } from "@/components/Header";
import { PersistentPlayer } from "@/components/player/PersistentPlayer";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import "./globals.css";

const headingFont = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "StoryShorts",
  description: "Cinematic short-story audio streaming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
        <body>
          <PlayerProvider>
            <div className="siteShell">
              <Header />
              <main className="siteMain">{children}</main>
            </div>
            <PersistentPlayer />
          </PlayerProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
