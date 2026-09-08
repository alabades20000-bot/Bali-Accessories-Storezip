import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { fastImage, imageSrcSet, tinyImage } from "@/lib/img";

const loadedOnce = new Set<string>();

type Props = {
  src: string | null | undefined;
  alt: string;
  width: number;
  height?: number;
  sizes?: string;
  widths?: number[];
  className?: string;
  wrapperClassName?: string;
  /** Above-the-fold image: loads immediately with high priority. */
  eager?: boolean;
  fallbacks?: string[];
  onFail?: () => void;
};

export function SmartImage({
  src,
  alt,
  width,
  height,
  sizes,
  widths,
  className = "",
  wrapperClassName = "",
  eager = false,
  fallbacks = [],
  onFail,
}: Props) {
  const key = src ?? "";
  const [step, setStep] = useState(0); // 0 = optimized, then fallbacks chain
  const [loaded, setLoaded] = useState(() => loadedOnce.has(key));
  const [broken, setBroken] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setStep(0);
    setBroken(false);
    setLoaded(loadedOnce.has(key));
  }, [key]);

  useEffect(() => {
    // If the image is already in the browser cache, skip the fade.
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) {
      loadedOnce.add(key);
      setLoaded(true);
    }
  }, [key, step]);

  const ratio = `${width} / ${height ?? width}`;

  if (!src || broken) {
    return (
      <span
        className={`relative block overflow-hidden bg-secondary/40 ${wrapperClassName}`}
        style={{ aspectRatio: ratio }}
      >
        <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <ImageOff className="size-8" />
        </span>
      </span>
    );
  }

  const chain = [fastImage(src, width) as string, src, ...fallbacks];
  const current = chain[Math.min(step, chain.length - 1)];
  const placeholder = tinyImage(src);
  const srcSet = step === 0 ? imageSrcSet(src, widths ?? [width]) : undefined;

  return (
    <span
      className={`relative block overflow-hidden ${wrapperClassName}`}
      style={{ aspectRatio: ratio }}
    >
      {placeholder && !loaded && (
        <img
          src={placeholder}
          alt=""
          aria-hidden
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full scale-110 object-cover blur-xl"
        />
      )}
      {!placeholder && !loaded && (
        <span className="absolute inset-0 animate-pulse bg-secondary/50" />
      )}
      <img
        ref={imgRef}
        src={current}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height ?? width}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "low"}
        decoding="async"
        onLoad={() => {
          loadedOnce.add(key);
          setLoaded(true);
        }}
        onError={() => {
          if (step < chain.length - 1) setStep((s) => s + 1);
          else {
            setBroken(true);
            onFail?.();
          }
        }}
        className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}
