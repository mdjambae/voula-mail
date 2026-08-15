const STATS = [
  { value: '3,4 Md$', label: 'perdus chaque année dans le monde à cause du phishing par e-mail (FBI IC3)' },
  { value: '90%', label: "des cyberattaques commencent par un e-mail" },
  { value: '1 domaine sur 5', label: 'sans politique DMARC restrictive selon les audits sectoriels' },
];

export function Stats() {
  return (
    <section className="py-16 border-y border-white/[0.06] bg-white/[0.015]">
      <div className="container-page grid sm:grid-cols-3 gap-10">
        {STATS.map((s) => (
          <div key={s.label}>
            <div className="font-display text-3xl sm:text-4xl font-semibold text-gradient">{s.value}</div>
            <p className="mt-2 text-sm text-mist-400 leading-relaxed max-w-xs">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
