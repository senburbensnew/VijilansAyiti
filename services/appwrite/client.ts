import { Client, Account, Databases } from 'react-native-appwrite';

export const APPWRITE_ENDPOINT =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID =
  process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? '';
export const DATABASE_ID =
  process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? 'vijilans_db';

// Collection IDs — must match what you created in the Appwrite console
export const COLLECTIONS = {
  ALERTS:        'alerts',
  CONFIRMATIONS: 'confirmations',
  DISPUTES:      'disputes',
  GANG_MEMBERS:  'gang_members',
  GANG_VOTES:    'gang_votes',
  USER_PROFILES: 'user_profiles',
} as const;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account   = new Account(client);
export const databases = new Databases(client);

export default client;
