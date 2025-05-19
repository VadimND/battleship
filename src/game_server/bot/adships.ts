import { Database } from 'game_server/database/db';
import { Answer, emptyAnswer, emptyRequest } from 'game_server/requests/requests';
import { messageDataShips, ship, Ship, ShipType, Square, squareEmpty } from 'game_server/database/games';
import { MessageCreateGame } from 'game_server/responses/creategame';
import { getRandomNumber } from 'game_server/requests/randomattack';
import addShips from 'game_server/requests/addships';

const gameShips = 'huge,large,large,medium,medium,medium,small,small,small,small';

const botAddShips = (request: MessageCreateGame, db: Database): Answer => {
  const answer = emptyAnswer();
  answer.ident = 'Bot Add ships';

  const messageData = messageDataShips();
  messageData.gameId = request.idGame;
  messageData.indexPlayer = request.idPlayer;

  let square = squareEmpty();
  const shipsToAdd = gameShips.split(',');
  const ships: Ship[] = [];
  shipsToAdd.forEach((type) => {
    const newEmptyShip = ship(type as ShipType);
    const newShip = findShip(newEmptyShip, square);
    if (newShip.position.x < 0 || newShip.position.y < 0) {
      answer.isCorrect = false;
      answer.message = 'Unable to select ship layout';
      console.log('Bot: Unable to select ship layout');
      return answer;
    }
    ships.push(newShip);
    square = setShipToSquare(newShip, square);
  });
  messageData.ships = ships;

  const requestAddShips = emptyRequest();
  requestAddShips.isCorrect = true;
  requestAddShips.type = 'add_ships';
  requestAddShips.answer = '';
  requestAddShips.data = messageData;

  console.log('The emblem of our game:');
  console.log(
    square
      .map((t) => t.join(' '))
      .join('\n')
      .replace(/0/g, ' ')
      .replace(/1/g, '.')
      .replace(/2/g, 'O'),
  );
  addShips(requestAddShips, db);

  return answer;
};

const setShipToSquare = (ship: Ship, square: Square): Square => {
  let dx = 0;
  let dy = 0;
  if (ship.direction) dy = 1;
  else dx = 1;
  let x = ship.position.x;
  let y = ship.position.y;
  for (let i = 0; i < ship.length; i += 1) {
    square[y][x] = 2;
    for (let ys = y - 1; ys <= y + 1; ys += 1) {
      for (let xs = x - 1; xs <= x + 1; xs += 1) {
        if (ys >= 0 && ys < 10 && xs >= 0 && xs < 10 && square[ys][xs] === 0) square[ys][xs] = 1;
      }
    }
    x += dx;
    y += dy;
  }
  return square;
};

const findShip = (ship: Ship, square: Square): Ship => {
  const emptyCells: number[] = [];
  for (let i = 0; i < 10; i += 1) {
    for (let l = 0; l < 10; l += 1) {
      if (square[i][l] === 0) emptyCells.push(i * 10 + l);
    }
  }

  let shipFound = false;
  let tryCount = 1000;
  while (!shipFound && tryCount > 0) {
    const randomCell = emptyCells[getRandomNumber(0, emptyCells.length)];
    ship.position.x = randomCell % 10;
    ship.position.y = Math.floor((randomCell - ship.position.x) / 10);
    const directions = [];
    if (checkShipHorizontal(ship, square)) directions.push(false);
    if (checkShipVertical(ship, square)) directions.push(true);
    if (directions.length > 0) {
      shipFound = true;
      ship.direction = directions[getRandomNumber(0, directions.length)];
    } else {
      ship.position.x = -1;
      ship.position.y = -1;
    }
    tryCount += 1;
  }
  return ship;
};

const checkShipHorizontal = (ship: Ship, square: Square): boolean => {
  let result = true;
  const x = ship.position.x;
  const y = ship.position.y;
  for (let i = 0; i < ship.length; i += 1) {
    if (x + i > 9) result = false;
    else if (square[y][x + i] > 0) result = false;
  }
  return result;
};

const checkShipVertical = (ship: Ship, square: Square): boolean => {
  let result = true;
  const x = ship.position.x;
  const y = ship.position.y;
  for (let i = 0; i < ship.length; i += 1) {
    if (y + i > 9) result = false;
    else if (square[y + i][x] > 0) result = false;
  }
  return result;
};

export default botAddShips;