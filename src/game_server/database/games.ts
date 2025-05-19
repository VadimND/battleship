import { Room } from './rooms';

export type ShipType = 'small' | 'medium' | 'large' | 'huge';
export type Ship = {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: ShipType;
};
export const ship = (type: ShipType): Ship => {
  let length = 1;
  if (type === 'huge') length = 4;
  else if (type === 'large') length = 3;
  else if (type === 'medium') length = 2;
  const result = {
    position: {
      x: -1,
      y: -1,
    },
    direction: false,
    length,
    type,
  };
  return result;
};

export type MessageDataShips = {
  gameId: number;
  ships: Ship[];
  indexPlayer: string;
};
export const messageDataShips = (): MessageDataShips => {
  return {
    gameId: 0,
    ships: [],
    indexPlayer: '',
  };
};

export type SquareLine = number[];
export type Square = SquareLine[];
export const squareEmpty = (): Square => {
  const square: Square = [];
  for (let i = 0; i < 10; i += 1) {
    const squareLine: SquareLine = [];
    for (let l = 0; l < 10; l += 1) {
      squareLine.push(0);
    }
    square.push(squareLine);
  }
  return square;
};

export type GameUser = {
  name: string;
  index: string;
  ships: Ship[];
  square: Square;
  squareEnemy: Square;
  bot: boolean;
};

export const gameUser = (): GameUser => {
  return {
    name: '',
    index: '',
    ships: [],
    square: squareEmpty(),
    squareEnemy: squareEmpty(),
    bot: false,
  };
};

export type Game = {
  idGame: number;
  gameUsers: GameUser[];
  attacking: number;
};

export const emptyGame = (): Game => {
  return {
    idGame: 0,
    gameUsers: [],
    attacking: 0,
  };
};

export type GameMessage = {
  isCorrect: boolean;
  game: Game;
  message: string;
};

export const gameMessage = (): GameMessage => {
  return {
    isCorrect: false,
    game: emptyGame(),
    message: '',
  };
};

export type ShotStatus = 'miss' | 'killed' | 'shot';

export type ShotResult = {
  position: {
    x: number;
    y: number;
  };
  currentPlayer: string;
  status: ShotStatus;
};

export class Games {
  private _nextIndex = 1;
  private _records: Map<number, Game> = new Map();
  private _instance: Games;

  public constructor() {
    if (!this._instance) this._instance = this;
    return this._instance;
  }

  public createGame = (room: Room): GameMessage => {
    const result = gameMessage();

    if (room.roomUsers.length < 2) {
      result.isCorrect = false;
      result.message = 'Failed to create game. Not all users in room';
      return result;
    }

    const check = this.checkUsersAlreadyInGame(room);
    if (check) {
      result.isCorrect = false;
      result.message = 'Failed to create game. User already in game';
      return result;
    }

    room.roomUsers.forEach((user) => {
      const player = gameUser();
      player.name = user.name;
      player.index = user.index;
      player.bot = user.bot;
      result.game.gameUsers.push(player);
    });
    result.game.idGame = this._nextIndex;
    result.isCorrect = true;
    this._records.set(result.game.idGame, result.game);
    this._nextIndex += 1;
    return result;
  };

  checkUsersAlreadyInGame = (room: Room): boolean => {
    let result = false;
    this._records.forEach((record: Game) => {
      room.roomUsers.forEach((userRoom) => {
        if (record.gameUsers.filter((user) => user.index === userRoom.index).length) result = true;
      });
    });
    return result;
  };

  public checkTurn = (game: Game, index: string): GameMessage => {
    const result = this.getGameByIndex(game.idGame);
    if (!result.isCorrect) return result;
    const player = result.game.gameUsers[result.game.attacking];
    result.isCorrect = player.index === index;
    if (!result.isCorrect) {
      const attacking = result.game.attacking === 0 ? 1 : 0;
      const missing = result.game.gameUsers[attacking];
      result.message = `The player ${missing.name} shot out of turn`;
    }
    return result;
  };

  public nextTurn = (game: Game): GameMessage => {
    const result = this.getGameByIndex(game.idGame);
    if (!result.isCorrect) return result;
    result.game.attacking = result.game.attacking === 0 ? 1 : 0;
    return result;
  };

  public getGameByIndex = (index: number): GameMessage => {
    const result = gameMessage();
    if (!index) {
      result.isCorrect = false;
      result.message = 'Incorrect Game index received';
      return result;
    }
    const game = this._records.get(index);
    if (!game) {
      result.isCorrect = false;
      result.message = 'Game not found';
      return result;
    }
    result.isCorrect = true;
    result.game = game;

    return result;
  };

  public setUserShips = (messageData: MessageDataShips): GameMessage => {
    const result = gameMessage();
    if (!messageData.gameId) {
      result.isCorrect = false;
      result.message = 'Incorrect Game gameId received';
      return result;
    }
    const game = this._records.get(messageData.gameId);
    if (!game) {
      result.isCorrect = false;
      result.message = 'Game not found';
      return result;
    }
    const player = game.gameUsers.find((user) => user.index === messageData.indexPlayer);
    if (!player) {
      result.isCorrect = false;
      result.message = 'Player not found in game';
      return result;
    }
    player.ships = messageData.ships;
    player.square = this.setShipsToSquare(messageData.ships);
    result.isCorrect = true;
    result.message = `Player ${player.name} added ships`;
    result.game = game;

    return result;
  };

  public setAttackResult = (gameResult: Game, shotResult: ShotResult, status: number): GameMessage => {
    const gameMessage = this.getGameByIndex(gameResult.idGame);
    if (!gameMessage.isCorrect) {
      return gameMessage;
    }

    const game = gameMessage.game;
    const player = game.gameUsers.find((user) => user.index === shotResult.currentPlayer);
    if (!player) {
      gameMessage.isCorrect = false;
      gameMessage.message = 'Player not found in game';
      return gameMessage;
    }
    const enemy = game.gameUsers.find((user) => user.index !== shotResult.currentPlayer);
    if (!enemy) {
      gameMessage.isCorrect = false;
      gameMessage.message = 'Player not found in game';
      return gameMessage;
    }

    const y = shotResult.position.y;
    const x = shotResult.position.x;
    enemy.square[y][x] = status;
    player.squareEnemy[y][x] = status;
    gameMessage.isCorrect = true;
    gameMessage.message = ``;
    gameMessage.game = game;

    return gameMessage;
  };

  public deleteGame = (gameResult: Game): boolean => {
    const game = this._records.get(gameResult.idGame);
    if (!game) return false;
    this._records.delete(gameResult.idGame);
    return true;
  };

  getGameByUserIndex = (index: string): GameMessage => {
    const result = gameMessage();
    result.isCorrect = false;
    result.message = 'Game not found';
    if (!index) {
      result.message = 'Incorrect User index received';
      return result;
    }
    this._records.forEach((record: Game) => {
      if (record.gameUsers.filter((user) => user.index === index).length) {
        result.isCorrect = true;
        result.message = '';
        result.game = record;
      }
    });
    return result;
  };

  setShipsToSquare = (ships: Ship[]): Square => {
    const result = squareEmpty();
    ships.forEach((ship) => {
      let dx = 0;
      let dy = 0;
      if (ship.direction) dy = 1;
      else dx = 1;
      let x = ship.position.x;
      let y = ship.position.y;
      for (let i = 0; i < ship.length; i += 1) {
        result[y][x] = 2;
        x += dx;
        y += dy;
      }
    });
    return result;
  };
}
