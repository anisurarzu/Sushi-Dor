type CategoryTitleProps = {
  id: string;
  children: string;
  className?: string;
  as?: "h2" | "h3";
};

/** Category section heading (plain — no fire effect). */
export function CategoryFireTitle({
  id,
  children,
  className = "",
  as: Tag = "h3",
}: CategoryTitleProps) {
  return (
    <Tag id={`${id}-title`} className={`category-title ${className}`.trim()}>
      {children}
    </Tag>
  );
}
