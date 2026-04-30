// Nombre de confirmations indépendantes avant publication
export const CONFIRMATIONS_REQUIRED = 3;

export type HaitiCity = {
  id: string;
  name: string;
  department: string;
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  zones: string[];
};

export const HAITI_CITIES: HaitiCity[] = [
  {
    id: 'port-au-prince',
    name: 'Port-au-Prince',
    department: 'Ouest',
    latitude: 18.543,
    longitude: -72.338,
    latitudeDelta: 0.18,
    longitudeDelta: 0.18,
    zones: [
      'Pétionville',
      'Delmas 33',
      'Delmas 75',
      'Tabarre',
      'Martissant',
      'Carrefour',
      'Cité Soleil',
      'Croix-des-Bouquets',
      'Turgeau',
      'Lalue',
      'Pacot',
      'Bourdon',
      'Canapé Vert',
      'Nazon',
      'Christ-Roi',
      'Kenscoff',
      'Titanyen',
    ],
  },
  {
    id: 'cap-haitien',
    name: 'Cap-Haïtien',
    department: 'Nord',
    latitude: 19.757,
    longitude: -72.201,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
    zones: ['Centre-ville', 'Vertières', 'Balan', 'Petite-Anse', 'Caracol'],
  },
  {
    id: 'gonaives',
    name: 'Gonaïves',
    department: 'Artibonite',
    latitude: 19.453,
    longitude: -72.686,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
    zones: ['Centre-ville', 'Jubilé', 'Raboteau', 'Pont-Rouge'],
  },
  {
    id: 'saint-marc',
    name: 'Saint-Marc',
    department: 'Artibonite',
    latitude: 19.103,
    longitude: -72.697,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
    zones: ['Centre-ville', 'Platon', 'Lizon', 'La Montagne'],
  },
  {
    id: 'les-cayes',
    name: 'Les Cayes',
    department: 'Sud',
    latitude: 18.194,
    longitude: -73.751,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
    zones: ['Centre-ville', 'Kafou Fèy', 'Belvédère', 'Ti Rivyè'],
  },
  {
    id: 'jacmel',
    name: 'Jacmel',
    department: 'Sud-Est',
    latitude: 18.234,
    longitude: -72.536,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
    zones: ['Centre-ville', 'Barrière Jeudi', 'Lizon', 'La Gosseline'],
  },
  {
    id: 'leogane',
    name: 'Léogâne',
    department: 'Ouest',
    latitude: 18.511,
    longitude: -72.631,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
    zones: ['Centre-ville', 'Gros-Morne', 'Darbonne'],
  },
  {
    id: 'hinche',
    name: 'Hinche',
    department: 'Centre',
    latitude: 19.145,
    longitude: -72.009,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
    zones: ['Centre-ville', 'Pignon', 'Thomonde'],
  },
  {
    id: 'jeremie',
    name: 'Jérémie',
    department: "Grand'Anse",
    latitude: 18.647,
    longitude: -74.115,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
    zones: ['Centre-ville', 'Abricots', 'Bonbon'],
  },
  {
    id: 'port-de-paix',
    name: 'Port-de-Paix',
    department: 'Nord-Ouest',
    latitude: 19.934,
    longitude: -72.831,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
    zones: ['Centre-ville', 'Bassin-Bleu', 'Saint-Louis-du-Nord'],
  },
];

// Délai minimal (en minutes) avant publication publique
export const PUBLISH_DELAY_MINUTES = 2;

// Score de confiance minimum pour signaler
export const MIN_TRUST_SCORE = 20;

// Faux signalements max avant suspension du compte
export const MAX_FALSE_REPORTS = 5;

// Catégories d'alertes avec labels et icônes
export const ALERT_CATEGORIES = {
  vol: { label: 'Vol / Braquage', icon: 'bag-remove', color: '#FF8C00' },
  agression: { label: 'Agression', icon: 'hand-right', color: '#FF4500' },
  kidnapping: { label: 'Kidnapping', icon: 'person-remove', color: '#FF0000' },
  fusillade: { label: 'Fusillade', icon: 'warning', color: '#FF0000' },
  barricade: { label: 'Barricade / Route bloquée', icon: 'car', color: '#F59E0B' },
  manifestation_violente: { label: 'Manifestation violente', icon: 'people', color: '#EF4444' },
  meurtre: { label: 'Meurtre / Homicide', icon: 'skull', color: '#7F1D1D' },
  trafic_organe: { label: 'Trafic d\'organes', icon: 'medical', color: '#6D28D9' },
  bandit_apercu: { label: 'Bandit aperçu dans la zone', icon: 'eye', color: '#DC2626' },
  autre: { label: 'Autre activité suspecte', icon: 'alert-circle', color: '#8892B0' },
} as const;

export const SEVERITY_LABELS = {
  1: 'Faible',
  2: 'Modéré',
  3: 'Élevé',
  4: 'Critique',
} as const;
