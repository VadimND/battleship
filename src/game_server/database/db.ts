import { Games } from "./games";
import { Rooms } from "./rooms";
import { Users } from "./users";

export type Database = {
  users: Users;
  rooms: Rooms;
  games: Games;
};

export const database: Database = {
  users: new Users(),
  rooms: new Rooms(),
  games: new Games(),
};
