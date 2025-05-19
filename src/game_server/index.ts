import { WebSocket, WebSocketServer } from 'ws';
import { processingRequest } from './requests/requests';
import { database } from './database/db';

export function gameServer(gameServerPort: number) {
  const db = database;

  const gameServer = new WebSocketServer({
    port: gameServerPort,
    clientTracking: true,
  });

  gameServer.on('connection', (playerSocket: WebSocket) => {
    console.log(`Connected player. Active connections ${gameServer.clients.size}`);

    playerSocket.on('message', (data) => {
      const requestData = data.toString();
      processingRequest(requestData, playerSocket, db);
    });

    playerSocket.on('close', () => {
      const requestData = JSON.stringify({ type: 'regOut', data: '{}' });
      processingRequest(requestData, playerSocket, db);
      console.log(`Disconnected player. Active connections ${gameServer.clients.size}`);
    });
  });

  gameServer.on('listening', () => {
    console.log('\nBattleship is ready to play!');
    console.log('Go to: http://localhost:8181/\n');
  });
}
