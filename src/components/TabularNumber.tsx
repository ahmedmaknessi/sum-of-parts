import type React from "react";

type TabularNumberProps = {
  /** Already formatted text, e.g. "$262,481" or "Month 480". */
  readonly text: string;
  /** Width of one digit cell. Outfit has no tabular figures, so digits get fixed cells. */
  readonly digitWidth?: string;
};

/** Renders text with every digit in a fixed-width cell, so counting numbers never jitter. */
export const TabularNumber: React.FC<TabularNumberProps> = ({ text, digitWidth = "0.6em" }) => (
  <>
    {text.split("").map((char, i) =>
      /\d/.test(char) ? (
        <span key={i} style={{ display: "inline-block", width: digitWidth, textAlign: "center" }}>
          {char}
        </span>
      ) : (
        <span key={i}>{char}</span>
      ),
    )}
  </>
);
