import { updateRoom } from 'game_server/responses/updateroom';
import { Database } from '../database/db';
import { Request, Answer, emptyAnswer } from './requests';
import { createGame } from 'game_server/responses/creategame';

type MessageData = {
  indexRoom: number;
};

const addUserToRoom = (request: Request, db: Database): Answer => {
  const answer = emptyAnswer();
  answer.ident = 'Add user to room';

  const userMessage = db.users.getUserByWs(request.ws!);
  if (!userMessage.isCorrect) {
    answer.isCorrect = false;
    answer.message = userMessage.message;
    return answer;
  }
  const roomUser = db.rooms.roomUserFromUser(userMessage.user);
  const roomData = request.data as MessageData;
  const result = db.rooms.addUserToRoom(roomData.indexRoom, roomUser);
  answer.isCorrect = result.isCorrect;
  answer.message = result.message;

  if (result.isCorrect) {
    answer.message = `User ${userMessage.user.name} added to room`;
    const gameMessage = db.games.createGame(result.room);
    if (!gameMessage.isCorrect) {
      answer.isCorrect = gameMessage.isCorrect;
      answer.message = gameMessage.message;
      return answer;
    }
    const roomMessage = db.rooms.closeRoom(result.room.roomId);
    if (!roomMessage.isCorrect) {
      answer.isCorrect = roomMessage.isCorrect;
      answer.message = roomMessage.message;
      return answer;
    }
    createGame(gameMessage, db);
    updateRoom(db);
    answer.isCorrect = true;
    answer.message = 'Game created';
  }

  return answer;
};

export default addUserToRoom;
