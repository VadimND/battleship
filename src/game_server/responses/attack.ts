import { Game } from 'game_server/database/games';
import { Database } from '../database/db';
import { responseTypes, ResponseTypes, sendMessageToUser } from './responses';

export const responseTemplate = (): ResponseTemplate => {
  const result = {
    position: {
      x: 0,
      y: 0,
    },
    currentPlayer: '',
    status: 'miss' as ShotStatus,
  };
  return result;
};

export type ShotStatus = 'miss' | 'killed' | 'shot';

export type ResponseTemplate = {
  position: {
    x: number;
    y: number;
  };
  currentPlayer: string;
  status: ShotStatus;
};

export const attack = (game: Game, template: ResponseTemplate, db: Database) => {
  const responseType = responseTypes.attack as ResponseTypes;
  const responseData = JSON.stringify(template);
  game.gameUsers.forEach((gameUser) => {
    const user = db.users.getUserByIndex(gameUser.index).user;
    sendMessageToUser(responseType, responseData, user);
  });
};
