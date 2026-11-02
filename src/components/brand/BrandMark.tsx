type BrandMarkProps = {
  size?: "hero" | "header" | "footer";
  className?: string;
};

/**
 * Professional 3D gold fish mark — extruded depth layers, orbit, and light sweep.
 */
export function BrandMark({ size = "header", className = "" }: BrandMarkProps) {
  return (
    <span
      className={`brand-mark brand-mark--${size} ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="brand-mark__perspective">
        <span className="brand-mark__stage">
          {/* Extrusion stack for solid 3D depth */}
          <span className="brand-mark__depth brand-mark__depth--3" />
          <span className="brand-mark__depth brand-mark__depth--2" />
          <span className="brand-mark__depth brand-mark__depth--1" />
          <img
            src="/brand/sushi-dor-mark.png"
            alt=""
            className="brand-mark__img"
            width={933}
            height={528}
            decoding="async"
            fetchPriority="high"
          />
          <span className="brand-mark__specular" />
          <span className="brand-mark__rim" />
        </span>
      </span>
    </span>
  );
}
