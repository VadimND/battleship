import { User } from 'game_server/database/users';
import { Database } from '../database/db';
import { Request, Answer, emptyAnswer } from './requests';
import { reg as responseReg } from 'game_server/responses/reg';
import { updateRoom } from 'game_server/responses/updateroom';
import { updateWinners } from 'game_server/responses/updatewinners';

const reg = (request: Request, db: Database): Answer => {
  const answer = emptyAnswer();
  answer.ident = 'User reg';
  const newUser = db.users.userFromUserWs(request.data as User, request.ws!);
  const result = db.users.reg(newUser);
  answer.isCorrect = result.isCorrect;
  answer.message = result.message;

  if (request.ws) {
    responseReg(result, request.ws);
    updateRoom(db);
    updateWinners(db);
  }

  return answer;
};

export default reg;