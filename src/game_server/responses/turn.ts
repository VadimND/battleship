import { Game } from 'game_server/database/games';
import { Database } from '../database/db';
import { responseTypes, ResponseTypes, sendMessageToUser } from './responses';
import botAttack from 'game_server/bot/attack';
import { MessageData } from 'game_server/requests/attack';

export const turn = (game: Game, db: Database) => {
  const responseType = responseTypes.turn as ResponseTypes;
  const player = game.gameUsers[game.attacking];
  if (player.bot) {
    const messageData = {
      gameId: game.idGame,
      x: 0,
      y: 0,
      indexPlayer: game.gameUsers[game.attacking].index,
    } as MessageData;
    setTimeout(() => botAttack(messageData, db), 600);
  }
  const data = {
    currentPlayer: player.index,
  };
  const responseData = JSON.stringify(data);
  game.gameUsers.forEach((gameUser) => {
    const user = db.users.getUserByIndex(gameUser.index).user;
    sendMessageToUser(responseType, responseData, user);
  });
};
