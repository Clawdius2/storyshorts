"use client";

import { useState } from "react";
import styles from "./CoverArt.module.css";

type CoverArtProps = {
  alt: string;
  src: string;
  title: string;
};

export function CoverArt({ alt, src, title }: CoverArtProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={styles.fallback}>
        <span>{title.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }

  return <img alt={alt} className={styles.image} src={src} onError={() => setHasError(true)} />;
}