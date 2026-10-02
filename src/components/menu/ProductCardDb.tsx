import Image from "next/image";
import Link from "next/link";
import { formatEuro } from "@/lib/pricing";
import type { HomeProduct } from "@/lib/home-catalog";
import { ProductAddButton } from "@/components/menu/ProductAddButton";

type Props = {
  product: HomeProduct;
  priority?: boolean;
};

const BADGES: {
  key: keyof Pick<
    HomeProduct,
    "isNew" | "isPopular" | "isVegetarian" | "isVegan" | "isSpicy"
  >;
  label: string;
}[] = [
  { key: "isNew", label: "Nouveau" },
  { key: "isPopular", label: "Populaire" },
  { key: "isVegetarian", label: "Végétarien" },
  { key: "isVegan", label: "Vegan" },
  { key: "isSpicy", label: "Épicé" },
];

export function ProductCardDb({ product, priority = false }: Props) {
  const href = `/menu/${product.slug}`;
  const alt = `${product.nameFr} — Sushi D'or`;
  const blurb = product.shortDescription || product.description;
  const badges = BADGES.filter((b) => product[b.key]);

  return (
    <article className="group flex h-full min-w-0 flex-col border border-[color:var(--line)] bg-ink-soft/40 transition-colors hover:border-gold">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-ink-soft">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-mist">
            Sushi D&apos;or
          </div>
        )}
        {badges.length > 0 ? (
          <ul className="absolute left-2 top-2 flex max-w-[90%] flex-wrap gap-1">
            {badges.map((b) => (
              <li
                key={b.key}
                className="bg-ink/85 px-1.5 py-0.5 text-[0.58rem] uppercase tracking-[0.12em] text-gold backdrop-blur-sm"
              >
                {b.label}
              </li>
            ))}
          </ul>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <Link href={href}>
          <h3 className="font-[family-name:var(--font-display)] text-[0.95rem] leading-snug text-bone group-hover:text-champagne sm:text-lg">
            {product.nameFr}
          </h3>
        </Link>
        {blurb ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#c4bbaa] sm:text-sm">
            {blurb}
          </p>
        ) : null}
        <p className="mt-2 text-sm font-medium tabular-nums text-gold">
          {formatEuro(product.priceCents)}
        </p>
        <ProductAddButton
          productId={product.id}
          slug={product.slug}
          requiresCustomization={product.requiresCustomization}
        />
      </div>
    </article>
  );
}
