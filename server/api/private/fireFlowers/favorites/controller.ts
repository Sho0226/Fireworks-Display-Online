import { fireFlowerQuery } from 'domain/fireFlower/repository/fireFlowerQuery';
import { toFireFlowersDto } from 'domain/fireFlower/service/toFireFlowerDto';
import { prismaClient } from 'service/prismaClient';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ user }) => ({
    status: 200,
    body: await fireFlowerQuery.listByLiker(prismaClient, user.id).then(toFireFlowersDto),
  }),
}));
