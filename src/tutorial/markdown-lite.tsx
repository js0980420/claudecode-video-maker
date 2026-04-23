import React from "react";
import { BLACK } from "../constants";

type Props = {
  text: string;
  accentColor: string;
};

/**
 * 解析 markdown-lite(**bold**、`code`、[text](url))→ React spans。
 * - **x** → fontWeight 700
 * - `x`  → 等寬字 + 淺底 chip
 * - [x](u) → URL 丟棄,text 以 accent color + underline 呈現
 * - \n    → <br/>
 *
 * 解析策略:一次掃一個 pattern,切字串;互不巢狀(prototype 夠用)。
 */
export const MarkdownLite: React.FC<Props> = ({ text, accentColor }) => {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => (
        <React.Fragment key={li}>
          {renderLine(line, accentColor)}
          {li < lines.length - 1 ? <br /> : null}
        </React.Fragment>
      ))}
    </>
  );
};

function renderLine(line: string, accentColor: string): React.ReactNode[] {
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]*\))/g;
  const parts = line.split(re);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} style={{ fontWeight: 700, color: BLACK }}>
          {part.slice(2, -2)}
        </span>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <span
          key={i}
          style={{
            fontFamily: `"SF Mono", "Menlo", "Consolas", monospace`,
            background: "#F1F1F1",
            padding: "2px 8px",
            borderRadius: 6,
            fontSize: "0.92em",
          }}
        >
          {part.slice(1, -1)}
        </span>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\([^)]*\)$/);
    if (linkMatch) {
      return (
        <span
          key={i}
          style={{
            color: accentColor,
            textDecoration: "underline",
          }}
        >
          {linkMatch[1]}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
