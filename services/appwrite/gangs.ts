import { ID, Query } from 'react-native-appwrite';
import { databases, DATABASE_ID, COLLECTIONS } from './client';
import { GangMember } from '../../types';

const CONFIRMED_THRESHOLD = 3;

// ─── Mapper ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToMember(doc: any): GangMember {
  return {
    id:                 doc.$id,
    alias:              doc.alias,
    realName:           doc.realName ?? undefined,
    gang:               doc.gang,
    territory:          doc.territory ?? [],
    dangerLevel:        doc.dangerLevel as 1 | 2 | 3 | 4,
    status:             doc.status,
    charges:            doc.charges ?? [],
    lastSeen:           doc.lastSeen ?? undefined,
    description:        doc.description,
    photoUri:           doc.photoUri ?? undefined,
    dcpjRef:            doc.dcpjRef ?? undefined,
    verificationStatus: doc.verificationStatus,
    confirmations:      doc.confirmations,
    confirmedBy:        doc.confirmedBy ?? [],
    submittedBy:        doc.submittedBy ?? undefined,
    submittedAt:        doc.submittedAt ?? undefined,
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function fetchGangMembers(): Promise<GangMember[]> {
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.GANG_MEMBERS,
    [Query.orderDesc('$createdAt'), Query.limit(100)],
  );
  return res.documents.map(docToMember);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createGangMember(
  data: Omit<GangMember, 'id' | 'verificationStatus' | 'confirmations' | 'confirmedBy' | 'submittedAt'>,
): Promise<GangMember> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.GANG_MEMBERS,
    ID.unique(),
    {
      alias:              data.alias,
      realName:           data.realName ?? null,
      gang:               data.gang,
      territory:          data.territory,
      dangerLevel:        data.dangerLevel,
      status:             data.status,
      charges:            data.charges,
      lastSeen:           data.lastSeen ?? null,
      description:        data.description,
      photoUri:           data.photoUri ?? null,
      dcpjRef:            data.dcpjRef ?? null,
      verificationStatus: 'pending',
      confirmations:      0,
      confirmedBy:        [],
      submittedBy:        data.submittedBy ?? null,
      submittedAt:        new Date().toISOString(),
    },
  );
  return docToMember(doc);
}

/**
 * Cast a verification vote for a gang member.
 * Prevents duplicate votes and promotes to 'confirmed' after CONFIRMED_THRESHOLD votes.
 */
export async function voteForGangMemberRemote(
  memberId: string,
  userId: string,
): Promise<GangMember> {
  // Guard against duplicate vote
  const existing = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.GANG_VOTES,
    [Query.equal('memberId', memberId), Query.equal('userId', userId)],
  );
  if (existing.total > 0) throw new Error('Déjà voté');

  await databases.createDocument(DATABASE_ID, COLLECTIONS.GANG_VOTES, ID.unique(), {
    memberId,
    userId,
    timestamp: new Date().toISOString(),
  });

  const memberDoc = await databases.getDocument(
    DATABASE_ID,
    COLLECTIONS.GANG_MEMBERS,
    memberId,
  );
  const confirmedBy = [...(memberDoc.confirmedBy ?? []), userId];
  const confirmations = confirmedBy.length;
  const verificationStatus = confirmations >= CONFIRMED_THRESHOLD ? 'confirmed' : 'pending';

  const updated = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.GANG_MEMBERS,
    memberId,
    { confirmedBy, confirmations, verificationStatus },
  );
  return docToMember(updated);
}
