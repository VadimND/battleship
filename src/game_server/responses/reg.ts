import { WebSocket } from 'ws';
import { PlayerMessage } from 'game_server/database/users';
import { responseTypes, ResponseTypes, sendMessage } from './responses';

export const reg = (playerMessage: PlayerMessage, uws: WebSocket) => {
  const responseType = responseTypes.reg as ResponseTypes;
  const responseData = JSON.stringify({
    name: playerMessage.user.name,
    index: playerMessage.user.index,
    error: !playerMessage.isCorrect,
    errorText: !playerMessage.isCorrect ? playerMessage.message : '',
  });
  sendMessage(responseType, responseData, uws);
};
