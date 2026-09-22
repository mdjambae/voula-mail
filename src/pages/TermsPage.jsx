export default function TermsPage() {
  return (
    <div className="container-page py-20 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-mist-50 tracking-tight mb-2">
        Conditions d'utilisation et de vente
      </h1>
      <p className="text-xs text-mist-400 mb-10">Dernière mise à jour : 22 septembre 2026</p>

      <div className="prose prose-invert prose-sm max-w-none text-mist-300 leading-relaxed space-y-6">
        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">1. Objet</h2>
          <p>
            Les présentes conditions régissent l'accès et l'utilisation du service VOULA Mail
            (le « Service »), édité par VOULA LLC, société à responsabilité limitée (Limited
            Liability Company) constituée dans l'État du Wyoming, États-Unis, dont le siège
            social est établi au 30 N Gould St Ste R, Sheridan, WY 82801, États-Unis, ci-après
            « VOULA », ainsi que les ventes de fonctionnalités payantes proposées via le
            Service. En utilisant le Service, vous acceptez pleinement les présentes conditions.
          </p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">2. Description du service</h2>
          <p><strong>Scan de sécurité e-mail (gratuit) :</strong> VOULA Mail analyse les
          enregistrements DNS publics d'un domaine (SPF, DKIM, DMARC, DNSSEC, MTA-STS, TLS-RPT,
          BIMI) et affiche un score ainsi que des recommandations. Cette fonctionnalité est
          gratuite et sans limite de nombre de scans.</p>
          <p><strong>Rapport PDF et fonctionnalités payantes :</strong> certaines fonctionnalités
          (génération de rapport PDF détaillé, et toute autre fonctionnalité identifiée comme
          payante dans l'application) sont proposées contre paiement, dans les conditions
          décrites à l'article 5.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">3. Nature du service — avertissement important</h2>
          <p>Le scan VOULA Mail constitue un instantané de la configuration DNS publique d'un
          domaine, au moment précis de l'analyse. Il ne constitue <strong>ni un audit de sécurité
          complet, ni une garantie</strong> que le domaine analysé est exempt de toute
          vulnérabilité, ni une confirmation qu'une adresse e-mail précise existe réellement.
          Les enregistrements DNS pouvant évoluer, les résultats doivent être considérés comme
          indicatifs et non permanents.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">4. Compte utilisateur</h2>
          <p>Certaines fonctionnalités nécessitent la création d'un compte. Vous êtes responsable
          de la confidentialité de vos identifiants et de toute activité réalisée depuis votre
          compte. Vous vous engagez à fournir des informations exactes lors de la création de
          votre compte.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">5. Prix, commande et paiement</h2>
          <p>Les prix des fonctionnalités payantes sont indiqués en euros (ou dans la devise
          applicable) toutes taxes comprises, avant validation de votre commande. Le paiement est
          traité intégralement par notre partenaire <strong>Paddle.com Market Limited</strong>,
          qui agit en tant que revendeur officiel (Merchant of Record) : c'est Paddle qui vous
          facture, collecte le paiement, et gère la TVA/taxes applicables selon votre pays. VOULA
          n'a accès à aucune donnée de carte bancaire. En procédant au paiement, vous acceptez
          également les conditions générales de Paddle, disponibles sur paddle.com.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">6. Droit de rétractation et remboursement</h2>
          <p>Conformément à la réglementation applicable au contenu numérique, le rapport PDF et
          les autres fonctionnalités payantes sont délivrés immédiatement après votre commande.
          En procédant au paiement, vous consentez expressément à cette exécution immédiate et
          reconnaissez que votre droit de rétractation de 14 jours, lorsqu'il s'applique en
          principe, prend fin dès la mise à disposition du contenu numérique commandé.
          <strong> En conséquence, aucun remboursement n'est possible une fois le rapport ou la
          fonctionnalité payante généré(e) et délivré(e).</strong> Si vous rencontrez un problème
          technique empêchant la délivrance effective du contenu que vous avez payé, contactez-nous
          à <a href="mailto:audit@voula.tech">audit@voula.tech</a> : ce cas précis (non-délivrance
          du fait d'un dysfonctionnement du Service) sera examiné indépendamment de la présente
          clause.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">7. Utilisation autorisée</h2>
          <p>Vous vous engagez à utiliser le Service uniquement à des fins légitimes, notamment
          pour auditer des domaines que vous possédez, gérez, ou pour lesquels vous disposez
          d'une autorisation d'analyse. Il est interdit d'utiliser le Service à des fins de
          reconnaissance préalable à une attaque, de harcèlement, ou de toute activité illégale.
          Toute utilisation automatisée abusive susceptible de perturber le fonctionnement du
          Service ou des résolveurs DNS tiers est interdite.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">8. Propriété intellectuelle</h2>
          <p>Le Service, son code, sa marque, son logo et son contenu sont la propriété de VOULA
          ou de ses concédants. Le rapport PDF généré vous est concédé pour votre usage propre ou
          celui de votre client, mais VOULA conserve l'ensemble des droits sur l'outil et sa
          méthodologie.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">9. Limitation de responsabilité</h2>
          <p>Le Service est fourni « en l'état ». Dans les limites permises par la loi, VOULA ne
          saurait être tenu responsable des décisions prises sur la base des résultats du scan,
          ni des dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le
          Service. La responsabilité de VOULA, si elle devait être engagée, est limitée au montant
          effectivement payé par vous pour la fonctionnalité concernée au cours des 12 derniers
          mois.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">10. Résiliation</h2>
          <p>Vous pouvez cesser d'utiliser le Service à tout moment. VOULA se réserve le droit de
          suspendre ou de résilier l'accès d'un utilisateur en cas de violation des présentes
          conditions.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">11. Modifications</h2>
          <p>VOULA peut modifier les présentes conditions à tout moment. La version applicable est
          celle en vigueur au moment de votre utilisation du Service. En cas de modification
          substantielle affectant les fonctionnalités payantes, les utilisateurs seront informés
          par un moyen raisonnable.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">12. Droit applicable</h2>
          <p>Les présentes conditions sont régies par le droit de l'État du Wyoming, États-Unis,
          sans égard aux principes de conflits de lois, et tout litige relatif aux présentes sera
          soumis à la compétence exclusive des tribunaux compétents de cet État, sous réserve du
          paragraphe suivant.</p>
          <p>Si vous résidez dans l'Union européenne, au Royaume-Uni, ou dans tout autre pays dont
          la législation vous accorde des droits impératifs de protection du consommateur
          auxquels il ne peut être renoncé par contrat, les présentes conditions n'ont pas pour
          effet de vous priver de la protection que vous garantissent les dispositions
          impératives du droit de votre pays de résidence habituelle, qui demeurent applicables
          nonobstant ce qui précède.</p>
          <p className="text-xs text-mist-400">Cette clause a été rédigée de façon standard compte
          tenu de la clientèle internationale de VOULA (Amérique du Nord, Royaume-Uni, Europe,
          Afrique). Une relecture par un conseil juridique est recommandée avant tout volume de
          vente significatif.</p>
        </section>

        <section>
          <h2 className="text-mist-50 font-semibold text-lg mb-2">13. Contact</h2>
          <p>Pour toute question relative aux présentes conditions : <a href="mailto:audit@voula.tech">audit@voula.tech</a></p>
        </section>
      </div>
    </div>
  );
}
