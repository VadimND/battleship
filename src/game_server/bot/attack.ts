import attack, { CellStatus, MessageData } from 'game_server/requests/attack';
import { Database } from '../database/db';
import { Answer, emptyAnswer, emptyRequest } from '../requests/requests';

const botAttack = (data: MessageData, db: Database): Answer => {
  const answer = emptyAnswer();
  answer.ident = 'Bot Attack';

  const messageData = data;

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
  const fullCells: number[] = [];
  for (let i = 0; i < 10; i += 1) {
    for (let l = 0; l < 10; l += 1) {
      if (enemySquare[i][l] === CellStatus.indexOf('empty')) emptyCells.push(i * 10 + l);
      else if (enemySquare[i][l] === CellStatus.indexOf('shot')) fullCells.push(i * 10 + l);
    }
  }

  if (emptyCells.length === 0) {
    answer.isCorrect = false;
    answer.message = `Not found empty cells in Square of user ${player?.name}`;
    return answer;
  }

  let randomNumber = emptyCells[getRandomNumber(0, emptyCells.length)];
  if (fullCells.length > 0) {
    console.log({ fullCells });
    randomNumber = finishShip(randomNumber, fullCells, enemySquare);
  }

  messageData.x = randomNumber % 10;
  messageData.y = Math.floor((randomNumber - messageData.x) / 10);

  const request = emptyRequest();
  request.type = 'attack';
  request.data = messageData;
  const result = attack(request, db);
  result.message = 'Bot Attack: ' + result.message;

  console.log(result.message);

  return result;
};

function getRandomNumber(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function finishShip(randomNumber: number, fullCells: number[], enemySquare: number[][]) {
  const fullDestroyed = CellStatus.indexOf('shot');
  const x = fullCells[0] % 10;
  const y = Math.floor((fullCells[0] - x) / 10);
  const direction = { xl: 0, xr: 0, yu: 0, yd: 0 };
  if ((x > 0 && enemySquare[y][x - 1] === fullDestroyed) || (x < 9 && enemySquare[y][x + 1] === fullDestroyed)) {
    direction.xl = 1;
    direction.xr = 1;
  } else if ((y > 0 && enemySquare[y - 1][x] === fullDestroyed) || (y < 9 && enemySquare[y + 1][x] === fullDestroyed)) {
    direction.yu = 1;
    direction.yd = 1;
  } else {
    const cellsAround = getEmptyCellsAround(x, y, enemySquare);
    if (cellsAround.length === 0) return randomNumber;
    return cellsAround[getRandomNumber(0, cellsAround.length)];
  }

  const result = getEmptyCell(enemySquare, y, x, direction);
  if (result < 0) return randomNumber;
  return result;
}

function getEmptyCellsAround(x: number, y: number, enemySquare: number[][]): number[] {
  const empty = CellStatus.indexOf('empty');
  const result: number[] = [];
  if (x > 0 && enemySquare[y][x - 1] === empty) result.push(y * 10 + x - 1);
  if (x < 9 && enemySquare[y][x + 1] === empty) result.push(y * 10 + x + 1);
  if (y > 0 && enemySquare[y - 1][x] === empty) result.push((y - 1) * 10 + x);
  if (y < 9 && enemySquare[y + 1][x] === empty) result.push((y + 1) * 10 + x);
  return result;
}

const getEmptyCell = (
  enemySquare: number[][],
  y: number,
  x: number,
  direction: { xl: number; xr: number; yu: number; yd: number },
): number => {
  const empty = CellStatus.indexOf('empty');
  let result = -1;
  let { xl, xr, yu, yd } = direction;
  while (xl + xr + yu + yd > 0 && result < 0) {
    if (y - yu < 0) yu = 0;
    if (y + yd > 9) yd = 0;
    if (x - xl < 0) xl = 0;
    if (x + xr > 9) xr = 0;
    if (yu > 0 && enemySquare[y - yu][x] === empty) result = (y - yu) * 10 + x;
    if (yd > 0 && enemySquare[y + yd][x] === empty) result = (y + yd) * 10 + x;
    if (xl > 0 && enemySquare[y][x - xl] === empty) result = y * 10 + x - xl;
    if (xr > 0 && enemySquare[y][x + xr] === empty) result = y * 10 + x + xr;
    if (enemySquare[y - yu][x] < 2) yu = 0;
    if (enemySquare[y + yd][x] < 2) yd = 0;
    if (enemySquare[y][x - xl] < 2) xl = 0;
    if (enemySquare[y][x + xr] < 2) xr = 0;

    xl = xl + (xl > 0 ? 1 : 0);
    xr = xr + (xr > 0 ? 1 : 0);
    yu = yu + (yu > 0 ? 1 : 0);
    yd = yd + (yd > 0 ? 1 : 0);
  }
  return result;
};

export default botAttack;