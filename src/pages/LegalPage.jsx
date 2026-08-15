export default function LegalPage({ title, updatedAt = 'Août 2026' }) {
  return (
    <div className="container-page py-20 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-mist-50 tracking-tight mb-2">{title}</h1>
      <p className="text-xs text-mist-400 mb-10">Dernière mise à jour : {updatedAt}</p>
      <div className="prose prose-invert prose-sm max-w-none text-mist-300 leading-relaxed space-y-4">
        <p>
          Ce contenu est un espace réservé. Remplacez-le par le texte juridique définitif de
          VOULA Mail (mentions légales, politique de confidentialité, CGU) avant la mise en
          production.
        </p>
      </div>
    </div>
  );
}
