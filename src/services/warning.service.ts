import { prisma } from '../database/prisma';
import { Warning } from '@prisma/client';

export class WarningService {
  async add(groupId: string, userId: string, issuedBy: number, reason?: string): Promise<Warning> {
    return prisma.warning.create({
      data: { groupId, userId, issuedBy: BigInt(issuedBy), reason },
    });
  }

  async count(groupId: string, userId: string): Promise<number> {
    return prisma.warning.count({
      where: { groupId, userId, isActive: true },
    });
  }

  async list(groupId: string, userId: string): Promise<Warning[]> {
    return prisma.warning.findMany({
      where: { groupId, userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async removeLatest(groupId: string, userId: string): Promise<boolean> {
    const latest = await prisma.warning.findFirst({
      where: { groupId, userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) return false;

    await prisma.warning.update({
      where: { id: latest.id },
      data: { isActive: false },
    });
    return true;
  }

  async removeAll(groupId: string, userId: string): Promise<number> {
    const result = await prisma.warning.updateMany({
      where: { groupId, userId, isActive: true },
      data: { isActive: false },
    });
    return result.count;
  }
}

export const warningService = new WarningService();
