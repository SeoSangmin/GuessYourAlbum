import "./globals.css";

export const metadata = {
  title: "Guess Your Album",
  description: "Create and preview your photo albums",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
