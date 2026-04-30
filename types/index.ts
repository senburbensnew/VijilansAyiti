export type UserRole = 'anonymous' | 'user' | 'moderator' | 'police';

export interface User {
  id: string;
  phone: string;
  pseudo: string;
  displayName: string;  // always equals pseudo — kept for UI compat
  role: UserRole;
  trustScore: number;       // 0–100
  reportCount: number;
  validatedReports: number;
  falseReports: number;
  createdAt: string;
  isVerified: boolean;
  isBanned: boolean;
}

export type AlertCategory =
  | 'vol'
  | 'agression'
  | 'kidnapping'
  | 'fusillade'
  | 'barricade'
  | 'manifestation_violente'
  | 'meurtre'
  | 'trafic_organe'
  | 'autre';

export type AlertStatus =
  | 'pending'       // En attente de confirmations
  | 'active'        // Confirmé et visible
  | 'disputed'      // Contesté
  | 'resolved'      // Résolu
  | 'false_alarm';  // Fausse alerte confirmée

export interface Alert {
  id: string;
  category: AlertCategory;
  description: string;
  zone: string;              // Quartier/zone (pas coordonnées exactes pour public)
  latitude: number;
  longitude: number;
  reportedAt: string;
  publishedAt?: string;      // null tant que pas assez de confirmations
  status: AlertStatus;
  severity: 1 | 2 | 3 | 4;  // 1=faible, 4=critique
  confirmations: number;
  disputeCount: number;
  reporterId?: string;       // null si anonyme
  isAnonymous: boolean;
  // Ce que le public voit: zone floue. Police: coords exactes
  publicView: boolean;
}

export interface Report {
  id: string;
  alertId?: string;
  userId?: string;
  deviceId: string;
  category: AlertCategory;
  description: string;
  latitude: number;
  longitude: number;
  zone: string;
  timestamp: string;
  isAnonymous: boolean;
  hasPhoto: boolean;
}

export interface Confirmation {
  id: string;
  alertId: string;
  userId?: string;
  deviceId: string;
  timestamp: string;
}

export interface Dispute {
  id: string;
  alertId: string;
  userId?: string;
  reason: string;
  timestamp: string;
}

export type GangMemberStatus = 'recherché' | 'actif' | 'arrêté' | 'décédé';

export type GangMemberVerification = 'pending' | 'confirmed';

export interface GangMember {
  id: string;
  alias: string;
  realName?: string;
  gang: string;
  territory: string[];
  dangerLevel: 1 | 2 | 3 | 4;
  status: GangMemberStatus;
  charges: string[];
  lastSeen?: string;
  description: string;
  photoUri?: string;
  photoUris?: string[];
  dcpjRef?: string;           // Official DCPJ record URL or reference number
  // Community verification
  verificationStatus: GangMemberVerification;
  confirmations: number;
  confirmedBy: string[];   // user IDs who voted
  submittedBy?: string;    // user ID who added this member
  submittedAt?: string;
}
