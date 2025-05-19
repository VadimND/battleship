import { httpServer } from "./src/http_server/index.js";
import { gameServer } from "./src/game_server/index.js";

const HTTP_PORT = 8181;
const WS_PORT = 3000;

gameServer(WS_PORT);
console.log(`Start game server on the ${WS_PORT} port!`);

httpServer.listen(HTTP_PORT);
console.log(`Start static http server on the ${HTTP_PORT} port!`);
