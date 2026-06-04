import type { Metadata } from "next";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "Blackstone | World's Largest Alternative Asset Manager",
  description: "Blackstone is the world's largest alternative asset manager with $1.3 trillion in assets under management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
