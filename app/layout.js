import "./globals.css";

export const metadata = {
  title: "HypePanda by Digistick",
  description: "Where brands and creators find each other. Playful. Verified. Hype.",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FBF3E4",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
