import { RoomStatus } from '@prisma/client';
import assert from 'assert';
import type { UserDto } from 'common/types/user';
import {
  roomNameValidator,
  roomPasswordValidator,
  roomStatusValidator,
} from 'common/validators/room';
import { brandedId } from 'service/brandedId';
import { ulid } from 'ulid';
import type {
  RoomCreateServerVal,
  RoomEnterSaveVal,
  RoomEntity,
  RoomExitSaveVal,
  RoomFoundVal,
  RoomSaveVal,
  UserInRoomFoundVal,
} from './roomType';

export const roomMethod = {
  create: (user: UserDto, val: RoomCreateServerVal): RoomSaveVal => {
    const room: RoomEntity = {
      id: brandedId.room.entity.parse(ulid()),
      name: roomNameValidator.parse(val.name),
      password: roomPasswordValidator.parse(val.password),
      status: roomStatusValidator.parse(val.status),
      creator: { id: brandedId.user.entity.parse(user.id), signInName: user.signInName },
      createdAt: Date.now(),
      updatedAt: undefined,
      lastUsedAt: undefined,
    };
    assert(
      (val.password === undefined && val.status !== RoomStatus['PRIVATE']) ||
        (val.password !== undefined && val.status === RoomStatus['PRIVATE']),
    );
    return { savable: true, room };
  },
  update: (user: UserDto, room: RoomEntity, val: { name: string }): RoomSaveVal => {
    assert(user.id === String(room.creator.id));
    return {
      savable: true,
      room: { ...room, name: roomNameValidator.parse(val.name), updatedAt: Date.now() },
    };
  },
  find: (room: RoomEntity, password?: string): RoomFoundVal => {
    assert(
      (room.status !== RoomStatus['PRIVATE'] && !password) ||
        (room.status === RoomStatus['PRIVATE'] && password === room.password),
    );
    return { found: true, room };
  },
  findMany: (rooms: RoomEntity[]): RoomEntity[] => {
    assert(rooms.every((room) => roomMethod.find(room).found));
    return rooms;
  },
  entered: (
    user: UserDto,
    { found, room }: RoomFoundVal,
    alreadyEntered: boolean,
  ): RoomEnterSaveVal => {
    assert(!alreadyEntered);
    assert(found);
    const userInRoom = {
      userId: brandedId.user.entity.parse(user.id),
      roomId: room.id,
      enteredAt: Date.now(),
    };
    return { savable: true, room: { ...room, lastUsedAt: Date.now() }, userInRoom };
  },
  exit: (user: UserDto, userInRoom: UserInRoomFoundVal): RoomExitSaveVal => {
    assert(userInRoom.found);
    assert(userInRoom.roomId);
    return {
      deletable: true,
      userInRoomId: brandedId.user.entity.parse(user.id),
      roomId: userInRoom.roomId,
    };
  },
  delete: (user: UserDto, room: RoomEntity): { deletable: boolean; room: RoomEntity } => {
    assert(user.id === String(room.creator.id));
    return { deletable: true, room };
  },
  hasUser: {},
};
