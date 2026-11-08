import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";
import SubscriptionModal from "@/components/SubscriptionModal";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "The Fifth Event Agency",
  description:
    "The Fifth Event Agency crafts extraordinary events in Montréal: event planning, corporate events, private celebrations and ticketed experiences.",
};

const PoppinsFont = Poppins({
  subsets: ["latin"],
  weight: "300",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={PoppinsFont.className}>
      <body>
        <LanguageProvider>
          <SubscriptionModal />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}