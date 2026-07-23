import type { Metadata } from "next";
import { SampleSizeApp } from "./sample-size-app";

export const metadata: Metadata = {
  title: "StudySize Studio",
  description:
    "Interactive sample size calculators for clinical and research study designs.",
};

export default function Home() {
  return <SampleSizeApp />;
}
