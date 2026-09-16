import type { Metadata } from "next";
import "./globals.css";

// LANDING-FULL.md §1, browser furniture. No title here — each route sets its
// own. Apple touch / install name is the lowercase wordmark; the icon is a
// flat mono bookmark mark (src/app/icon.svg), never a wordmark at 16px.
export const metadata: Metadata = {
  applicationName: "bkmrks",
  appleWebApp: { title: "bkmrks", capable: true, statusBarStyle: "black-translucent" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        {children}
      </body>
    </html>
  );
}
