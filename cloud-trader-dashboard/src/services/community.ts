import {
  collection,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  addDoc,
  type Firestore,
} from 'firebase/firestore';
import { type User } from 'firebase/auth';
import { firestore, firestoreEnabled } from '../firebase';

export interface LeaderboardEntry {
  publicId: string;
  displayName: string;
  avatarUrl?: string;
  points: number;
  lastActive?: string;
  checkIns?: number;
  comments?: number;
  votes?: number;
}

export interface SentimentSnapshot {
  dateKey: string;
  bullish: number;
  bearish: number;
  total: number;
  hasVoted: boolean;
}

export interface CommunityComment {
  id: string;
  publicId: string;
  displayName: string;
  message: string;
  createdAt: string;
  avatarUrl?: string;
  mentionedTickers: string[];
}

const COLLECTION_MEMBERS = 'community_members';
const COLLECTION_COMMENTS = 'community_comments';
const SENTIMENT_DOC_PATH = 'community_sentiment/current';

const POINTS = {
  checkIn: 10,
  vote: 2,
  comment: 5,
};

const MAX_VOTER_TRACK = 5000;

const getDateKey = (): string => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

const ensureFirestore = (): Firestore => {
  if (!firestoreEnabled || !firestore) {
    throw new Error('Realtime community features unavailable: Firestore not configured');
  }
  return firestore;
};

const sanitizeDisplayName = (input?: string | null): string => {
  if (!input) return 'Anon Builder';
  return input.replace(/[^\w\s@.-]/g, '').slice(0, 48) || 'Anon Builder';
};

const hashUid = (uid: string): string => {
  // Lightweight hash to avoid exposing Firebase UID directly
  let hash = 0;
  for (let i = 0; i < uid.length; i += 1) {
    hash = (hash << 5) - hash + uid.charCodeAt(i);
    hash |= 0; // Convert to 32bit int
  }
  return `member-${Math.abs(hash).toString(36).padStart(8, '0')}`;
};

const parseTickers = (message: string): string[] => {
  const matches = message.match(/\$[A-Za-z]{2,10}/g) ?? [];
  return Array.from(new Set(matches.map((token) => token.replace('$', '').toUpperCase()))).slice(0, 10);
};

export const ensureMemberProfile = async (user: User): Promise<string> => {
  const db = ensureFirestore();
  const memberDoc = doc(db, COLLECTION_MEMBERS, user.uid);
  const snapshot = await getDoc(memberDoc);
  const publicId = hashUid(user.uid);

  if (!snapshot.exists()) {
    await setDoc(memberDoc, {
      publicId,
      displayName: sanitizeDisplayName(user.displayName || user.email),
      avatarUrl: user.photoURL || null,
      points: 0,
      checkIns: 0,
      comments: 0,
      votes: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
  } else {
    const data = snapshot.data();
    if (!data.publicId) {
      await updateDoc(memberDoc, { publicId });
    }
  }

  return publicId;
};

export const recordCheckIn = async (user: User): Promise<void> => {
  const db = ensureFirestore();
  const today = getDateKey();
  const memberDoc = doc(db, COLLECTION_MEMBERS, user.uid);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(memberDoc);
    const now = serverTimestamp();

    if (!snapshot.exists()) {
      transaction.set(memberDoc, {
        publicId: hashUid(user.uid),
        displayName: sanitizeDisplayName(user.displayName || user.email),
        avatarUrl: user.photoURL || null,
        points: POINTS.checkIn,
        checkIns: 1,
        lastCheckIn: today,
        comments: 0,
        votes: 0,
        createdAt: now,
        updatedAt: now,
        lastActive: now,
      });
      return;
    }

    const data = snapshot.data();
    if (data.lastCheckIn === today) {
      transaction.update(memberDoc, { lastActive: now, updatedAt: now });
      return;
    }

    transaction.update(memberDoc, {
      points: increment(POINTS.checkIn),
      checkIns: increment(1),
      lastCheckIn: today,
      updatedAt: now,
      lastActive: now,
    });
  });
};

export const subscribeSentiment = (
  user: User | null,
  callback: (snapshot: SentimentSnapshot) => void,
) => {
  const db = ensureFirestore();
  const sentimentDoc = doc(db, SENTIMENT_DOC_PATH);

  return onSnapshot(sentimentDoc, (snapshot) => {
    const today = getDateKey();
    let data = snapshot.data() as
      | { dateKey: string; bullish: number; bearish: number; total: number; voterIds?: Record<string, string> }
      | undefined;

    if (!data) {
      data = { dateKey: today, bullish: 0, bearish: 0, total: 0, voterIds: {} };
    }

    if (data.dateKey !== today) {
      // Reset stale data for observers (write happens lazily on next vote)
      data = { dateKey: today, bullish: 0, bearish: 0, total: 0, voterIds: {} };
    }

    const hasVoted = Boolean(user && data.voterIds && data.voterIds[user.uid]);

    callback({
      dateKey: data.dateKey,
      bullish: data.bullish || 0,
      bearish: data.bearish || 0,
      total: data.total || 0,
      hasVoted,
    });
  });
};

export const castVote = async (user: User, vote: 'bullish' | 'bearish'): Promise<void> => {
  const db = ensureFirestore();
  const sentimentDoc = doc(db, SENTIMENT_DOC_PATH);
  const memberDoc = doc(db, COLLECTION_MEMBERS, user.uid);
  const today = getDateKey();

  await runTransaction(db, async (transaction) => {
    const sentimentSnap = await transaction.get(sentimentDoc);
    let sentiment = sentimentSnap.data() as
      | { dateKey: string; bullish: number; bearish: number; total: number; voterIds?: Record<string, string> }
      | undefined;

    if (!sentiment || sentiment.dateKey !== today) {
      sentiment = { dateKey: today, bullish: 0, bearish: 0, total: 0, voterIds: {} };
    }

    if (sentiment.voterIds && sentiment.voterIds[user.uid]) {
      return;
    }

    const voterIds = sentiment.voterIds ?? {};
    if (Object.keys(voterIds).length >= MAX_VOTER_TRACK) {
      // Prevent uncontrolled growth: remove oldest entry
      const [firstKey] = Object.keys(voterIds);
      if (firstKey) {
        delete voterIds[firstKey];
      }
    }

    voterIds[user.uid] = vote;

    const updates: Record<string, unknown> = {
      dateKey: today,
      total: (sentiment.total || 0) + 1,
      voterIds,
      updatedAt: serverTimestamp(),
    };

    if (vote === 'bullish') {
      updates.bullish = (sentiment.bullish || 0) + 1;
      updates.bearish = sentiment.bearish || 0;
    } else {
      updates.bearish = (sentiment.bearish || 0) + 1;
      updates.bullish = sentiment.bullish || 0;
    }

    transaction.set(sentimentDoc, updates, { merge: true });

    const memberSnap = await transaction.get(memberDoc);
    if (memberSnap.exists()) {
      transaction.update(memberDoc, {
        points: increment(POINTS.vote),
        votes: increment(1),
        lastActive: serverTimestamp(),
      });
    } else {
      transaction.set(
        memberDoc,
        {
          publicId: hashUid(user.uid),
          displayName: sanitizeDisplayName(user.displayName || user.email),
          avatarUrl: user.photoURL || null,
          points: POINTS.vote,
          votes: 1,
          comments: 0,
          checkIns: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        },
        { merge: true },
      );
    }
  });
};

export const subscribeLeaderboard = (
  callback: (entries: LeaderboardEntry[]) => void,
  limitSize = 10,
) => {
  const db = ensureFirestore();
  const leaderboardQuery = query(
    collection(db, COLLECTION_MEMBERS),
    orderBy('points', 'desc'),
    limit(limitSize),
  );

  return onSnapshot(leaderboardQuery, (snapshot) => {
    const entries: LeaderboardEntry[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        publicId: data.publicId ?? hashUid(docSnap.id),
        displayName: data.displayName ?? 'Anon Builder',
        avatarUrl: data.avatarUrl ?? undefined,
        points: data.points ?? 0,
        lastActive: data.lastActive?.toDate?.()?.toISOString?.() ?? undefined,
        checkIns: data.checkIns ?? 0,
        comments: data.comments ?? 0,
        votes: data.votes ?? 0,
      } satisfies LeaderboardEntry;
    });
    callback(entries);
  });
};

export const subscribeCommunityComments = (
  callback: (comments: CommunityComment[]) => void,
  limitSize = 50,
) => {
  const db = ensureFirestore();
  const commentsQuery = query(
    collection(db, COLLECTION_COMMENTS),
    orderBy('createdAt', 'desc'),
    limit(limitSize),
  );

  return onSnapshot(commentsQuery, (snapshot) => {
    const comments: CommunityComment[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        publicId: data.publicId ?? 'anon',
        displayName: data.displayName ?? 'Anon Builder',
        message: data.message ?? '',
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
        avatarUrl: data.avatarUrl ?? undefined,
        mentionedTickers: data.mentionedTickers ?? [],
      } satisfies CommunityComment;
    });
    callback(comments);
  });
};

export const addCommunityComment = async (user: User, message: string): Promise<void> => {
  const db = ensureFirestore();
  const sanitized = message.trim();
  if (!sanitized) return;

  await ensureMemberProfile(user);

  const mentionedTickers = parseTickers(sanitized);
  const comment = {
    userId: user.uid,
    publicId: hashUid(user.uid),
    displayName: sanitizeDisplayName(user.displayName || user.email),
    avatarUrl: user.photoURL || null,
    message: sanitized,
    mentionedTickers,
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(db, COLLECTION_COMMENTS), comment);
  await updateDoc(doc(db, COLLECTION_MEMBERS, user.uid), {
    points: increment(POINTS.comment),
    comments: increment(1),
    lastActive: serverTimestamp(),
  });
};

export const isRealtimeCommunityEnabled = (): boolean => firestoreEnabled;

