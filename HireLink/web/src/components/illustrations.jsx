// Illustrations vectorielles maison, aux couleurs de la marque (plates, une seule langue visuelle).
// Décoratives par défaut (aria-hidden) : le sens est toujours porté par le texte voisin.
const Svg = ({ children, className = 'h-40 w-auto', label }) => (
  <svg viewBox="0 0 240 180" className={className} fill="none" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'} focusable="false">
    {children}
  </svg>
);
const Ground = () => <ellipse cx="120" cy="160" rx="84" ry="10" className="fill-teal-50" />;

export const IlluMatch = (p) => (
  <Svg {...p}>
    <Ground />
    <rect x="22" y="28" width="92" height="120" rx="12" className="fill-white stroke-line" strokeWidth="2" />
    <circle cx="50" cy="56" r="14" className="fill-teal-100" /><circle cx="50" cy="52" r="5" className="fill-teal" /><path d="M40 66c2-6 18-6 20 0" className="stroke-teal" strokeWidth="4" strokeLinecap="round" />
    <rect x="72" y="46" width="30" height="6" rx="3" className="fill-alabaster-200" /><rect x="72" y="58" width="22" height="6" rx="3" className="fill-alabaster-200" />
    <rect x="34" y="86" width="40" height="10" rx="5" className="fill-teal-100" /><rect x="78" y="86" width="26" height="10" rx="5" className="fill-teal-50" />
    <rect x="34" y="102" width="28" height="10" rx="5" className="fill-teal-50" /><rect x="66" y="102" width="38" height="10" rx="5" className="fill-teal-100" />
    <rect x="34" y="124" width="70" height="6" rx="3" className="fill-alabaster-200" />
    <path d="M112 110c20 26 38 26 54 8" className="stroke-mint-600" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 9" />
    <circle cx="170" cy="86" r="36" className="fill-white stroke-line" strokeWidth="2" />
    <circle cx="170" cy="86" r="26" className="stroke-teal-100" strokeWidth="9" />
    <circle cx="170" cy="86" r="26" className="stroke-teal" strokeWidth="9" strokeLinecap="round" strokeDasharray="138 164" transform="rotate(-90 170 86)" />
    <text x="170" y="92" textAnchor="middle" className="fill-ink" style={{ fontSize: 17, fontWeight: 700 }}>84%</text>
    <circle cx="200" cy="52" r="11" className="fill-mint" /><path d="M195 52l4 4 7-8" className="stroke-yale" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IlluChat = (p) => (
  <Svg {...p}>
    <Ground />
    <rect x="22" y="26" width="124" height="52" rx="16" className="fill-white stroke-line" strokeWidth="2" />
    <path d="M44 78l-4 16 20-16" className="fill-white stroke-line" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="44" cy="44" r="8" className="fill-teal-100" />
    <rect x="60" y="38" width="70" height="7" rx="3.5" className="fill-alabaster-200" /><rect x="60" y="52" width="48" height="7" rx="3.5" className="fill-alabaster-200" />
    <rect x="90" y="96" width="128" height="52" rx="16" className="fill-teal" />
    <path d="M198 148l4 14-20-14" className="fill-teal" strokeLinejoin="round" />
    <rect x="106" y="110" width="84" height="7" rx="3.5" className="fill-white/90" /><rect x="106" y="124" width="56" height="7" rx="3.5" className="fill-white/60" />
    <circle cx="200" cy="40" r="5" className="fill-mint" /><circle cx="214" cy="40" r="4" className="fill-teal-100" /><circle cx="226" cy="40" r="3" className="fill-teal-100" />
  </Svg>
);

export const IlluDocs = (p) => (
  <Svg {...p}>
    <Ground />
    <rect x="76" y="22" width="100" height="130" rx="10" transform="rotate(8 126 87)" className="fill-teal-100" />
    <rect x="58" y="22" width="104" height="132" rx="10" className="fill-white stroke-line" strokeWidth="2" />
    <rect x="58" y="22" width="104" height="26" rx="10" className="fill-yale" /><rect x="58" y="38" width="104" height="10" className="fill-yale" />
    <rect x="72" y="31" width="44" height="7" rx="3.5" className="fill-white/90" />
    <rect x="72" y="62" width="76" height="6" rx="3" className="fill-alabaster-200" /><rect x="72" y="76" width="60" height="6" rx="3" className="fill-alabaster-200" /><rect x="72" y="90" width="70" height="6" rx="3" className="fill-alabaster-200" />
    <path d="M74 126h34" className="stroke-yale" strokeWidth="2" strokeLinecap="round" />
    <circle cx="140" cy="122" r="14" className="fill-teal" /><path d="M133 122l5 5 9-10" className="stroke-white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {[['FR', 20, 40], ['EN', 20, 64], ['ع', 20, 88]].map(([t, x, y]) => (
      <g key={t}><rect x={x + 170} y={y} width="32" height="20" rx="10" className="fill-white stroke-line" strokeWidth="2" /><text x={x + 186} y={y + 14} textAnchor="middle" className="fill-teal-600" style={{ fontSize: 11, fontWeight: 700 }}>{t}</text></g>
    ))}
  </Svg>
);

export const IlluCalendar = (p) => (
  <Svg {...p}>
    <Ground />
    <rect x="38" y="30" width="164" height="118" rx="14" className="fill-white stroke-line" strokeWidth="2" />
    <rect x="38" y="30" width="164" height="30" rx="14" className="fill-yale" /><rect x="38" y="46" width="164" height="14" className="fill-yale" />
    <rect x="68" y="20" width="8" height="22" rx="4" className="fill-teal-100" /><rect x="164" y="20" width="8" height="22" rx="4" className="fill-teal-100" />
    {[0, 1, 2].map((r) => [0, 1, 2, 3, 4].map((c) => (
      <rect key={`${r}${c}`} x={54 + c * 29} y={72 + r * 24} width="21" height="16" rx="5" className={r === 1 && c === 2 ? 'fill-teal' : 'fill-alabaster'} />
    )))}
    <circle cx="188" cy="136" r="22" className="fill-mint stroke-white" strokeWidth="4" /><path d="M188 124v13l8 5" className="stroke-yale" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IlluSearch = (p) => (
  <Svg {...p}>
    <Ground />
    {[0, 1, 2].map((i) => (
      <g key={i}><rect x="104" y={30 + i * 40} width="116" height="32" rx="10" className="fill-white stroke-line" strokeWidth="2" />
        <rect x="116" y={40 + i * 40} width="44" height="6" rx="3" className="fill-alabaster-200" /><rect x="116" y={50 + i * 40} width="70" height="6" rx="3" className="fill-alabaster-200" />
        <rect x="192" y={40 + i * 40} width="18" height="12" rx="6" className={i === 0 ? 'fill-teal' : 'fill-teal-100'} /></g>
    ))}
    <circle cx="74" cy="88" r="38" className="fill-teal-50 stroke-yale" strokeWidth="9" />
    <path d="M102 116l26 26" className="stroke-yale" strokeWidth="11" strokeLinecap="round" />
    <path d="M58 90l11 11 20-24" className="stroke-teal" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IlluInbox = (p) => (
  <Svg {...p}>
    <Ground />
    <path d="M52 92l22-44h92l22 44v46a10 10 0 01-10 10H62a10 10 0 01-10-10V92z" className="fill-white stroke-line" strokeWidth="2" strokeLinejoin="round" />
    <path d="M52 92h50a18 18 0 0036 0h50" className="stroke-line" strokeWidth="2" strokeLinejoin="round" />
    <path d="M62 148h116a10 10 0 0010-10V92h-50a18 18 0 01-36 0H52v46a10 10 0 0010 10z" className="fill-teal-50" />
    <circle cx="176" cy="42" r="6" className="fill-mint" /><circle cx="64" cy="44" r="4" className="fill-teal-100" /><path d="M120 28v14M113 35h14" className="stroke-teal" strokeWidth="3.5" strokeLinecap="round" />
  </Svg>
);

export const IlluBell = (p) => (
  <Svg {...p}>
    <Ground />
    <path d="M120 30c-26 0-40 20-40 44v26l-12 18h104l-12-18V74c0-24-14-44-40-44z" className="fill-white stroke-line" strokeWidth="2" strokeLinejoin="round" />
    <path d="M104 126a16 16 0 0032 0" className="fill-teal" /><circle cx="120" cy="26" r="6" className="fill-yale" />
    <circle cx="164" cy="52" r="14" className="fill-mint" /><path d="M158 52l4 4 8-9" className="stroke-yale" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IlluCompany = (p) => (
  <Svg {...p}>
    <Ground />
    <rect x="62" y="26" width="76" height="128" rx="8" className="fill-white stroke-line" strokeWidth="2" />
    <rect x="138" y="70" width="48" height="84" rx="8" className="fill-teal-100" />
    {[0, 1, 2, 3].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={76 + c * 28} y={40 + r * 22} width="16" height="12" rx="3" className={r === 1 && c === 1 ? 'fill-teal' : 'fill-alabaster-200'} />))}
    {[0, 1, 2].map((r) => <rect key={r} x="150" y={84 + r * 20} width="14" height="10" rx="3" className="fill-white" />)}
    <rect x="90" y="124" width="20" height="30" rx="4" className="fill-yale" />
    <circle cx="188" cy="46" r="18" className="fill-mint" /><path d="M188 37v18M179 46h18" className="stroke-yale" strokeWidth="4" strokeLinecap="round" />
  </Svg>
);

export const IlluShield = (p) => (
  <Svg {...p}>
    <Ground />
    <path d="M120 22l62 22v42c0 36-26 58-62 72-36-14-62-36-62-72V44l62-22z" className="fill-white stroke-line" strokeWidth="2" strokeLinejoin="round" />
    <path d="M120 38l46 16v32c0 28-19 44-46 56-27-12-46-28-46-56V54l46-16z" className="fill-teal-50" />
    <path d="M98 92l16 16 30-34" className="stroke-teal" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Motif de marque : le « ruban » du logo, utilisé comme fond décoratif des bandeaux.
export const Ribbon = ({ className = '' }) => (
  <svg viewBox="0 0 800 200" preserveAspectRatio="none" className={className} aria-hidden="true" focusable="false">
    <defs><linearGradient id="rb" x1="0" x2="1"><stop offset="0" stopColor="#7DD3B8" stopOpacity=".05" /><stop offset=".5" stopColor="#7DD3B8" stopOpacity=".28" /><stop offset="1" stopColor="#3C6E71" stopOpacity=".05" /></linearGradient></defs>
    <path d="M0 150C160 40 300 190 460 100S700 30 800 90V200H0z" fill="url(#rb)" />
    <path d="M0 120C170 10 310 160 470 70S710 0 800 60" stroke="#7DD3B8" strokeOpacity=".35" strokeWidth="2" fill="none" />
  </svg>
);
