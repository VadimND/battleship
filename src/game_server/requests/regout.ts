import { updateRoom } from 'game_server/responses/updateroom';
import { Database } from '../database/db';
import { Request, Answer, emptyAnswer } from './requests';
import { finish } from 'game_server/responses/finish';
import { updateWinners } from 'game_server/responses/updatewinners';

const regOut = (request: Request, db: Database): Answer => {
  const answer = emptyAnswer();
  answer.ident = 'User reg out';
  const foundUser = db.users.getUserByWs(request.ws!);
  if (!foundUser.isCorrect) {
    answer.isCorrect = true;
    return answer;
  }

  const userIndex = foundUser.user.index;

  let needUpdateRoomsList = db.rooms.closeUserRoom(userIndex);
  needUpdateRoomsList = needUpdateRoomsList || db.rooms.kickUserFrommAllRooms(userIndex);
  if (needUpdateRoomsList) updateRoom(db);

  const gameMessage = db.games.getGameByUserIndex(foundUser.user.index);
  if (gameMessage.isCorrect) {
    const gameUsers = gameMessage.game.gameUsers.filter((user) => user.index !== userIndex);
    if (gameUsers.length) {
      const winner = gameUsers[0].index;
      finish(gameMessage.game, winner, db);
      db.users.addScore(winner);
      db.games.deleteGame(gameMessage.game);
      gameMessage.game.gameUsers.forEach((user) => {
        if (user.bot) db.users.deleteUser(user.index);
      });
      updateWinners(db);
    }
  }

  const result = db.users.regOut(foundUser.user);
  answer.isCorrect = result.isCorrect;
  answer.message = result.message;
  return answer;
};

export default regOut;