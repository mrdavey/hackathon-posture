import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Posture Coach",
  description: "Real-time posture coach with Groq and Next.js App Router",
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
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
