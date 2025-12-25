
import localFont from "next/font/local";

export const rubik = localFont({
  src: [
    {
      path: "../public/assets/fonts/Rubik-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/Rubik-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/Rubik-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/Rubik-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/Rubik-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/Rubik-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-rubik",
});

export const spaceMono = localFont({
  src: "../public/assets/fonts/SpaceMono-Regular.ttf",
  variable: "--font-space-mono",
  weight: "400",
});
