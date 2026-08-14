import localFont from "next/font/local";

// Space Grotesk — primary UI/body typeface (full charset, variable weight).
export const spaceGrotesk = localFont({
  src: "./fonts/SpaceGrotesk-Variable.ttf",
  variable: "--font-sans",
  display: "swap",
  weight: "300 700",
});

// "Medium" — bold, all-caps display face used sparingly for hero titles and
// big stat/rank numbers, never for body copy (it has no lowercase glyphs).
export const mediumDisplay = localFont({
  src: "./fonts/Medium-Display.otf",
  variable: "--font-display",
  display: "swap",
  weight: "700",
});
