import type { fireFlower, Prisma, User } from '@prisma/client';
import type { DtoId } from 'common/types/brandedId';
import { fireFlowerValidator } from 'common/validators/fireFlower';
import { brandedId } from 'service/brandedId';
import type { FireFlowerEntity, LikedFireFlowerDeleteServerVal } from '../model/fireFlowerType';

const toEntity = (prismaFireFlower: fireFlower & { Creator: User }): FireFlowerEntity => ({
  id: brandedId.fireFlower.entity.parse(prismaFireFlower.id),
  name: prismaFireFlower.name,
  createdAt: prismaFireFlower.createdAt.getTime(),
  updatedAt: prismaFireFlower.updatedAt?.getTime() ?? undefined,
  structure: fireFlowerValidator.parse(prismaFireFlower.structure),
  creator: {
    id: brandedId.user.entity.parse(prismaFireFlower.creatorId),
    signInName: prismaFireFlower.Creator.signInName,
  },
});
const listByCreatedAt = async (
  tx: Prisma.TransactionClient,
  limit?: number,
): Promise<FireFlowerEntity[]> => {
  const prismaFireFlowers = await tx.fireFlower.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { Creator: true },
  });

  return prismaFireFlowers.map(toEntity);
};

const listByLiker = async (
  tx: Prisma.TransactionClient,
  likerId: DtoId['user'],
  limit?: number,
): Promise<FireFlowerEntity[]> => {
  const prismaFireFlowers = await tx.fireFlower.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { Creator: true },
    where: {
      likedBy: {
        some: { userId: brandedId.user.entity.parse(likerId) },
      },
    },
  });

  return prismaFireFlowers.map(toEntity);
};

const findByFireFlowerId = async (
  tx: Prisma.TransactionClient,
  fireFlowerId: DtoId['fireFlower'],
  likerId: DtoId['user'],
): Promise<LikedFireFlowerDeleteServerVal | null> => {
  const prismaFireFlowers = await tx.likedFireFlower.findUnique({
    where: {
      userId_fireFlowerId: {
        fireFlowerId: brandedId.fireFlower.entity.parse(fireFlowerId),
        userId: brandedId.user.entity.parse(likerId),
      },
    },
  });
  return (
    prismaFireFlowers && {
      id: brandedId.likedFireFlower.entity.parse(prismaFireFlowers.id),
      userId: brandedId.user.entity.parse(prismaFireFlowers.userId),
    }
  );
};

export const fireFlowerQuery = {
  listByCreatedAt,
  listByLiker,
  findById: async (tx: Prisma.TransactionClient, fireFlowerId: string): Promise<FireFlowerEntity> =>
    tx.fireFlower
      .findUniqueOrThrow({ where: { id: fireFlowerId }, include: { Creator: true } })
      .then(toEntity),

  findByCreatorId: async (
    tx: Prisma.TransactionClient,
    creatorId: DtoId['user'],
  ): Promise<FireFlowerEntity[]> => {
    const prismaFireFlowers = await tx.fireFlower.findMany({
      where: {
        creatorId: brandedId.user.entity.parse(creatorId),
      },
      include: { Creator: true },
    });

    return prismaFireFlowers.map(toEntity);
  },
  like: {
    findByFireFlowerId,
  },
};
