import { Database } from '../database/db';
import { responseTypes, ResponseTypes, sendMessageToUser } from './responses';

export const updateRoom = (db: Database) => {
  const responseType = responseTypes.update_room as ResponseTypes;
  const availableRooms = db.rooms.getAvailableRooms();
  const responseData = JSON.stringify(availableRooms);
  const users = db.users.getAllOnlineUsers();
  users.forEach((user) => sendMessageToUser(responseType, responseData, user));
};
