import { v4 } from 'uuid';
import { emptyUser, PlayerMessage } from 'game_server/database/users';
import { Database } from '../database/db';
import { Request, Answer, emptyAnswer } from './requests';
import { updateRoom } from 'game_server/responses/updateroom';
import { createGame } from 'game_server/responses/creategame';

const singlePlay = (request: Request, db: Database): Answer => {
  const answer = emptyAnswer();
  answer.ident = 'Single Play';
  const bot = addBot(db);
  if (!bot.isCorrect) {
    answer.isCorrect = false;
    answer.message = bot.message;
    return answer;
  }

  const user = db.users.getUserByWs(request.ws!);
  if (!user.isCorrect) {
    answer.isCorrect = false;
    answer.message = user.message;
    return answer;
  }

  if (db.rooms.kickUserFrommAllRooms(user.user.index)) updateRoom(db);

  const roomUser = db.rooms.roomUserFromUser(user.user);
  const room = db.rooms.createRoom(roomUser);
  if (!room.isCorrect) {
    answer.isCorrect = room.isCorrect;
    answer.message = room.message;
    return answer;
  }

  const roomBot = db.rooms.roomUserFromUser(bot.user);
  const roomFull = db.rooms.addUserToRoom(room.room.roomId, roomBot);
  answer.isCorrect = roomFull.isCorrect;
  answer.message = roomFull.message;

  if (!roomFull.isCorrect) return answer;

  const gameMessage = db.games.createGame(roomFull.room);
  if (!gameMessage.isCorrect) {
    answer.isCorrect = gameMessage.isCorrect;
    answer.message = gameMessage.message;
    return answer;
  }
  const roomMessage = db.rooms.closeRoom(roomFull.room.roomId);
  if (!roomMessage.isCorrect) {
    answer.isCorrect = roomMessage.isCorrect;
    answer.message = roomMessage.message;
    return answer;
  }

  createGame(gameMessage, db);

  answer.isCorrect = true;
  answer.message = 'Game created';

  return answer;
};

const addBot = (db: Database): PlayerMessage => {
  const bot = emptyUser();
  const index = v4();
  bot.index = index;
  bot.name = index;
  bot.password = index;
  bot.bot = true;
  const newUser = db.users.reg(bot);
  return newUser;
};

export default singlePlay;
