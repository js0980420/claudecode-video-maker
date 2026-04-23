import React from "react";
import { Img, staticFile } from "remotion";
import { ImageBlock as ImageBlockType } from "../types";

type Props = { block: ImageBlockType };

export const ImageBlock: React.FC<Props> = ({ block }) => (
  <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
    <Img
      src={staticFile(block.src)}
      alt={block.alt}
      style={{
        maxWidth: "100%",
        maxHeight: 560,
        borderRadius: 12,
        boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
        objectFit: "contain",
      }}
    />
  </div>
);
