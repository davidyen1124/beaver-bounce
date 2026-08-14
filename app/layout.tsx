import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beaver Bounce",
  description: "A cheerful beaver bouncing around the screen.",
  icons: {
    icon: "/beaver.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
