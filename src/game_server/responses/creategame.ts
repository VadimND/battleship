import { GameMessage } from 'game_server/database/games';
import { Database } from 'game_server/database/db';
import { responseTypes, ResponseTypes, sendMessageToUser } from 'game_server/responses/responses';
import botAddShips from 'game_server/bot/addships';

export type MessageCreateGame = {
  idGame: number;
  idPlayer: string;
};

export const createGame = (gameMessage: GameMessage, db: Database) => {
  const responseType = responseTypes.create_game as ResponseTypes;
  const dataTemplate = {
    idGame: gameMessage.game.idGame,
    idPlayer: '',
  };

  const users = gameMessage.game.gameUsers;
  users.forEach((user) => {
    const player = db.users.getUserByIndex(user.index);
    dataTemplate.idPlayer = player.user.index;
    if (player.user.bot) botAddShips(dataTemplate, db);
    const responseData = JSON.stringify(dataTemplate);
    sendMessageToUser(responseType, responseData, player.user);
  });
};
