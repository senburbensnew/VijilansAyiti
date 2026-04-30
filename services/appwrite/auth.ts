import { ID } from 'react-native-appwrite';
import { account, databases, DATABASE_ID, COLLECTIONS } from './client';
import { User, UserRole } from '../../types';

const PSEUDO_PREFIXES = ['Veye', 'Sitwayan', 'Sentinèl', 'Patriyot', 'Defansè', 'Gad'];

function generatePseudo(): string {
  const prefix = PSEUDO_PREFIXES[Math.floor(Math.random() * PSEUDO_PREFIXES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}#${num}`;
}

// ─── OTP flows ───────────────────────────────────────────────────────────────

/** Send OTP via SMS. Returns the Appwrite userId to use in verifyOtp(). */
export async function sendPhoneOtp(phone: string): Promise<string> {
  const token = await account.createPhoneToken(ID.unique(), phone);
  return token.userId;
}

/** Send OTP via email. Returns the Appwrite userId to use in verifyOtp(). */
export async function sendEmailOtp(email: string): Promise<string> {
  const token = await account.createEmailToken(ID.unique(), email);
  return token.userId;
}

/**
 * Verify the OTP the user entered.
 * Creates the Appwrite session and returns the full User profile.
 */
export async function verifyOtp(userId: string, otp: string): Promise<User> {
  await account.createSession(userId, otp);
  return getCurrentUser();
}

// ─── Session helpers ──────────────────────────────────────────────────────────

/** Load the current authenticated user (called on app start). */
export async function getCurrentUser(): Promise<User> {
  const appUser = await account.get();

  let profile: Record<string, unknown>;
  try {
    profile = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.USER_PROFILES,
      appUser.$id,
    );
  } catch {
    // First login — create a default profile with auto-generated pseudo
    profile = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USER_PROFILES,
      appUser.$id,
      {
        pseudo:           generatePseudo(),
        role:             'user',
        trustScore:       50,
        reportCount:      0,
        validatedReports: 0,
        falseReports:     0,
        isVerified:       true,
        isBanned:         false,
      },
    );
  }

  return mapToUser(appUser, profile);
}

/** Delete the current session (logout). */
export async function logout(): Promise<void> {
  await account.deleteSession('current');
}

// ─── Mapper ──────────────────────────────────────────────────────────────────

/** Update the pseudo for the current user. */
export async function updatePseudo(userId: string, pseudo: string): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.USER_PROFILES, userId, { pseudo });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToUser(appUser: any, profile: any): User {
  const pseudo = profile.pseudo || generatePseudo();
  return {
    id:               appUser.$id,
    phone:            appUser.phone ?? '',
    pseudo,
    displayName:      pseudo,
    role:             (profile.role as UserRole) ?? 'user',
    trustScore:       profile.trustScore ?? 50,
    reportCount:      profile.reportCount ?? 0,
    validatedReports: profile.validatedReports ?? 0,
    falseReports:     profile.falseReports ?? 0,
    createdAt:        appUser.$createdAt,
    isVerified:       profile.isVerified ?? false,
    isBanned:         profile.isBanned ?? false,
  };
}
