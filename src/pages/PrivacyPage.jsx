export default function PrivacyPage() {
  return (
    <div className="container-page py-20 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-mist-50 tracking-tight mb-2">
        Politique de confidentialité
      </h1>
      <p className="text-xs text-mist-400 mb-10">Dernière mise à jour : 22 septembre 2026</p>

      <div className="prose prose-invert prose-sm max-w-none text-mist-300 leading-relaxed space-y-6">
        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">1. Qui nous sommes</h2>
          <p>
            VOULA Mail est édité par VOULA LLC, société à responsabilité limitée (Limited
            Liability Company) constituée dans l'État du Wyoming, États-Unis, dont le siège
            social est établi au 30 N Gould St Ste R, Sheridan, WY 82801, États-Unis. Pour toute
            question relative à vos données personnelles, contactez-nous à <a href="mailto:audit@voula.tech">audit@voula.tech</a>.
          </p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">2. Données que nous traitons</h2>
          <p><strong>Scan de domaine :</strong> lorsque vous saisissez un nom de domaine, l'analyse
          interroge directement les résolveurs DNS publics (Cloudflare, Google) depuis votre
          propre navigateur. Le domaine scanné n'est pas envoyé à nos serveurs ni conservé par
          nous — l'ensemble du traitement se fait localement, dans votre navigateur.</p>
          <p><strong>Rapport PDF :</strong> le rapport est généré directement dans votre navigateur
          et téléchargé sur votre appareil. Nous n'en conservons aucune copie sur nos serveurs.</p>
          <p><strong>Formulaire de contact :</strong> si vous nous contactez, nous collectons le nom,
          l'adresse e-mail et le message que vous nous transmettez volontairement, dans le seul
          but de vous répondre.</p>
          <p><strong>Compte utilisateur :</strong> si vous créez un compte, nous traitons l'adresse
          e-mail et les informations d'identification associées à ce compte.</p>
          <p><strong>Paiement :</strong> les paiements pour les fonctionnalités payantes sont traités
          intégralement par notre partenaire de paiement Paddle.com Market Limited, qui agit en
          tant que revendeur officiel (Merchant of Record). Nous ne recevons ni ne stockons jamais
          vos coordonnées bancaires ou de carte — voir la politique de confidentialité de Paddle
          pour le détail du traitement de vos données de paiement.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">3. Base légale et finalités</h2>
          <p>Nous traitons ces données sur les bases suivantes (RGPD, art. 6) : l'exécution du
          contrat qui nous lie à vous (fourniture du service, traitement de votre commande),
          notre intérêt légitime (répondre à vos demandes, assurer la sécurité du service), et
          votre consentement lorsque celui-ci est requis (ex : newsletter, si applicable).</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">4. Partage des données</h2>
          <p>Nous ne vendons ni ne louons vos données personnelles à des tiers. Elles peuvent être
          partagées avec : Paddle.com Market Limited (traitement des paiements), les résolveurs
          DNS publics Cloudflare et Google (uniquement le nom de domaine scanné, en requête
          directe depuis votre navigateur, sans passer par nos serveurs), et tout prestataire
          technique strictement nécessaire au fonctionnement du service (hébergement).</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">5. Durée de conservation</h2>
          <p>Les données de compte sont conservées tant que le compte reste actif, puis supprimées
          dans un délai raisonnable après sa clôture. Les données du formulaire de contact sont
          conservées le temps nécessaire au traitement de votre demande. Les données de
          facturation sont conservées conformément aux obligations légales comptables
          applicables (généralement 10 ans en France).</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">6. Vos droits</h2>
          <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
          d'effacement, de limitation, de portabilité et d'opposition sur vos données
          personnelles. Vous pouvez exercer ces droits en nous contactant à
          <a href="mailto:audit@voula.tech"> audit@voula.tech</a>. Vous disposez également du
          droit d'introduire une réclamation auprès de la CNIL (cnil.fr) ou de l'autorité de
          protection des données compétente dans votre pays de résidence.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">7. Cookies</h2>
          <p>VOULA Mail n'utilise aucun cookie ni traceur non essentiel — pas d'outil de mesure
          d'audience, pas de publicité, pas de pixel de suivi. Seuls d'éventuels cookies
          strictement techniques, nécessaires au fonctionnement du site lui-même (par exemple le
          maintien de votre session si vous êtes connecté), peuvent être déposés ; ceux-ci ne
          nécessitent pas de consentement au titre de la réglementation applicable.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">8. Transferts internationaux</h2>
          <p>Certains de nos prestataires (notamment Paddle.com Market Limited, ainsi que les
          résolveurs DNS publics utilisés pour le scan) peuvent traiter des données en dehors de
          l'Union européenne. Ces transferts s'appuient sur les garanties appropriées prévues par
          le RGPD (clauses contractuelles types ou décision d'adéquation, selon le prestataire).</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">9. Sécurité</h2>
          <p>Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour
          protéger vos données. Aucune transmission sur internet n'est toutefois totalement
          sécurisée à 100 %, et nous ne pouvons garantir une sécurité absolue.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">10. Modifications</h2>
          <p>Cette politique peut être mise à jour. La date de dernière mise à jour figure en haut
          de cette page. En cas de changement substantiel, nous vous en informerons par un moyen
          raisonnable (bannière sur le site, e-mail si vous avez un compte).</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">11. Contact</h2>
          <p>Pour toute question relative à cette politique : <a href="mailto:audit@voula.tech">audit@voula.tech</a></p>
        </section>
      </div>
    </div>
  );
}
