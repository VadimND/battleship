import { Game } from 'game_server/database/games';
import { Database } from '../database/db';
import { responseTypes, ResponseTypes, sendMessageToUser } from './responses';

export type ResponseTemplate = {
  winPlayer: string;
};

export const finish = (game: Game, winPlayer: string, db: Database) => {
  const responseType = responseTypes.finish as ResponseTypes;
  const responseData = JSON.stringify({ winPlayer });
  game.gameUsers.forEach((gameUser) => {
    const user = db.users.getUserByIndex(gameUser.index).user;
    sendMessageToUser(responseType, responseData, user);
  });
};
