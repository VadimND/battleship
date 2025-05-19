import { updateRoom } from 'game_server/responses/updateroom';
import { Database } from '../database/db';
import { Request, Answer, emptyAnswer } from './requests';

const createRoom = (request: Request, db: Database): Answer => {
  const answer = emptyAnswer();
  answer.ident = 'Create new room';

  const userMessage = db.users.getUserByWs(request.ws!);
  if (!userMessage.isCorrect) {
    answer.isCorrect = false;
    answer.message = userMessage.message;
    return answer;
  }
  const roomUser = db.rooms.roomUserFromUser(userMessage.user);
  const result = db.rooms.createRoom(roomUser);
  if (!result.isCorrect) {
    answer.isCorrect = result.isCorrect;
    answer.message = result.message;
    return answer;
  }
  answer.isCorrect = result.isCorrect;
  answer.message = `User ${userMessage.user.name} create room`;
  updateRoom(db);

  return answer;
};

export default createRoom;
