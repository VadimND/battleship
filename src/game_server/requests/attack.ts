import { turn } from 'game_server/responses/turn';
import { Database } from '../database/db';
import { Request, Answer, emptyAnswer } from './requests';
import { attack as attackResponse, ShotStatus } from 'game_server/responses/attack';
import { responseTemplate } from 'game_server/responses/attack';
import { Square } from 'game_server/database/games';
import { finish } from 'game_server/responses/finish';
import { updateWinners } from 'game_server/responses/updatewinners';

export type MessageData = {
  gameId: number;
  x: number;
  y: number;
  indexPlayer: string;
};

export const CellStatus = ['empty', 'miss', 'full', 'shot', 'killed'];

const attack = (request: Request, db: Database): Answer => {
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
  const enemy = game.gameUsers.find((user) => user.index !== messageData.indexPlayer);
  const enemySquare = enemy!.square;
  const y = messageData.y;
  const x = messageData.x;

  if (CellStatus[enemySquare[y][x]] === 'shot') {
    answer.isCorrect = false;
    answer.message = 'Skip shot on destroyed cell';
    return answer;
  }

  const shootResult = getShotResult(enemySquare, y, x);
  if (shootResult === 'miss') {
    db.games.nextTurn(game);
  }
  answer.isCorrect = true;
  if (player!.bot) answer.message = `shot with result ${shootResult}`;
  else answer.message = `Player ${player?.name} shot with result ${shootResult}`;

  const template = responseTemplate();
  template.position.x = x;
  template.position.y = y;
  template.status = shootResult;
  template.currentPlayer = messageData.indexPlayer;
  db.games.setAttackResult(game, template, CellStatus.indexOf(shootResult));
  attackResponse(game, template, db);

  if (shootResult === 'killed') {
    const cells = cellsForClose(enemySquare, y, x);
    template.status = 'miss';
    cells.forEach((cell) => {
      template.position.x = cell.x;
      template.position.y = cell.y;
      attackResponse(game, template, db);
      db.games.setAttackResult(game, template, CellStatus.indexOf('miss'));
    });
    const killedCells = markKilledShip(enemySquare, y, x);
    template.status = 'killed';
    killedCells.forEach((cell) => {
      template.position.x = cell.x;
      template.position.y = cell.y;
      db.games.setAttackResult(game, template, CellStatus.indexOf('killed'));
    });
  }

  const isWin = checkWin(enemySquare);
  if (isWin) {
    finish(game, messageData.indexPlayer, db);
    answer.message = answer.message + `\nPlayer ${player?.name} win!`;
    if (!enemy!.bot) {
      db.users.addScore(messageData.indexPlayer);
    }
    db.games.deleteGame(game);
    if (player!.bot) db.users.deleteUser(player!.index);
    if (enemy!.bot) db.users.deleteUser(enemy!.index);
    updateWinners(db);
  } else {
    turn(game, db);
  }

  return answer;
};

const getShotResult = (enemySquare: Square, y: number, x: number): ShotStatus => {
  const enemyPositionStatus = enemySquare[y][x];

  let shootResult: ShotStatus = 'miss';
  if (enemyPositionStatus === CellStatus.indexOf('full')) {
    let xl = 1;
    let xr = 1;
    let yu = 1;
    let yd = 1;
    let isKill = true;
    while (xl + xr + yu + yd > 0 && isKill) {
      if (y - yu < 0) yu = 0;
      if (y + yd > 9) yd = 0;
      if (x - xl < 0) xl = 0;
      if (x + xr > 9) xr = 0;
      if (yu > 0 && enemySquare[y - yu][x] === 2) isKill = false;
      if (yd > 0 && enemySquare[y + yd][x] === 2) isKill = false;
      if (xl > 0 && enemySquare[y][x - xl] === 2) isKill = false;
      if (xr > 0 && enemySquare[y][x + xr] === 2) isKill = false;
      if (enemySquare[y - yu][x] < 2) yu = 0;
      if (enemySquare[y + yd][x] < 2) yd = 0;
      if (enemySquare[y][x - xl] < 2) xl = 0;
      if (enemySquare[y][x + xr] < 2) xr = 0;

      xl = xl + (xl > 0 ? 1 : 0);
      xr = xr + (xr > 0 ? 1 : 0);
      yu = yu + (yu > 0 ? 1 : 0);
      yd = yd + (yd > 0 ? 1 : 0);
    }
    shootResult = isKill ? 'killed' : 'shot';
  }
  return shootResult;
};

const checkWin = (square: Square) => {
  let result = true;
  for (let i = 0; i < 10; i += 1) {
    for (let l = 0; l < 10; l += 1) {
      if (CellStatus[square[i][l]] === 'full') result = false;
    }
  }
  return result;
};

const cellsForClose = (enemySquare: Square, y: number, x: number) => {
  const ship = [{ y, x }];
  let xl = 1;
  let xr = 1;
  let yu = 1;
  let yd = 1;
  while (xl + xr + yu + yd > 0) {
    if (y - yu < 0) yu = 0;
    if (y + yd > 9) yd = 0;
    if (x - xl < 0) xl = 0;
    if (x + xr > 9) xr = 0;

    if (yu > 0 && enemySquare[y - yu][x] > 1) ship.push({ y: y - yu, x });
    if (yd > 0 && enemySquare[y + yd][x] > 1) ship.push({ y: y + yd, x });
    if (xl > 0 && enemySquare[y][x - xl] > 1) ship.push({ y, x: x - xl });
    if (xr > 0 && enemySquare[y][x + xr] > 1) ship.push({ y, x: x + xr });

    if (enemySquare[y - yu][x] < 2) yu = 0;
    if (enemySquare[y + yd][x] < 2) yd = 0;
    if (enemySquare[y][x - xl] < 2) xl = 0;
    if (enemySquare[y][x + xr] < 2) xr = 0;

    xl = xl + (xl > 0 ? 1 : 0);
    xr = xr + (xr > 0 ? 1 : 0);
    yu = yu + (yu > 0 ? 1 : 0);
    yd = yd + (yd > 0 ? 1 : 0);
  }
  const cells: { y: number; x: number }[] = [];
  ship.forEach((cell) => {
    if (cell.y - 1 >= 0 && cell.x - 1 >= 0 && enemySquare[cell.y - 1][cell.x - 1] === 0)
      cells.push({ y: cell.y - 1, x: cell.x - 1 });
    if (cell.y - 1 >= 0 && cell.x >= 0 && enemySquare[cell.y - 1][cell.x] === 0)
      cells.push({ y: cell.y - 1, x: cell.x });
    if (cell.y - 1 >= 0 && cell.x + 1 < 10 && enemySquare[cell.y - 1][cell.x + 1] === 0)
      cells.push({ y: cell.y - 1, x: cell.x + 1 });
    if (cell.x - 1 >= 0 && enemySquare[cell.y][cell.x - 1] === 0) cells.push({ y: cell.y, x: cell.x - 1 });
    if (cell.x + 1 >= 0 && enemySquare[cell.y][cell.x + 1] === 0) cells.push({ y: cell.y, x: cell.x + 1 });
    if (cell.y + 1 < 10 && cell.x - 1 >= 0 && enemySquare[cell.y + 1][cell.x - 1] === 0)
      cells.push({ y: cell.y + 1, x: cell.x - 1 });
    if (cell.y + 1 < 10 && cell.x >= 0 && enemySquare[cell.y + 1][cell.x] === 0)
      cells.push({ y: cell.y + 1, x: cell.x });
    if (cell.y + 1 < 10 && cell.x + 1 < 10 && enemySquare[cell.y + 1][cell.x + 1] === 0)
      cells.push({ y: cell.y + 1, x: cell.x + 1 });
  });

  const result: { y: number; x: number }[] = [];
  cells.forEach((cell) => {
    if (
      !result.find((fcell) => {
        return fcell.y === cell.y && fcell.x === cell.x;
      })
    )
      result.push(cell);
  });

  return result;
};

const markKilledShip = (enemySquare: Square, y: number, x: number): { x: number; y: number }[] => {
  const killed = CellStatus.indexOf('killed');
  const shot = CellStatus.indexOf('shot');
  enemySquare[y][x] = killed;

  const result: { x: number; y: number }[] = [{ x, y }];

  let xl = 1;
  let xr = 1;
  let yu = 1;
  let yd = 1;
  while (xl + xr + yu + yd > 0) {
    if (y - yu < 0) yu = 0;
    if (y + yd > 9) yd = 0;
    if (x - xl < 0) xl = 0;
    if (x + xr > 9) xr = 0;
    if (yu > 0 && enemySquare[y - yu][x] >= shot) result.push({ y: y - yu, x });
    if (yd > 0 && enemySquare[y + yd][x] >= shot) result.push({ y: y + yd, x });
    if (xl > 0 && enemySquare[y][x - xl] >= shot) result.push({ y, x: x - xl });
    if (xr > 0 && enemySquare[y][x + xr] >= shot) result.push({ y, x: x + xr });
    if (enemySquare[y - yu][x] < shot) yu = 0;
    if (enemySquare[y + yd][x] < shot) yd = 0;
    if (enemySquare[y][x - xl] < shot) xl = 0;
    if (enemySquare[y][x + xr] < shot) xr = 0;

    xl = xl + (xl > 0 ? 1 : 0);
    xr = xr + (xr > 0 ? 1 : 0);
    yu = yu + (yu > 0 ? 1 : 0);
    yd = yd + (yd > 0 ? 1 : 0);
  }
  return result;
};

export default attack;
