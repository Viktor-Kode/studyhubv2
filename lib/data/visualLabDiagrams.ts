// Visual Lab diagram library (Phase 1)
// Each diagram:
// id: unique string
// subject: 'biology' | 'physics' | 'chemistry' | 'geography'
// title: display name
// keywords: array of strings — matched against question text (lowercase)
// svg: full SVG string (built inline — no external files)

export type DiagramSubject = 'biology' | 'physics' | 'chemistry' | 'geography'

export interface DiagramLabel {
  x: number
  y: number
  text: string
}

export interface Diagram {
  id: string
  subject: DiagramSubject
  title: string
  keywords: string[]
  svg: string
  labels?: DiagramLabel[]
}

export const DIAGRAMS: Diagram[] = [
  // ══ BIOLOGY ════════════════════════════════════════
  {
    id: 'animal_cell',
    subject: 'biology',
    title: 'Animal Cell',
    keywords: ['animal cell', 'cell membrane', 'nucleus', 'cytoplasm', 'mitochondria', 'ribosome', 'endoplasmic'],
    labels: [
      { x: 200, y: 80, text: 'Cell Membrane' },
      { x: 200, y: 140, text: 'Nucleus' },
      { x: 120, y: 180, text: 'Cytoplasm' },
      { x: 280, y: 180, text: 'Mitochondria' },
      { x: 160, y: 220, text: 'Ribosome' },
      { x: 240, y: 100, text: 'Endoplasmic Reticulum' },
    ],
    svg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <!-- Cell membrane -->
      <ellipse cx="200" cy="150" rx="170" ry="130" fill="#FEF3C7" stroke="#D97706" stroke-width="3" stroke-dasharray="8,4"/>
      <!-- Nucleus -->
      <ellipse cx="200" cy="140" rx="55" ry="45" fill="#DBEAFE" stroke="#2563EB" stroke-width="2.5"/>
      <ellipse cx="200" cy="140" rx="30" ry="22" fill="#93C5FD" stroke="#2563EB" stroke-width="1.5"/>
      <text x="200" y="144" text-anchor="middle" font-size="10" fill="#1E40AF" font-weight="bold">Nucleolus</text>
      <text x="200" y="105" text-anchor="middle" font-size="10" fill="#1E40AF">Nucleus</text>
      <!-- Mitochondria -->
      <ellipse cx="300" cy="180" rx="35" ry="20" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
      <line x1="268" y1="180" x2="332" y2="180" stroke="#059669" stroke-width="1.5"/>
      <path d="M280 170 Q290 180 280 190" stroke="#059669" fill="none" stroke-width="1"/>
      <path d="M295 170 Q305 180 295 190" stroke="#059669" fill="none" stroke-width="1"/>
      <text x="300" y="210" text-anchor="middle" font-size="9" fill="#065F46">Mitochondria</text>
      <!-- Endoplasmic Reticulum -->
      <path d="M130 120 Q150 100 170 120 Q190 140 170 160 Q150 180 130 160 Q110 140 130 120" fill="none" stroke="#7C3AED" stroke-width="2"/>
      <text x="100" y="100" text-anchor="middle" font-size="8" fill="#6D28D9">ER</text>
      <!-- Ribosomes -->
      <circle cx="140" cy="200" r="5" fill="#F59E0B"/>
      <circle cx="155" cy="210" r="5" fill="#F59E0B"/>
      <circle cx="170" cy="198" r="5" fill="#F59E0B"/>
      <text x="155" y="230" text-anchor="middle" font-size="9" fill="#92400E">Ribosomes</text>
      <!-- Golgi -->
      <path d="M250 100 Q270 90 270 110" stroke="#EC4899" fill="none" stroke-width="2"/>
      <path d="M248 108 Q270 98 270 118" stroke="#EC4899" fill="none" stroke-width="2"/>
      <path d="M246 116 Q270 106 270 126" stroke="#EC4899" fill="none" stroke-width="2"/>
      <text x="285" y="110" font-size="8" fill="#BE185D">Golgi</text>
      <!-- Cell membrane label -->
      <text x="50" y="60" font-size="9" fill="#B45309">Cell Membrane</text>
      <line x1="70" y1="63" x2="90" y2="80" stroke="#B45309" stroke-width="1"/>
      <!-- Title -->
      <text x="200" y="290" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">Animal Cell</text>
    </svg>`,
  },

  {
    id: 'plant_cell',
    subject: 'biology',
    title: 'Plant Cell',
    keywords: ['plant cell', 'cell wall', 'chloroplast', 'vacuole', 'plastid'],
    svg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <!-- Cell wall -->
      <rect x="30" y="20" width="340" height="260" rx="8" fill="none" stroke="#92400E" stroke-width="5"/>
      <!-- Cell membrane -->
      <rect x="38" y="28" width="324" height="244" rx="6" fill="#F0FDF4" stroke="#16A34A" stroke-width="2" stroke-dasharray="6,3"/>
      <!-- Vacuole -->
      <ellipse cx="200" cy="155" rx="110" ry="85" fill="#BAE6FD" stroke="#0284C7" stroke-width="2"/>
      <text x="200" y="158" text-anchor="middle" font-size="11" fill="#0369A1" font-weight="bold">Vacuole</text>
      <!-- Nucleus -->
      <ellipse cx="300" cy="80" rx="45" ry="38" fill="#DBEAFE" stroke="#2563EB" stroke-width="2.5"/>
      <ellipse cx="300" cy="80" rx="22" ry="18" fill="#93C5FD" stroke="#2563EB" stroke-width="1.5"/>
      <text x="300" y="84" text-anchor="middle" font-size="9" fill="#1E40AF">Nucleus</text>
      <!-- Chloroplasts -->
      <ellipse cx="80" cy="100" rx="30" ry="16" fill="#BBF7D0" stroke="#16A34A" stroke-width="2"/>
      <line x1="52" y1="100" x2="108" y2="100" stroke="#16A34A" stroke-width="1"/>
      <text x="80" y="125" text-anchor="middle" font-size="8" fill="#15803D">Chloroplast</text>
      <ellipse cx="80" cy="200" rx="30" ry="16" fill="#BBF7D0" stroke="#16A34A" stroke-width="2"/>
      <line x1="52" y1="200" x2="108" y2="200" stroke="#16A34A" stroke-width="1"/>
      <!-- Mitochondria -->
      <ellipse cx="340" cy="200" rx="25" ry="14" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
      <text x="340" y="222" text-anchor="middle" font-size="8" fill="#065F46">Mitochondria</text>
      <!-- Labels -->
      <text x="200" y="16" text-anchor="middle" font-size="9" fill="#92400E" font-weight="bold">Cell Wall</text>
      <text x="200" y="290" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">Plant Cell</text>
    </svg>`,
  },

  {
    id: 'human_heart',
    subject: 'biology',
    title: 'Human Heart',
    keywords: ['heart', 'cardiac', 'atrium', 'ventricle', 'aorta', 'pulmonary', 'valve', 'vena cava'],
    svg: `<svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
      <!-- Heart shape -->
      <path d="M200 280 C200 280 60 180 60 110 C60 70 90 50 130 50 C160 50 185 70 200 90 C215 70 240 50 270 50 C310 50 340 70 340 110 C340 180 200 280 200 280Z" fill="#FCA5A5" stroke="#DC2626" stroke-width="3"/>
      <!-- Septum -->
      <line x1="200" y1="90" x2="200" y2="250" stroke="#DC2626" stroke-width="2.5" stroke-dasharray="5,3"/>
      <!-- Chambers -->
      <text x="155" y="140" text-anchor="middle" font-size="10" fill="#991B1B" font-weight="bold">Right</text>
      <text x="155" y="153" text-anchor="middle" font-size="10" fill="#991B1B" font-weight="bold">Atrium</text>
      <text x="245" y="140" text-anchor="middle" font-size="10" fill="#991B1B" font-weight="bold">Left</text>
      <text x="245" y="153" text-anchor="middle" font-size="10" fill="#991B1B" font-weight="bold">Atrium</text>
      <text x="155" y="210" text-anchor="middle" font-size="10" fill="#7F1D1D" font-weight="bold">Right</text>
      <text x="155" y="223" text-anchor="middle" font-size="10" fill="#7F1D1D" font-weight="bold">Ventricle</text>
      <text x="245" y="210" text-anchor="middle" font-size="10" fill="#7F1D1D" font-weight="bold">Left</text>
      <text x="245" y="223" text-anchor="middle" font-size="10" fill="#7F1D1D" font-weight="bold">Ventricle</text>
      <!-- Aorta -->
      <path d="M220 55 C220 30 260 20 280 40" fill="none" stroke="#DC2626" stroke-width="12"/>
      <text x="285" y="25" font-size="9" fill="#DC2626">Aorta</text>
      <!-- Pulmonary artery -->
      <path d="M175 60 C175 35 145 20 125 35" fill="none" stroke="#3B82F6" stroke-width="10"/>
      <text x="60" y="25" font-size="9" fill="#2563EB">Pulmonary A.</text>
      <!-- Vena cava -->
      <rect x="150" y="15" width="16" height="40" rx="8" fill="#3B82F6"/>
      <text x="200" y="295" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">Human Heart</text>
    </svg>`,
  },

  {
    id: 'digestive_system',
    subject: 'biology',
    title: 'Digestive System',
    keywords: ['digestive', 'digestion', 'oesophagus', 'stomach', 'intestine', 'liver', 'pancreas', 'colon', 'rectum', 'alimentary'],
    svg: `<svg viewBox="0 0 400 380" xmlns="http://www.w3.org/2000/svg">
      <!-- Oesophagus -->
      <rect x="185" y="20" width="24" height="60" rx="12" fill="#FDE68A" stroke="#D97706" stroke-width="2"/>
      <text x="230" y="52" font-size="9" fill="#92400E">Oesophagus</text>
      <line x1="210" y1="52" x2="225" y2="52" stroke="#92400E" stroke-width="1"/>
      <!-- Stomach -->
      <path d="M160 80 C130 80 110 100 115 130 C120 165 150 175 185 170 C215 165 225 145 220 120 C215 95 190 80 160 80Z" fill="#FCA5A5" stroke="#DC2626" stroke-width="2"/>
      <text x="163" y="130" text-anchor="middle" font-size="10" fill="#991B1B" font-weight="bold">Stomach</text>
      <!-- Liver -->
      <ellipse cx="290" cy="110" rx="55" ry="35" fill="#D97706" opacity="0.7" stroke="#B45309" stroke-width="2"/>
      <text x="290" y="114" text-anchor="middle" font-size="10" fill="#7C2D12" font-weight="bold">Liver</text>
      <!-- Small intestine -->
      <path d="M185 172 C200 180 210 200 195 215 C180 228 165 220 162 205 C158 188 170 178 185 185 C200 192 208 212 193 225 C178 238 162 230 160 215 C158 200 170 188 185 195 C200 202 205 222 190 232 C175 242 162 235 160 222" fill="none" stroke="#16A34A" stroke-width="8"/>
      <text x="310" y="210" font-size="9" fill="#15803D">Small</text>
      <text x="310" y="222" font-size="9" fill="#15803D">Intestine</text>
      <line x1="240" y1="215" x2="305" y2="215" stroke="#15803D" stroke-width="1"/>
      <!-- Large intestine -->
      <path d="M160 235 C140 235 125 250 125 270 C125 300 145 320 175 325 C215 330 255 325 275 305 C290 285 285 260 265 250 C248 242 230 248 215 260" fill="none" stroke="#7C3AED" stroke-width="10"/>
      <text x="310" y="285" font-size="9" fill="#6D28D9">Large</text>
      <text x="310" y="297" font-size="9" fill="#6D28D9">Intestine</text>
      <!-- Rectum -->
      <rect x="165" y="325" width="20" height="40" rx="8" fill="#EC4899" stroke="#BE185D" stroke-width="2"/>
      <text x="200" y="348" font-size="9" fill="#BE185D">Rectum</text>
      <text x="200" y="370" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">Digestive System</text>
    </svg>`,
  },

  // ══ PHYSICS ════════════════════════════════════════
  {
    id: 'simple_circuit',
    subject: 'physics',
    title: 'Simple Electric Circuit',
    keywords: ['circuit', 'current', 'voltage', 'resistance', 'ohm', 'battery', 'resistor', 'electric', 'ammeter', 'voltmeter'],
    svg: `<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg">
      <!-- Wire -->
      <rect x="60" y="60" width="280" height="160" rx="0" fill="none" stroke="#374151" stroke-width="3"/>
      <!-- Battery (left side) -->
      <line x1="60" y1="100" x2="60" y2="120" stroke="#374151" stroke-width="3"/>
      <line x1="48" y1="108" x2="72" y2="108" stroke="#DC2626" stroke-width="5"/>
      <line x1="52" y1="116" x2="68" y2="116" stroke="#2563EB" stroke-width="3"/>
      <line x1="60" y1="120" x2="60" y2="140" stroke="#374151" stroke-width="3"/>
      <text x="20" y="122" font-size="10" fill="#DC2626">+</text>
      <text x="20" y="138" font-size="10" fill="#2563EB">-</text>
      <text x="15" y="158" font-size="9" fill="#374151">Battery</text>
      <!-- Resistor (top) -->
      <rect x="155" y="48" width="90" height="24" rx="4" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
      <path d="M165 60 L175 50 L185 70 L195 50 L205 70 L215 50 L225 60" fill="none" stroke="#D97706" stroke-width="2"/>
      <text x="200" y="40" text-anchor="middle" font-size="9" fill="#92400E">Resistor (R)</text>
      <!-- Bulb (right side) -->
      <circle cx="340" cy="140" r="20" fill="#FEF9C3" stroke="#CA8A04" stroke-width="2"/>
      <line x1="332" y1="132" x2="348" y2="148" stroke="#CA8A04" stroke-width="2"/>
      <line x1="348" y1="132" x2="332" y2="148" stroke="#CA8A04" stroke-width="2"/>
      <text x="370" y="144" font-size="9" fill="#92400E">Bulb</text>
      <!-- Ammeter (bottom) -->
      <circle cx="200" cy="220" r="16" fill="white" stroke="#374151" stroke-width="2"/>
      <text x="200" y="224" text-anchor="middle" font-size="11" fill="#374151" font-weight="bold">A</text>
      <text x="200" y="248" text-anchor="middle" font-size="9" fill="#374151">Ammeter</text>
      <!-- Switch (top-left) -->
      <circle cx="100" cy="60" r="4" fill="#374151"/>
      <circle cx="130" cy="60" r="4" fill="#374151"/>
      <line x1="104" y1="57" x2="126" y2="48" stroke="#374151" stroke-width="2"/>
      <text x="112" y="45" text-anchor="middle" font-size="9" fill="#374151">Switch</text>
      <!-- Current arrows -->
      <text x="200" y="52" text-anchor="middle" font-size="14" fill="#DC2626">→</text>
      <text x="356" y="100" font-size="14" fill="#DC2626">↓</text>
      <text x="200" y="216" text-anchor="middle" font-size="14" fill="#DC2626">←</text>
      <text x="44" y="100" font-size="14" fill="#DC2626">↑</text>
      <text x="200" y="270" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">Simple Electric Circuit</text>
    </svg>`,
  },

  {
    id: 'ray_diagram_convex',
    subject: 'physics',
    title: 'Convex Lens Ray Diagram',
    keywords: ['convex lens', 'converging', 'focal point', 'refraction', 'lens', 'ray diagram', 'image formation', 'optics'],
    svg: `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg">
      <!-- Principal axis -->
      <line x1="20" y1="130" x2="380" y2="130" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="6,4"/>
      <!-- Lens -->
      <path d="M200 50 Q230 130 200 210" fill="none" stroke="#2563EB" stroke-width="3"/>
      <path d="M200 50 Q170 130 200 210" fill="none" stroke="#2563EB" stroke-width="3"/>
      <!-- Object -->
      <line x1="100" y1="130" x2="100" y2="70" stroke="#16A34A" stroke-width="3"/>
      <polygon points="100,70 95,82 105,82" fill="#16A34A"/>
      <text x="100" y="148" text-anchor="middle" font-size="10" fill="#15803D">Object</text>
      <!-- Focal points -->
      <circle cx="260" cy="130" r="5" fill="#DC2626"/>
      <text x="260" y="148" text-anchor="middle" font-size="9" fill="#DC2626">F</text>
      <circle cx="140" cy="130" r="5" fill="#DC2626"/>
      <text x="140" y="148" text-anchor="middle" font-size="9" fill="#DC2626">F</text>
      <circle cx="320" cy="130" r="5" fill="#7C3AED"/>
      <text x="320" y="148" text-anchor="middle" font-size="9" fill="#7C3AED">2F</text>
      <circle cx="80" cy="130" r="5" fill="#7C3AED"/>
      <text x="80" y="148" text-anchor="middle" font-size="9" fill="#7C3AED">2F</text>
      <!-- Ray 1 — parallel to axis, through F -->
      <line x1="100" y1="70" x2="200" y2="70" stroke="#F59E0B" stroke-width="1.5"/>
      <line x1="200" y1="70" x2="340" y2="170" stroke="#F59E0B" stroke-width="1.5"/>
      <!-- Ray 2 — through centre -->
      <line x1="100" y1="70" x2="340" y2="190" stroke="#EC4899" stroke-width="1.5"/>
      <!-- Image -->
      <line x1="340" y1="130" x2="340" y2="185" stroke="#DC2626" stroke-width="3"/>
      <polygon points="340,185 335,173 345,173" fill="#DC2626"/>
      <text x="340" y="205" text-anchor="middle" font-size="9" fill="#DC2626">Image</text>
      <!-- Labels -->
      <text x="200" y="30" text-anchor="middle" font-size="10" fill="#2563EB" font-weight="bold">Convex Lens</text>
      <text x="200" y="248" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">Convex Lens — Ray Diagram</text>
    </svg>`,
  },

  {
    id: 'simple_pendulum',
    subject: 'physics',
    title: 'Simple Pendulum',
    keywords: ['pendulum', 'oscillation', 'period', 'amplitude', 'simple harmonic', 'shm', 'bob', 'string'],
    svg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <!-- Pivot support -->
      <rect x="140" y="20" width="120" height="16" rx="4" fill="#475569"/>
      <circle cx="200" cy="36" r="6" fill="#1E293B"/>
      <!-- Strings at angles -->
      <line x1="200" y1="36" x2="120" y2="220" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5,3"/>
      <line x1="200" y1="36" x2="280" y2="220" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5,3"/>
      <!-- Centre string -->
      <line x1="200" y1="36" x2="200" y2="230" stroke="#374151" stroke-width="2.5"/>
      <!-- Bobs at positions -->
      <circle cx="120" cy="230" r="18" fill="#FCA5A5" stroke="#DC2626" stroke-width="2" opacity="0.5"/>
      <circle cx="280" cy="230" r="18" fill="#FCA5A5" stroke="#DC2626" stroke-width="2" opacity="0.5"/>
      <!-- Centre bob -->
      <circle cx="200" cy="240" r="20" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2.5"/>
      <!-- Amplitude arrows -->
      <line x1="200" y1="260" x2="200" y2="268" stroke="#374151" stroke-width="1"/>
      <line x1="120" y1="260" x2="280" y2="260" stroke="#374151" stroke-width="1.5"/>
      <text x="155" y="280" text-anchor="middle" font-size="9" fill="#374151">←  Amplitude  →</text>
      <!-- Length label -->
      <line x1="210" y1="36" x2="210" y2="230" stroke="#16A34A" stroke-width="1.5"/>
      <text x="230" y="140" font-size="10" fill="#16A34A">L (Length)</text>
      <!-- Arc arrow -->
      <path d="M145 160 Q170 140 200 155" fill="none" stroke="#F59E0B" stroke-width="2"/>
      <text x="200" y="295" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">Simple Pendulum</text>
    </svg>`,
  },

  // ══ CHEMISTRY ══════════════════════════════════════
  {
    id: 'bunsen_burner',
    subject: 'chemistry',
    title: 'Bunsen Burner',
    keywords: ['bunsen', 'burner', 'flame', 'gas', 'laboratory', 'heating', 'combustion', 'air hole'],
    svg: `<svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
      <!-- Base -->
      <ellipse cx="200" cy="290" rx="70" ry="18" fill="#94A3B8" stroke="#64748B" stroke-width="2"/>
      <rect x="168" y="272" width="64" height="22" rx="4" fill="#94A3B8" stroke="#64748B" stroke-width="2"/>
      <!-- Barrel -->
      <rect x="182" y="170" width="36" height="108" rx="6" fill="#CBD5E1" stroke="#64748B" stroke-width="2"/>
      <!-- Air hole -->
      <ellipse cx="200" cy="220" rx="12" ry="6" fill="#1E293B" stroke="#475569" stroke-width="2"/>
      <text x="240" y="224" font-size="9" fill="#374151">Air hole</text>
      <line x1="215" y1="222" x2="237" y2="222" stroke="#374151" stroke-width="1"/>
      <!-- Gas inlet -->
      <rect x="182" y="272" width="20" height="10" rx="3" fill="#64748B"/>
      <rect x="142" y="275" width="42" height="8" rx="4" fill="#94A3B8" stroke="#64748B" stroke-width="1.5"/>
      <text x="118" y="282" font-size="9" fill="#374151">Gas pipe</text>
      <!-- Flame — roaring (blue) -->
      <ellipse cx="200" cy="148" rx="22" ry="28" fill="#93C5FD" opacity="0.8"/>
      <ellipse cx="200" cy="138" rx="14" ry="20" fill="#3B82F6" opacity="0.9"/>
      <ellipse cx="200" cy="130" rx="8" ry="14" fill="#1D4ED8"/>
      <text x="250" y="148" font-size="9" fill="#2563EB">Roaring</text>
      <text x="250" y="160" font-size="9" fill="#2563EB">flame</text>
      <line x1="224" y1="148" x2="248" y2="152" stroke="#2563EB" stroke-width="1"/>
      <!-- Safety flame (orange) — shown faded -->
      <ellipse cx="320" cy="148" rx="16" ry="24" fill="#FEF3C7" opacity="0.5"/>
      <ellipse cx="320" cy="140" rx="10" ry="18" fill="#FDE68A" opacity="0.5"/>
      <ellipse cx="320" cy="132" rx="6" ry="12" fill="#F59E0B" opacity="0.5"/>
      <text x="310" y="180" text-anchor="middle" font-size="8" fill="#92400E" opacity="0.7">Safety flame</text>
      <text x="200" y="315" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">Bunsen Burner</text>
    </svg>`,
  },

  {
    id: 'water_molecule',
    subject: 'chemistry',
    title: 'Water Molecule (H₂O)',
    keywords: ['water', 'h2o', 'molecule', 'bond', 'covalent', 'hydrogen bond', 'polar', 'electron'],
    svg: `<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg">
      <!-- Oxygen atom -->
      <circle cx="200" cy="130" r="45" fill="#FCA5A5" stroke="#DC2626" stroke-width="3"/>
      <text x="200" y="125" text-anchor="middle" font-size="18" fill="#7F1D1D" font-weight="bold">O</text>
      <text x="200" y="145" text-anchor="middle" font-size="12" fill="#7F1D1D">8p, 8n</text>
      <!-- Hydrogen atoms -->
      <circle cx="90" cy="200" r="30" fill="#DBEAFE" stroke="#2563EB" stroke-width="2.5"/>
      <text x="90" y="195" text-anchor="middle" font-size="16" fill="#1E40AF" font-weight="bold">H</text>
      <text x="90" y="212" text-anchor="middle" font-size="10" fill="#1E40AF">1p</text>
      <circle cx="310" cy="200" r="30" fill="#DBEAFE" stroke="#2563EB" stroke-width="2.5"/>
      <text x="310" y="195" text-anchor="middle" font-size="16" fill="#1E40AF" font-weight="bold">H</text>
      <text x="310" y="212" text-anchor="middle" font-size="10" fill="#1E40AF">1p</text>
      <!-- Bonds -->
      <line x1="164" y1="165" x2="118" y2="176" stroke="#374151" stroke-width="4"/>
      <line x1="236" y1="165" x2="282" y2="176" stroke="#374151" stroke-width="4"/>
      <!-- Bond angle -->
      <path d="M130 195 Q200 240 270 195" fill="none" stroke="#F59E0B" stroke-width="2" stroke-dasharray="5,3"/>
      <text x="200" y="255" text-anchor="middle" font-size="11" fill="#92400E">104.5° bond angle</text>
      <!-- Lone pairs -->
      <ellipse cx="175" cy="95" rx="16" ry="8" fill="#A7F3D0" stroke="#059669" stroke-width="1.5" opacity="0.8"/>
      <ellipse cx="225" cy="95" rx="16" ry="8" fill="#A7F3D0" stroke="#059669" stroke-width="1.5" opacity="0.8"/>
      <text x="200" y="70" text-anchor="middle" font-size="9" fill="#059669">Lone pairs</text>
      <line x1="200" y1="73" x2="200" y2="87" stroke="#059669" stroke-width="1"/>
      <text x="200" y="275" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">Water Molecule (H₂O)</text>
    </svg>`,
  },

  {
    id: 'titration_setup',
    subject: 'chemistry',
    title: 'Titration Setup',
    keywords: ['titration', 'burette', 'pipette', 'conical flask', 'indicator', 'end point', 'equivalence', 'acid base'],
    svg: `<svg viewBox="0 0 400 340" xmlns="http://www.w3.org/2000/svg">
      <!-- Stand -->
      <rect x="60" y="40" width="10" height="260" rx="4" fill="#94A3B8"/>
      <rect x="40" y="288" width="120" height="14" rx="4" fill="#94A3B8"/>
      <rect x="55" y="130" width="80" height="10" rx="4" fill="#94A3B8"/>
      <!-- Clamp -->
      <rect x="68" y="60" width="40" height="16" rx="4" fill="#64748B"/>
      <!-- Burette -->
      <rect x="108" y="50" width="22" height="220" rx="4" fill="#E0F2FE" stroke="#0284C7" stroke-width="2"/>
      <!-- Liquid in burette -->
      <rect x="110" y="55" width="18" height="140" rx="2" fill="#FDE68A" opacity="0.8"/>
      <!-- Scale marks -->
      <line x1="108" y1="80" x2="115" y2="80" stroke="#0284C7" stroke-width="1"/>
      <line x1="108" y1="100" x2="115" y2="100" stroke="#0284C7" stroke-width="1"/>
      <line x1="108" y1="120" x2="115" y2="120" stroke="#0284C7" stroke-width="1"/>
      <line x1="108" y1="140" x2="115" y2="140" stroke="#0284C7" stroke-width="1"/>
      <text x="135" y="84" font-size="8" fill="#0369A1">0</text>
      <text x="135" y="104" font-size="8" fill="#0369A1">10</text>
      <text x="135" y="124" font-size="8" fill="#0369A1">20</text>
      <text x="135" y="144" font-size="8" fill="#0369A1">30</text>
      <!-- Tap -->
      <rect x="103" y="258" width="32" height="14" rx="6" fill="#64748B"/>
      <line x1="119" y1="258" x2="119" y2="245" stroke="#0284C7" stroke-width="4"/>
      <!-- Conical flask -->
      <path d="M95 290 L75 330 L165 330 L145 290 Z" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
      <rect x="110" y="272" width="20" height="20" rx="4" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
      <!-- Solution in flask -->
      <path d="M82 320 L80 330 L160 330 L158 320 Z" fill="#86EFAC" opacity="0.8"/>
      <text x="120" y="322" text-anchor="middle" font-size="8" fill="#166534">Solution</text>
      <!-- Labels -->
      <text x="200" y="65" font-size="10" fill="#0369A1" font-weight="bold">Burette</text>
      <text x="200" y="310" font-size="10" fill="#166534" font-weight="bold">Conical Flask</text>
      <text x="200" y="338" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">Titration Setup</text>
    </svg>`,
  },

  // ══ GEOGRAPHY ══════════════════════════════════════
  {
    id: 'rock_cycle',
    subject: 'geography',
    title: 'Rock Cycle',
    keywords: ['rock cycle', 'igneous', 'sedimentary', 'metamorphic', 'magma', 'erosion', 'weathering', 'crystallization'],
    svg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <!-- Igneous -->
      <ellipse cx="200" cy="60" rx="65" ry="35" fill="#FEF3C7" stroke="#D97706" stroke-width="2.5"/>
      <text x="200" y="55" text-anchor="middle" font-size="11" fill="#92400E" font-weight="bold">Igneous Rock</text>
      <text x="200" y="70" text-anchor="middle" font-size="9" fill="#92400E">(e.g. Granite, Basalt)</text>
      <!-- Sedimentary -->
      <ellipse cx="80" cy="220" rx="65" ry="35" fill="#DBEAFE" stroke="#2563EB" stroke-width="2.5"/>
      <text x="80" y="215" text-anchor="middle" font-size="11" fill="#1E40AF" font-weight="bold">Sedimentary</text>
      <text x="80" y="230" text-anchor="middle" font-size="9" fill="#1E40AF">(e.g. Limestone)</text>
      <!-- Metamorphic -->
      <ellipse cx="320" cy="220" rx="65" ry="35" fill="#F3E8FF" stroke="#7C3AED" stroke-width="2.5"/>
      <text x="320" y="215" text-anchor="middle" font-size="11" fill="#6D28D9" font-weight="bold">Metamorphic</text>
      <text x="320" y="230" text-anchor="middle" font-size="9" fill="#6D28D9">(e.g. Marble)</text>
      <!-- Magma centre -->
      <ellipse cx="200" cy="190" rx="40" ry="28" fill="#FCA5A5" stroke="#DC2626" stroke-width="2"/>
      <text x="200" y="194" text-anchor="middle" font-size="10" fill="#7F1D1D" font-weight="bold">Magma</text>
      <!-- Arrows -->
      <path d="M145 75 Q80 120 100 188" fill="none" stroke="#374151" stroke-width="2"/>
      <text x="85" y="130" font-size="8" fill="#374151" transform="rotate(-55,85,130)">Weathering/</text>
      <text x="72" y="140" font-size="8" fill="#374151" transform="rotate(-55,72,140)">Erosion</text>
      <path d="M140 210 Q200 240 258 218" fill="none" stroke="#374151" stroke-width="2"/>
      <text x="200" y="258" text-anchor="middle" font-size="8" fill="#374151">Heat &amp; Pressure</text>
      <path d="M300 188 Q260 130 240 90" fill="none" stroke="#374151" stroke-width="2"/>
      <text x="295" y="130" font-size="8" fill="#374151">Melting</text>
      <path d="M200 162 Q200 120 200 95" fill="none" stroke="#DC2626" stroke-width="2"/>
      <text x="215" y="140" font-size="8" fill="#DC2626">Cooling</text>
      <text x="200" y="290" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">The Rock Cycle</text>
    </svg>`,
  },
]

// ── DIAGRAM MATCHER ────────────────────────────────────
// Call this with a question string to find the best matching diagram
export const findDiagram = (questionText: string | undefined | null): Diagram | null => {
  if (!questionText) return null
  const lower = questionText.toLowerCase()
  let bestMatch: Diagram | null = null
  let bestScore = 0

  for (const diagram of DIAGRAMS) {
    const score = diagram.keywords.filter((kw) => lower.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestMatch = diagram
    }
  }
  return bestScore > 0 ? bestMatch : null
}

// Get all diagrams for a subject
export const getDiagramsBySubject = (subject: string): Diagram[] =>
  DIAGRAMS.filter((d) => d.subject === subject.toLowerCase())

