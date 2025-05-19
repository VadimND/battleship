import { Game } from 'game_server/database/games';
import { Database } from '../database/db';
import { responseTypes, ResponseTypes, sendMessageToUser } from './responses';

export const startGame = (game: Game, db: Database) => {
  const responseType = responseTypes.start_game as ResponseTypes;
  game.gameUsers.forEach((player) => {
    const user = db.users.getUserByIndex(player.index).user;
    const data = {
      ships: player.ships,
      currentPlayerIndex: player.index,
    };
    const responseData = JSON.stringify(data);

    sendMessageToUser(responseType, responseData, user);
  });
};
