import { WebSocket } from 'ws';

export type UserWs = {
  name: string;
  password: string;
};

export type User = {
  index: string;
  name: string;
  password: string;
  score: number;
  ws: WebSocket | null;
  bot: boolean;
};

export type Winner = {
  name: string;
  wins: number;
};

export const emptyUser = (): User => {
  return {
    index: '',
    name: '',
    password: '',
    score: 0,
    ws: null,
    bot: false,
  };
};

export type PlayerMessage = {
  isCorrect: boolean;
  user: User;
  message: string;
};

export const playerMessage = (): PlayerMessage => {
  return {
    isCorrect: false,
    user: emptyUser(),
    message: '',
  };
};

export class Users {
  private _records: Map<string, User> = new Map();
  private _instance: Users;

  public constructor() {
    if (!this._instance) this._instance = this;
    return this._instance;
  }

  public userFromUserWs = (userWs: UserWs, uws: WebSocket): User => {
    const newUser = { ...emptyUser(), ...userWs };
    newUser.ws = uws;
    return newUser;
  };

  public reg = (newUser: User): PlayerMessage => {
    const check = this.checkNewUserInMessage(newUser);
    if (!check.isCorrect) {
      return check;
    }

    const result = this.getUserByIndex(newUser.name);

    if (!result.isCorrect) {
      result.user = this.addUser(newUser);
      result.message = `New user ${result.user.name} added. User logged`;
      result.isCorrect = true;
      return result;
    }

    if (!this.checkUserByIndexAndPassword(newUser.name, newUser.password)) {
      result.user = emptyUser();
      result.message = `User with given name and password not found`;
      result.isCorrect = false;
      return result;
    }

    if (result.user.ws) {
      result.user = emptyUser();
      result.message = `User with given name and password already logged`;
      result.isCorrect = false;
      return result;
    }

    result.user.ws = newUser.ws;
    result.message = `User ${result.user.name} logged in`;
    return result;
  };

  public regOut = (newUser: User): PlayerMessage => {
    const check = this.checkNewUserInMessage(newUser);
    if (!check.isCorrect) {
      return check;
    }

    const result = this.getUserByIndex(newUser.name);

    if (!result.isCorrect) {
      return result;
    }

    if (!result.user.ws) {
      return result;
    }

    result.user.ws = null;
    result.message = `User ${result.user.name} logged out`;

    return result;
  };

  public addUser = (newUser: User): User => {
    const user = { ...newUser };
    const index = newUser.name;
    user.index = index;
    this._records.set(index, user);
    return user;
  };

  public getUserByIndex = (index: string): PlayerMessage => {
    const result = playerMessage();
    if (!index) {
      result.isCorrect = false;
      result.message = 'Incorrect User information received';
      return result;
    }
    const user = this._records.get(index);
    if (!user) {
      result.isCorrect = false;
      result.message = 'User not found';
      return result;
    }
    result.isCorrect = true;
    result.user = user;

    return result;
  };

  public deleteUser = (index: string): PlayerMessage => {
    const playerMessage = this.getUserByIndex(index);
    if (!playerMessage.isCorrect) return playerMessage;
    this._records.delete(index);
    playerMessage.isCorrect = true;
    playerMessage.message = '';
    return playerMessage;
  };

  public addScore = (index: string): PlayerMessage => {
    const result = this.getUserByIndex(index);
    if (!result.isCorrect) {
      return result;
    }
    const user = result.user;
    user.score += 1;

    result.isCorrect = true;
    result.user = user;

    return result;
  };

  public getAllOnlineUsers = (): User[] => {
    const models: User[] = [];
    this._records.forEach((record: User) => {
      if (record.ws) models.push(record);
    });
    return models;
  };

  public getAllWinners = (): Winner[] => {
    const models: Winner[] = [];
    this._records.forEach((record: User) => {
      if (record.score > 0) models.push({ name: record.name, wins: record.score });
    });
    models.sort((a, b) => {
      return b.wins - a.wins;
    });
    return models;
  };

  public getUserByWs = (uws: WebSocket): PlayerMessage => {
    const result = playerMessage();
    if (!uws) {
      result.isCorrect = false;
      result.message = 'Incorrect User socket received';
      return result;
    }
    let user = emptyUser();
    this._records.forEach((record: User) => {
      if (record.ws === uws) user = record;
    });
    if (!user.index) {
      result.isCorrect = false;
      result.message = 'User not found';
      return result;
    }
    result.isCorrect = true;
    result.user = user;

    return result;
  };

  public checkUserByIndexAndPassword = (index: string, password: string): boolean => {
    if (!index) return false;
    const user = this._records.get(index);
    if (!user) return false;
    return user.password === password;
  };

  public checkNewUserInMessage = (newUser: User): PlayerMessage => {
    const result = playerMessage();
    result.user = newUser;
    if (newUser.name.length < 5 || !newUser.password) {
      result.isCorrect = false;
      result.message = 'Incorrect User information received';
      return result;
    }
    result.isCorrect = true;
    return result;
  };
}
