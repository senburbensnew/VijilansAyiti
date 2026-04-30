import { ID, Query } from 'react-native-appwrite';
import { databases, DATABASE_ID, COLLECTIONS } from './client';
import { Alert, AlertCategory, AlertStatus } from '../../types';
import { CONFIRMATIONS_REQUIRED } from '../../constants/config';

// ─── Mapper ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToAlert(doc: any): Alert {
  return {
    id:           doc.$id,
    category:     doc.category as AlertCategory,
    description:  doc.description,
    zone:         doc.zone,
    latitude:     doc.latitude,
    longitude:    doc.longitude,
    reportedAt:   doc.reportedAt,
    publishedAt:  doc.publishedAt ?? undefined,
    status:       doc.status as AlertStatus,
    severity:     doc.severity as 1 | 2 | 3 | 4,
    confirmations: doc.confirmations,
    disputeCount: doc.disputeCount,
    reporterId:   doc.reporterId ?? undefined,
    isAnonymous:  doc.isAnonymous,
    publicView:   doc.publicView,
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function fetchAlerts(): Promise<Alert[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ALERTS, [
    Query.orderDesc('reportedAt'),
    Query.limit(100),
  ]);
  return res.documents.map(docToAlert);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createAlert(data: Omit<Alert, 'id'>): Promise<Alert> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.ALERTS,
    ID.unique(),
    {
      category:     data.category,
      description:  data.description,
      zone:         data.zone,
      latitude:     data.latitude,
      longitude:    data.longitude,
      reportedAt:   data.reportedAt,
      status:       data.status,
      severity:     data.severity,
      confirmations: data.confirmations,
      disputeCount: data.disputeCount,
      reporterId:   data.reporterId ?? null,
      isAnonymous:  data.isAnonymous,
      publicView:   data.publicView,
    },
  );
  return docToAlert(doc);
}

/**
 * Record a confirmation for an alert.
 * Prevents duplicate confirmations per user/device.
 * Publishes the alert once CONFIRMATIONS_REQUIRED is reached.
 * Returns the updated Alert.
 */
export async function confirmAlertRemote(
  alertId: string,
  userId?: string,
  deviceId = 'unknown',
): Promise<Alert> {
  // Guard against duplicate confirmation
  const dupeQuery = userId
    ? [Query.equal('alertId', alertId), Query.equal('userId', userId)]
    : [Query.equal('alertId', alertId), Query.equal('deviceId', deviceId)];

  const existing = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.CONFIRMATIONS,
    dupeQuery,
  );
  if (existing.total > 0) throw new Error('Déjà confirmé');

  await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.CONFIRMATIONS,
    ID.unique(),
    {
      alertId,
      userId:    userId ?? null,
      deviceId,
      timestamp: new Date().toISOString(),
    },
  );

  const alertDoc = await databases.getDocument(
    DATABASE_ID,
    COLLECTIONS.ALERTS,
    alertId,
  );
  const confirmations = alertDoc.confirmations + 1;
  const shouldPublish = confirmations >= CONFIRMATIONS_REQUIRED && !alertDoc.publishedAt;

  const updated = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.ALERTS,
    alertId,
    {
      confirmations,
      ...(shouldPublish
        ? { status: 'active', publishedAt: new Date().toISOString() }
        : {}),
    },
  );
  return docToAlert(updated);
}

/**
 * Record a dispute for an alert.
 * Marks the alert as 'disputed' after 5 disputes.
 */
export async function disputeAlertRemote(
  alertId: string,
  userId?: string,
  reason = '',
): Promise<Alert> {
  await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.DISPUTES,
    ID.unique(),
    {
      alertId,
      userId:    userId ?? null,
      reason,
      timestamp: new Date().toISOString(),
    },
  );

  const alertDoc = await databases.getDocument(
    DATABASE_ID,
    COLLECTIONS.ALERTS,
    alertId,
  );
  const disputeCount = alertDoc.disputeCount + 1;

  const updated = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.ALERTS,
    alertId,
    {
      disputeCount,
      ...(disputeCount >= 5 ? { status: 'disputed' } : {}),
    },
  );
  return docToAlert(updated);
}
