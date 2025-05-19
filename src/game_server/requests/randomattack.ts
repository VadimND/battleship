import { Database } from '../database/db';
import { Request, Answer, emptyAnswer } from './requests';
import attack, { MessageData } from './attack';

const randomAttack = (request: Request, db: Database): Answer => {
  const answer = emptyAnswer();
  answer.ident = 'Attack';

  const messageData = request.data as MessageData;

  const gameMessage = db.games.getGameByIndex(messageData.gameId);
  answer.isCorrect = gameMessage.isCorrect;
  answer.message = gameMessage.message;
  if (!gameMessage.isCorrect) {
    return answer;
  }

  const game = gameMessage.game;
  const checkPlayer = db.games.checkTurn(game, messageData.indexPlayer);
  answer.isCorrect = checkPlayer.isCorrect;
  answer.message = checkPlayer.message;
  if (!checkPlayer.isCorrect) {
    return answer;
  }

  const player = game.gameUsers.find((user) => user.index === messageData.indexPlayer);
  const enemySquare = player!.squareEnemy;

  const emptyCells: number[] = [];
  for (let i = 0; i < 10; i += 1) {
    for (let l = 0; l < 10; l += 1) {
      if (enemySquare[i][l] === 0) emptyCells.push(i * 10 + l);
    }
  }

  if (emptyCells.length === 0) {
    answer.isCorrect = false;
    answer.message = `Not found empty cells in Square of user ${player?.name}`;
    return answer;
  }
  const randomNumber = emptyCells[getRandomNumber(0, emptyCells.length)];
  messageData.x = randomNumber % 10;
  messageData.y = Math.floor((randomNumber - messageData.x) / 10);

  request.type = 'randomAttack';
  request.data = messageData;
  const result = attack(request, db);
  result.message = 'Random Attack: ' + result.message;

  return result;
};

export function getRandomNumber(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

export default randomAttack;
