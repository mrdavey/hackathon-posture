import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Hackathon Groq",
  description: "Real-time coach",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
        <Toaster position="top-right" expand />
      </body>
    </html>
  );
}
