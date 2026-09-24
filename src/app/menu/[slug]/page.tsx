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
        <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-32 md:grid-cols-2 md:px-10 md:pb-28">
          <div
            className="min-h-[320px] bg-cover bg-center md:min-h-[520px]"
            style={{ backgroundImage: `url(${product.imageUrl})` }}
            role="img"
            aria-label={product.nameFr}
          />
          <div className="flex flex-col justify-center">
            {category ? (
              <Link
                href={`/menu#${category.slug}`}
                className="mb-4 text-[0.72rem] uppercase tracking-[0.28em] text-gold hover:text-gold-bright"
              >
                {category.nameFr}
              </Link>
            ) : null}
            <h1 className="font-[family-name:var(--font-display)] text-4xl text-bone md:text-5xl">
              {product.nameFr}
            </h1>
            <p className="mt-4 text-2xl text-gold">
              {formatEuro(product.priceCents)}
            </p>
            {product.description ? (
              <p className="mt-6 leading-relaxed text-mist">
                {product.description}
              </p>
            ) : null}
            <p className="mt-8 border border-[color:var(--line)] px-4 py-3 text-sm text-mist">
              This site is under construction — la commande en ligne arrive
              bientôt.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
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
