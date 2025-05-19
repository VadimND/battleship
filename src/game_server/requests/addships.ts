import { turn } from "../responses/turn";
import { Database } from "../database/db";
import { Request, Answer, emptyAnswer } from "./requests";
import { MessageDataShips } from "../database/games";
import { startGame } from "../responses/startgame";

const addShips = (request: Request, db: Database): Answer => {
  const answer = emptyAnswer();
  answer.ident = "Add ships";

  const messageData = request.data as MessageDataShips;
  const gameMessage = db.games.setUserShips(messageData);
  answer.isCorrect = gameMessage.isCorrect;
  answer.message = gameMessage.message;
  if (!gameMessage.isCorrect) {
    return answer;
  }

  const game = gameMessage.game;
  const enemy = game.gameUsers.find(
    (user) => user.index !== messageData.indexPlayer,
  );

  if (enemy!.bot && enemy!.ships.length < 10) {
    console.log("Set ships to bot");
    messageData.indexPlayer = enemy!.index;
    db.games.setUserShips(messageData);
  }

  const allPlayersShips = game.gameUsers.reduce((result, user) => {
    result = result && user.ships.length === 10;
    return result;
  }, true);
  if (allPlayersShips) {
    startGame(game, db);
    turn(game, db);
    answer.message = answer.message + "\nGame started";
  }

  return answer;
};

export default addShips;
