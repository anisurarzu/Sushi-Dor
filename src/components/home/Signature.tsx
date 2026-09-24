const promises = [
  {
    title: "Click & collect",
    text: "Commandez en ligne, retirez en restaurant sans attendre.",
  },
  {
    title: "Livraison 7/7",
    text: "À domicile ou au bureau, midi et soir partout en France.",
  },
  {
    title: "Paiement sécurisé",
    text: "Transaction en ligne 100% sécurisée, confirmation immédiate.",
  },
  {
    title: "Préparé à la commande",
    text: "Chaque plat est assemblé au moment où vous validez.",
  },
];

export function Signature() {
  return (
    <section
      id="signature"
      className="relative overflow-hidden border-y border-[color:var(--line)] bg-ink-soft"
    >
      <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
        <div
          className="min-h-[420px] bg-cover bg-center lg:min-h-full"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1600&q=80)",
          }}
        />
        <div className="flex flex-col justify-center px-6 py-16 md:px-12 md:py-24">
          <p className="mb-3 text-[0.72rem] uppercase tracking-[0.28em] text-gold">
            Signature D&apos;or
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-bone md:text-5xl">
            Le plaisir japonais,{" "}
            <span className="gold-text">à la carte</span>
          </h2>
          <p className="mt-5 max-w-md text-mist leading-relaxed">
            Passion, précision et minutie dans chaque restaurant. Des makis
            signature aux plateaux à partager — découvrez l&apos;esprit Sushi
            D&apos;or.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {promises.map((item) => (
              <li key={item.title}>
                <div className="gold-rule mb-3 w-10" />
                <h3 className="text-sm uppercase tracking-[0.14em] text-champagne">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-mist">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
