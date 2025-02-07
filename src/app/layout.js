import "./globals.css";

export const metadata = {
  title: "Milankovic Visualization",
  description: "Milankovic Visualization",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
