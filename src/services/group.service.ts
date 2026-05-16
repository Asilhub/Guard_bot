import { prisma } from '../database/prisma';
import { cacheService } from './cache.service';
import { GroupWithSettings } from '../types';
import { Group, GroupSettings } from '@prisma/client';

export class GroupService {
  async getOrCreate(telegramId: bigint, title: string, username?: string): Promise<GroupWithSettings> {
    const cached = await cacheService.getGroup<GroupWithSettings>(telegramId);
    if (cached) return cached;

    let group = await prisma.group.findUnique({
      where: { telegramId },
      include: { settings: true },
    });

    if (!group) {
      group = await prisma.group.create({
        data: {
          telegramId,
          title,
          username,
          settings: { create: {} },
        },
        include: { settings: true },
      });
    } else if (group.title !== title || group.username !== username) {
      group = await prisma.group.update({
        where: { id: group.id },
        data: { title, username },
        include: { settings: true },
      });
    }

    await cacheService.setGroup(telegramId, group);
    return group as GroupWithSettings;
  }

  async getById(id: string): Promise<GroupWithSettings | null> {
    return prisma.group.findUnique({
      where: { id },
      include: { settings: true },
    }) as Promise<GroupWithSettings | null>;
  }

  async getByTelegramId(telegramId: bigint): Promise<GroupWithSettings | null> {
    const cached = await cacheService.getGroup<GroupWithSettings>(telegramId);
    if (cached) return cached;

    const group = await prisma.group.findUnique({
      where: { telegramId },
      include: { settings: true },
    });

    if (group) await cacheService.setGroup(telegramId, group);
    return group as GroupWithSettings | null;
  }

  async updateSettings(groupId: string, data: Partial<GroupSettings>): Promise<GroupSettings> {
    const settings = await prisma.groupSettings.update({
      where: { groupId },
      data,
    });

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (group) await cacheService.invalidateGroup(group.telegramId);

    return settings;
  }

  async deactivate(telegramId: bigint): Promise<void> {
    await prisma.group.update({
      where: { telegramId },
      data: { isActive: false },
    });
    await cacheService.invalidateGroup(telegramId);
  }
}

export const groupService = new GroupService();
