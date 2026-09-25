import Link from "next/link";
import { formatEuro } from "@/lib/pricing";

type Props = {
  product: {
    slug: string;
    nameFr: string;
    description: string | null;
    priceCents: number;
    imageUrl: string | null;
    requiresCustomization: boolean;
  };
};

export function ProductCardDb({ product }: Props) {
  return (
    <article className="group flex flex-col border border-[color:var(--line)] transition-colors hover:border-gold">
      <Link href={`/menu/${product.slug}`} className="block">
        <div
          className="aspect-square bg-cover bg-center sm:aspect-[16/10]"
          style={{
            backgroundImage: product.imageUrl
              ? `url(${product.imageUrl})`
              : undefined,
          }}
        />
      </Link>
      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <Link href={`/menu/${product.slug}`}>
          <h3 className="font-[family-name:var(--font-display)] text-[0.92rem] leading-snug text-bone group-hover:text-champagne sm:text-lg">
            {product.nameFr}
          </h3>
        </Link>
        <p className="mt-1.5 text-[0.72rem] font-medium text-gold sm:text-sm">
          {formatEuro(product.priceCents)}
        </p>
        {product.description ? (
          <p className="mt-1.5 hidden text-sm text-mist sm:line-clamp-2 sm:block">
            {product.description}
          </p>
        ) : null}
        <Link
          href={`/menu/${product.slug}`}
          className="mt-3 inline-flex text-[0.62rem] uppercase tracking-[0.14em] text-gold hover:text-gold-bright"
        >
          {product.requiresCustomization ? "Personnaliser" : "Ajouter"}
        </Link>
      </div>
    </article>
  );
}
