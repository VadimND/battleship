import { GameMessage } from "../database/games";
import { Database } from "../database/db";
import {
  responseTypes,
  ResponseTypes,
  sendMessageToUser,
} from "../responses/responses";
import botAddShips from "../bot/adships";

export type MessageCreateGame = {
  idGame: number;
  idPlayer: string;
};

export const createGame = (gameMessage: GameMessage, db: Database) => {
  const responseType = responseTypes.create_game as ResponseTypes;
  const dataTemplate = {
    idGame: gameMessage.game.idGame,
    idPlayer: "",
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
