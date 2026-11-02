type BrandMarkProps = {
  size?: "hero" | "header" | "footer";
  className?: string;
};

/**
 * 3D animated gold fish mark — soft float, tilt, and shine sweep.
 */
export function BrandMark({ size = "header", className = "" }: BrandMarkProps) {
  return (
    <span
      className={`brand-mark brand-mark--${size} ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="brand-mark__stage">
        <img
          src="/brand/sushi-dor-mark-3d.jpg"
          alt=""
          className="brand-mark__img"
          width={512}
          height={512}
          decoding="async"
        />
        <span className="brand-mark__shine" />
        <span className="brand-mark__glow" />
      </span>
    </span>
  );
}
