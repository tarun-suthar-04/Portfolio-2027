import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { AuditAction, AuditResourceType } from './adminValidation';
import { isValidDocId } from './adminValidation';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<'connected' | 'offline'> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return 'connected';
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('the client is offline')) {
      console.error('Please check your Firebase configuration. Firestore client is offline.');
      return 'offline';
    }
    // Permission denied or not-found proves Firestore server responded with rules enforced
    return 'connected';
  }
}

export async function recordAuditLog(params: {
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  summary: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email || !user.emailVerified) return;

  const safeResourceId = isValidDocId(params.resourceId) ? params.resourceId : 'unknown';
  const safeSummary = params.summary.trim().slice(0, 240);
  if (safeSummary.length < 3) return;

  try {
    await addDoc(collection(db, 'audit_logs'), {
      actorUid: user.uid,
      actorEmail: user.email,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: safeResourceId,
      summary: safeSummary,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Audit log write failed:', error);
  }
}
