const http = require("http");
const express = require("express");
const WebSocketServer = require("websocket").server;
const path = require("path");  // Import path to resolve static files

const app = express();
const server = http.createServer(app);
const wsServer = new WebSocketServer({
  httpServer: server,
});

let connection2 = {};
let games = {};
let chance = "X";
if (Math.floor(Math.random() * 2) == 1) {
  chance = "O";
}

// Serve static files (like index.html, CSS, JS) directly from the root directory
app.use(express.static(__dirname));

// Serve the main page (index.html) for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

wsServer.on("request", (request) => {
  //connect
  const connection = request.accept(null, request.origin);
  connection.on("open", () => console.log("opened!"));
  connection.on("close", () => console.log("closed!"));
  connection.on("message", (message) => {
    const data = JSON.parse(message.utf8Data);
    switch (data.type) {
      case "createGame":
        const gameCode = Math.random().toString(36).substring(7).toUpperCase();
        games[gameCode] = {
          status: "waiting",
          players: [data.name],
          connections: [connection],
          symbols: ["X"],
        };
        connection.sendUTF(
          JSON.stringify({ type: "gameCode", code: gameCode })
        );
        break;

      case "joinGame":
        const game = games[data.gameCode];
        console.log(data.code);
        console.log(games[data.code]);
        if (game && game.status === "waiting" && game.players.length < 2) {
          game.players.push(data.name);
          game.status = "playing";
          game.connections.push(connection);
          game.symbols.push("O");
          // Assign symbol to the second player
          game.connections[0].sendUTF(
            JSON.stringify({ type: "gameStarted", symbol: "X" })
          );
          game.connections[1].sendUTF(
            JSON.stringify({ type: "gameStarted", symbol: "O" })
          );
        } else {
          connection.sendUTF(
            JSON.stringify({ type: "error", message: "Game not found or full" })
          );
        }
        break;

      case "connection":
        // Initialize game entry with connections and symbols arrays if it doesn't exist
        if (!connection2[data.code]) {
          connection2[data.code] = {
            connections: [],
            symbols: [],
          };
        }

        // Determine the symbol for the new connection
        let symbol =
          connection2[data.code].connections.length === 0 ? "X" : "O";

        // Add the connection and symbol to their respective arrays
        connection2[data.code].connections.push(connection);
        connection2[data.code].symbols.push(symbol);
        break;

      case "playing":
        console.log('ji');
        const gamee = connection2[data.code];
        const playerSymbol = gamee.symbols[gamee.connections.indexOf(connection)]; // Get the symbol for this connection

        // Check if it's the correct player's turn
        if (playerSymbol === chance) {
          // Update the turn to the other player
          chance = chance === "X" ? "O" : "X";

          // Broadcast the move to both players
          gamee.connections.forEach((conn) => {
            conn.sendUTF(JSON.stringify({
              type: "moveMade",
              box: data.box,
              symbol: playerSymbol,
              nextTurn: chance
            }));
          });
        } else {
          // Notify the player that it's not their turn
          connection.sendUTF(JSON.stringify({
            type: "error",
            message: "It's not your turn"
          }));
        }
        break;
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running on http://localhost:3000");
});
