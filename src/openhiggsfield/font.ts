import { Instrument_Sans } from "next/font/google";

/* Futuru's own face, shared by the studio and the sign-in page. Variable, so
   the in-between weights the studio uses (550, 620) render true. */
export const studioFont = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-ohf-ui",
  display: "swap",
});
