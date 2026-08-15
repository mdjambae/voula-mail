/**
 * providerGuides.js
 * ------------------------------------------------------------------
 * Base de connaissances utilisée pour personnaliser les recommandations
 * du rapport : où se connecter pour modifier la zone DNS (hébergeur /
 * registrar), et quelles particularités connaître selon le fournisseur
 * de messagerie détecté (valeur d'inclusion SPF, procédure DKIM, etc.).
 *
 * Volontairement structuré comme une base de données simple : ajouter
 * un fournisseur = ajouter une entrée, sans toucher au moteur de
 * détection ni au générateur de rapport.
 * ------------------------------------------------------------------
 */

/** Où et comment modifier la zone DNS, par hébergeur / registrar. */
export const DNS_HOST_GUIDES = {
  ovh: {
    label: 'OVH',
    login: 'Connectez-vous sur manager.ovh.com.',
    navigate: 'Menu "Web Cloud" > "Noms de domaine" > sélectionnez le domaine > onglet "Zone DNS".',
    addRecord: 'Cliquez sur "Ajouter une entrée", choisissez le type d\'enregistrement demandé, renseignez le sous-domaine et la valeur, puis validez.',
  },
  lws: {
    label: 'LWS',
    login: 'Connectez-vous sur espace-client.lws.fr.',
    navigate: 'Rubrique "Mes noms de domaine" > sélectionnez le domaine > "Zone DNS".',
    addRecord: 'Cliquez sur "Ajouter un enregistrement", choisissez le type, renseignez le nom et la valeur, puis enregistrez. La propagation peut prendre jusqu\'à 24h chez LWS.',
  },
  cloudflare: {
    label: 'Cloudflare',
    login: 'Connectez-vous sur dash.cloudflare.com.',
    navigate: 'Sélectionnez le domaine, puis l\'onglet "DNS" > "Records".',
    addRecord: 'Cliquez sur "Add record", choisissez le type, renseignez le nom et le contenu. Désactivez le proxy (nuage orange → gris) pour les enregistrements TXT, MX et CNAME liés à l\'e-mail, puis enregistrez.',
  },
  godaddy: {
    label: 'GoDaddy',
    login: 'Connectez-vous sur godaddy.com > "Mes produits".',
    navigate: 'Sélectionnez le domaine > "DNS" > "Gérer les enregistrements DNS".',
    addRecord: 'Cliquez sur "Ajouter", choisissez le type, renseignez l\'hôte et la valeur, puis enregistrez.',
  },
  gandi: {
    label: 'Gandi',
    login: 'Connectez-vous sur admin.gandi.net.',
    navigate: 'Sélectionnez le domaine > onglet "Enregistrements DNS".',
    addRecord: 'Cliquez sur "Ajouter un enregistrement", choisissez le type, renseignez le nom et la valeur, puis validez.',
  },
  ionos: {
    label: 'IONOS',
    login: 'Connectez-vous sur ionos.fr > espace client.',
    navigate: 'Menu "Domaines & SSL" > sélectionnez le domaine > "DNS".',
    addRecord: 'Cliquez sur "Ajouter un enregistrement", choisissez le type, renseignez le nom et la valeur, puis enregistrez.',
  },
  infomaniak: {
    label: 'Infomaniak',
    login: 'Connectez-vous sur manager.infomaniak.com.',
    navigate: 'Sélectionnez le domaine > "Zone DNS".',
    addRecord: 'Cliquez sur "Ajouter un enregistrement", choisissez le type, renseignez le nom et la valeur, puis enregistrez.',
  },
  generic: {
    label: 'votre hébergeur DNS',
    login: 'Connectez-vous à l\'espace de gestion de votre hébergeur ou registrar (le service qui a enregistré ou héberge votre nom de domaine).',
    navigate: 'Repérez la section "Zone DNS", "DNS Manager" ou "Gestion DNS" du domaine concerné.',
    addRecord: 'Ajoutez un enregistrement du type demandé (TXT, CNAME, MX...) avec le nom et la valeur indiqués, puis enregistrez. La propagation peut prendre de quelques minutes à 24h.',
  },
};

/**
 * Particularités par fournisseur de messagerie : valeur SPF à inclure,
 * procédure d'activation DKIM, remarques DMARC/MTA-STS spécifiques.
 * `null` signifie qu'il n'y a pas de particularité connue pour ce
 * protocole chez ce fournisseur (la recommandation générique suffit).
 */
export const EMAIL_PROVIDER_NOTES = {
  google_workspace: {
    label: 'Google Workspace',
    spf: 'Incluez `include:_spf.google.com` dans votre enregistrement SPF.',
    dkim: 'Dans la Console d\'administration Google (admin.google.com) : Applications > Google Workspace > Gmail > "Authentification des e-mails", générez la clé DKIM (sélecteur "google"), publiez l\'enregistrement TXT fourni, puis revenez activer l\'authentification.',
    dmarc: null,
    'mta-sts': null,
  },
  microsoft365: {
    label: 'Microsoft 365',
    spf: 'Incluez `include:spf.protection.outlook.com` dans votre enregistrement SPF.',
    dkim: 'Dans le Centre d\'administration Microsoft 365 (admin.microsoft.com) > Exchange > "Flux de messagerie" > DKIM, activez la signature pour le domaine : deux enregistrements CNAME (selector1/selector2._domainkey) vous seront fournis à publier chez votre hébergeur DNS.',
    dmarc: null,
    'mta-sts': null,
  },
  zoho: {
    label: 'Zoho Mail',
    spf: 'Incluez `include:zoho.eu` (zone Europe) ou `include:zoho.com` (zone US) selon la région de votre compte Zoho.',
    dkim: 'Dans la console Zoho Mail Admin (mailadmin.zoho.com) > Domaines > votre domaine > "Authentification des e-mails" > DKIM, générez le sélecteur puis publiez le TXT fourni.',
    dmarc: null,
    'mta-sts': null,
  },
  brevo: {
    label: 'Brevo (ex-Sendinblue)',
    spf: 'Incluez `include:spf.brevo.com` dans votre enregistrement SPF.',
    dkim: 'Dans Brevo (app.brevo.com) > Expéditeurs, domaines & désirabilité > Domaines, cliquez sur "Authentifier ce domaine" : les enregistrements DKIM et DMARC à publier vous seront fournis.',
    dmarc: null,
    'mta-sts': null,
  },
  mailgun: {
    label: 'Mailgun',
    spf: 'Incluez `include:mailgun.org` dans votre enregistrement SPF.',
    dkim: 'Dans le tableau de bord Mailgun (app.mailgun.com) > Sending > "Domain settings" > "DNS records", publiez les enregistrements TXT DKIM et SPF fournis pour ce domaine.',
    dmarc: null,
    'mta-sts': null,
  },
  sendgrid: {
    label: 'SendGrid',
    spf: 'Incluez `include:sendgrid.net` dans votre enregistrement SPF.',
    dkim: 'Dans SendGrid (app.sendgrid.com) > Settings > "Sender Authentication", lancez l\'authentification de domaine pour obtenir les enregistrements CNAME DKIM à publier.',
    dmarc: null,
    'mta-sts': null,
  },
  ovh: {
    label: 'OVH (MX Plan / Exchange)',
    spf: null,
    dkim: 'Si votre messagerie est hébergée chez OVH (MX Plan ou Exchange), activez DKIM depuis l\'espace "Emails" > votre domaine > "Configurer DKIM", puis publiez l\'enregistrement fourni dans la zone DNS.',
    dmarc: null,
    'mta-sts': null,
  },
  lws: {
    label: 'LWS Mail',
    spf: null,
    dkim: 'Si vous utilisez la messagerie LWS, vérifiez dans l\'espace "Email" de votre offre si l\'activation DKIM est proposée ; selon l\'offre souscrite, un ticket au support LWS peut être nécessaire pour obtenir la clé.',
    dmarc: null,
    'mta-sts': null,
  },
};
