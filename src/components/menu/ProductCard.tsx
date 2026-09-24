import Link from "next/link";
import { formatEuro, type MenuProduct } from "@/lib/menu";

type Props = {
  product: MenuProduct;
  variant?: "menu" | "featured";
};

export function ProductCard({ product, variant = "menu" }: Props) {
  if (variant === "featured") {
    return (
      <Link href={`/menu/${product.slug}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden sm:aspect-[4/5]">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${product.imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-4 md:p-5">
            <h3 className="font-[family-name:var(--font-display)] text-[0.95rem] leading-tight text-champagne sm:text-xl md:text-2xl">
              {product.nameFr}
            </h3>
            <p className="mt-1 text-[0.7rem] text-gold sm:mt-2 sm:text-sm">
              {formatEuro(product.priceCents)}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/menu/${product.slug}`}
      className="group flex flex-col border border-[color:var(--line)] transition-colors hover:border-gold"
    >
      <div
        className="aspect-square bg-cover bg-center sm:aspect-[16/10]"
        style={{ backgroundImage: `url(${product.imageUrl})` }}
      />
      <div className="flex flex-1 flex-col p-2.5 sm:p-4 md:p-5">
        <h3 className="font-[family-name:var(--font-display)] text-[0.92rem] leading-snug text-bone group-hover:text-champagne sm:text-lg md:text-xl">
          {product.nameFr}
        </h3>
        <p className="mt-1.5 text-[0.72rem] font-medium text-gold sm:mt-2 sm:text-sm">
          {formatEuro(product.priceCents)}
        </p>
        {product.description ? (
          <p className="mt-1.5 hidden text-sm text-mist sm:mt-2 sm:line-clamp-2 sm:block">
            {product.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
