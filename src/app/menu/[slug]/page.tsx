import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import {
  formatEuro,
  getCategoryBySlug,
  getProductBySlug,
  menuData,
} from "@/lib/menu";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return menuData.products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Produit · Sushi D'or" };
  return {
    title: `${product.nameFr} · Sushi D'or`,
    description: product.description ?? `${product.nameFr} — Sushi D'or`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const category = getCategoryBySlug(product.categorySlug);

  return (
    <main className="bg-ink text-bone">
      <div className="relative">
        <SiteHeader />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-14 pt-28 sm:gap-10 sm:px-6 sm:pb-20 sm:pt-32 md:grid-cols-2 md:px-10 md:pb-28">
          <div
            className="aspect-[4/3] bg-cover bg-center sm:aspect-auto sm:min-h-[360px] md:min-h-[520px]"
            style={{ backgroundImage: `url(${product.imageUrl})` }}
            role="img"
            aria-label={product.nameFr}
          />
          <div className="flex flex-col justify-center">
            {category ? (
              <Link
                href={`/menu#${category.slug}`}
                className="mb-3 text-[0.65rem] uppercase tracking-[0.24em] text-gold hover:text-gold-bright sm:mb-4 sm:text-[0.72rem] sm:tracking-[0.28em]"
              >
                {category.nameFr}
              </Link>
            ) : null}
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-bone sm:text-4xl md:text-5xl">
              {product.nameFr}
            </h1>
            <p className="mt-3 text-xl text-gold sm:mt-4 sm:text-2xl">
              {formatEuro(product.priceCents)}
            </p>
            {product.description ? (
              <p className="mt-4 text-sm leading-relaxed text-mist sm:mt-6 sm:text-base">
                {product.description}
              </p>
            ) : null}
            <p className="mt-6 border border-[color:var(--line)] px-3 py-2.5 text-xs text-mist sm:mt-8 sm:px-4 sm:py-3 sm:text-sm">
              This site is under construction — la commande en ligne arrive
              bientôt.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">
              <Link href="/menu" className="btn-ghost">
                Retour à la carte
              </Link>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
