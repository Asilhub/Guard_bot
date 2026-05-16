import { Context, SessionFlavor } from 'grammy';
import { HydrateFlavor } from '@grammyjs/hydrate';
import { ConversationFlavor } from '@grammyjs/conversations';
import { Group, GroupSettings, GroupMember, User, Role } from '@prisma/client';

// ─── Session ──────────────────────────────────────────────────────────────────

export interface SessionData {
  // Conversation state
  __language_code?: string;
}

// ─── Custom Context ───────────────────────────────────────────────────────────

type BaseContext = HydrateFlavor<Context> & SessionFlavor<SessionData>;

export type BotContext = ConversationFlavor<BaseContext> & {
  group?: GroupWithSettings;
  dbUser?: User;
  memberRole?: Role;
};

// ─── Extended Types ───────────────────────────────────────────────────────────

export type GroupWithSettings = Group & {
  settings: GroupSettings | null;
};

export type GroupMemberWithUser = GroupMember & {
  user: User;
};

// ─── Punishment ───────────────────────────────────────────────────────────────

export interface PunishmentOptions {
  groupId: string;
  userId: string;
  telegramGroupId: bigint;
  telegramUserId: number;
  reason?: string;
  duration?: number;
  issuedBy: number;
}

// ─── Spam Detection ───────────────────────────────────────────────────────────

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
  score: number;
}

export interface FloodTracker {
  count: number;
  windowStart: number;
}

// ─── Protection ───────────────────────────────────────────────────────────────

export interface AccountCheckResult {
  isSuspicious: boolean;
  reason?: string;
  confidence: number;
}

// ─── Plugin System ────────────────────────────────────────────────────────────

export interface Plugin {
  name: string;
  version: string;
  description: string;
  load(bot: unknown): void | Promise<void>;
  unload?(): void | Promise<void>;
}

// ─── Command ─────────────────────────────────────────────────────────────────

export interface CommandMeta {
  command: string;
  description: string;
  adminOnly?: boolean;
  groupOnly?: boolean;
}

// ─── Log Details ─────────────────────────────────────────────────────────────

export interface DeletedMessageDetails {
  messageId: number;
  text?: string;
  reason: string;
}

export interface AdminActionDetails {
  action: string;
  targetUserId?: number;
  details?: Record<string, unknown>;
}
