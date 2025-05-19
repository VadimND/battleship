import { User } from './users';

export type RoomUser = { name: string; index: string; bot: boolean };

export const roomUser = (): RoomUser => {
  return {
    name: '',
    index: '',
    bot: false,
  };
};

export type Room = {
  roomId: number;
  roomUsers: RoomUser[];
};

export const emptyRoom = (): Room => {
  return {
    roomId: 0,
    roomUsers: [],
  };
};

export type RoomMessage = {
  isCorrect: boolean;
  room: Room;
  message: string;
};

export const roomMessage = (): RoomMessage => {
  return {
    isCorrect: false,
    room: emptyRoom(),
    message: '',
  };
};

export class Rooms {
  private _nextIndex = 1;
  private _records: Map<number, Room> = new Map();
  private _instance: Rooms;

  public constructor() {
    if (!this._instance) this._instance = this;
    return this._instance;
  }

  public roomUserFromUser = (user: User): RoomUser => {
    const result = roomUser();
    result.index = user.index;
    result.name = user.name;
    result.bot = user.bot;
    return result;
  };

  public createRoom = (roomUser: RoomUser): RoomMessage => {
    const result = roomMessage();

    const check = this.checkUserAlreadyInRoom(roomUser.index as string);
    if (check) {
      result.isCorrect = false;
      result.message = 'Failed to create room. User already in room';
      return result;
    }

    result.room.roomUsers.push(roomUser);
    result.room.roomId = this._nextIndex;
    result.isCorrect = true;
    this._records.set(result.room.roomId, result.room);
    this._nextIndex += 1;
    return result;
  };

  kickUserFrommAllRooms = (indexUser: string): boolean => {
    if (!indexUser) return false;
    if (!this.checkUserAlreadyInRoom(indexUser)) return false;
    const result = true;
    this._records.forEach((record: Room) => {
      record.roomUsers = record.roomUsers.filter((user) => user.index !== indexUser);
    });
    return result;
  };

  checkUserAlreadyInRoom = (indexUser: string): boolean => {
    if (!indexUser) return false;
    let result = false;
    this._records.forEach((record: Room) => {
      if (record.roomUsers.filter((user) => user.index === indexUser).length) result = true;
    });
    return result;
  };

  closeUserRoom = (indexUser: string): boolean => {
    if (!indexUser) return false;
    let result = false;
    let indexRoom = 0;
    this._records.forEach((record: Room) => {
      if (record.roomUsers.filter((user) => user.index === indexUser).length) indexRoom = record.roomId;
    });
    if (indexRoom > 0) {
      result = this.closeRoom(indexRoom).isCorrect;
    }
    return result;
  };

  public addUserToRoom = (roomIndex: number, roomUser: RoomUser): RoomMessage => {
    const result = this.getRoomByIndex(roomIndex);
    if (!result.isCorrect) return result;

    if (result.room.roomUsers.filter((user) => user.index === roomUser.index).length) {
      result.isCorrect = false;
      result.message = 'User already in this room';
      return result;
    }

    this.closeUserRoom(roomUser.index as string);

    result.room.roomUsers.push(roomUser);
    return result;
  };

  getRoomByIndex = (index: number): RoomMessage => {
    const result = roomMessage();
    if (!index) {
      result.isCorrect = false;
      result.message = 'Incorrect Room index received';
      return result;
    }
    const room = this._records.get(index);
    if (!room) {
      result.isCorrect = false;
      result.message = 'Room not found';
      return result;
    }
    result.isCorrect = true;
    result.room = room;

    return result;
  };

  public closeRoom = (index: number): RoomMessage => {
    const roomMessage = this.getRoomByIndex(index);
    if (!roomMessage.isCorrect) return roomMessage;
    this._records.delete(index);
    roomMessage.isCorrect = true;
    roomMessage.message = '';
    return roomMessage;
  };

  public getAvailableRooms = (): Room[] => {
    const result: Room[] = [];
    this._records.forEach((record: Room) => {
      if (record.roomUsers.length === 1) result.push(record);
    });

    return result;
  };
}
