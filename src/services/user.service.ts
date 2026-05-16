import { prisma } from '../database/prisma';
import { User, GroupMember, Role } from '@prisma/client';

export class UserService {
  async getOrCreate(
    telegramId: bigint,
    firstName?: string,
    lastName?: string,
    username?: string,
    isBot = false,
  ): Promise<User> {
    return prisma.user.upsert({
      where: { telegramId },
      update: { firstName, lastName, username },
      create: { telegramId, firstName, lastName, username, isBot },
    });
  }

  async getByTelegramId(telegramId: bigint): Promise<User | null> {
    return prisma.user.findUnique({ where: { telegramId } });
  }

  async getMember(groupId: string, userId: string): Promise<GroupMember | null> {
    return prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
  }

  async getOrCreateMember(groupId: string, userId: string, role = Role.MEMBER): Promise<GroupMember> {
    return prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      update: {},
      create: { groupId, userId, role },
    });
  }

  async setRole(groupId: string, userId: string, role: Role): Promise<GroupMember> {
    return prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      update: { role },
      create: { groupId, userId, role },
    });
  }

  async blacklist(groupId: string, userId: string, isBlacklisted: boolean): Promise<void> {
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      update: { isBlacklisted },
      create: { groupId, userId, isBlacklisted },
    });
  }

  async whitelist(groupId: string, userId: string, isWhitelisted: boolean): Promise<void> {
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      update: { isWhitelisted },
      create: { groupId, userId, isWhitelisted },
    });
  }

  async isBlacklisted(groupId: string, userId: string): Promise<boolean> {
    const member = await this.getMember(groupId, userId);
    return member?.isBlacklisted ?? false;
  }

  async isWhitelisted(groupId: string, userId: string): Promise<boolean> {
    const member = await this.getMember(groupId, userId);
    return member?.isWhitelisted ?? false;
  }
}

export const userService = new UserService();
