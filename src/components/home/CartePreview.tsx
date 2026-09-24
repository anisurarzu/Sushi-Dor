const categories = [
  {
    name: "Sushi & Sashimi",
    copy: "Poissons sélectionnés, découpe précise, riz vinaigré parfait.",
    image:
      "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Maki Signature",
    copy: "Rouleaux dorés aux associations audacieuses et classiques.",
    image:
      "https://images.unsplash.com/photo-1617196034798-4e90b20b5393?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Poke & Chirashi",
    copy: "Bols généreux, toppings croquants, sauces maison.",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Plats chauds",
    copy: "Ramen, donburi et soba — réconfort japonais à chaque bol.",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
  },
];

export function CartePreview() {
  return (
    <section id="carte" className="relative bg-ink px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-[0.72rem] uppercase tracking-[0.28em] text-gold">
            La nouvelle carte
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl text-bone md:text-5xl">
            Une sélection <span className="gold-text">prêtieuse</span>
          </h2>
          <p className="mt-4 text-mist">
            Des classiques intemporels aux créations du moment — tout est
            élaboré à la commande pour une fraîcheur absolue.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((item) => (
            <article key={item.name} className="group">
              <div className="relative aspect-[4/5] overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-champagne">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">
                    {item.copy}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12">
          <a href="#commander" className="btn-ghost">
            Voir toute la carte
          </a>
        </div>
      </div>
    </section>
  );
}
