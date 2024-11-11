const http = require("http");
const express = require("express");
const WebSocketServer = require("websocket").server;
const path = require("path");

const app = express();
const server = http.createServer(app);
const wsServer = new WebSocketServer({ httpServer: server });

let games = {}; // Consolidated game data

// Serve static files (like index.html, CSS, JS) directly from the root directory
app.use(express.static(__dirname));

// Serve the main page (index.html) for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

wsServer.on("request", (request) => {
  const connection = request.accept(null, request.origin);
  
  connection.on("open", () => console.log("opened!"));
  connection.on("close", () => {
    console.log("closed!");
    // Optionally, handle player disconnection (e.g., remove player from game)
  });

  connection.on("message", (message) => {
    const data = JSON.parse(message.utf8Data);

    switch (data.type) {
      case "createGame":
        // Create a new game with a unique code
        const gameCode = Math.random().toString(36).substring(7).toUpperCase();
        games[gameCode] = {
          status: "waiting",
          players: [data.name],
          connections: [connection],
          symbols: ["X"],
          chance: "X" // Set initial turn to "X"
        };
        connection.sendUTF(JSON.stringify({ type: "gameCode", code: gameCode }));
        break;

      case "joinGame":
        const game = games[data.gameCode];
        
        if (game && game.status === "waiting" && game.players.length < 2) {
          // Join an existing game
          game.players.push(data.name);
          game.status = "playing";
          game.connections.push(connection);
          game.symbols.push("O");
          
          // Notify both players about game start and assign symbols
          game.connections[0].sendUTF(JSON.stringify({ type: "gameStarted", symbol: "X" }));
          game.connections[1].sendUTF(JSON.stringify({ type: "gameStarted", symbol: "O" }));
        } else {
          connection.sendUTF(
            JSON.stringify({ type: "error", message: "Game not found or full" })
          );
        }
        break;

      case "playing":
        const currentGame = games[data.code];
        if (!currentGame) return;

        const playerSymbol = currentGame.symbols[currentGame.connections.indexOf(connection)];

        if (playerSymbol === currentGame.chance) {
          // Update turn to the other player
          currentGame.chance = currentGame.chance === "X" ? "O" : "X";

          // Broadcast the move to both players
          currentGame.connections.forEach((conn) => {
            conn.sendUTF(JSON.stringify({
              type: "moveMade",
              box: data.box,
              symbol: playerSymbol,
              nextTurn: currentGame.chance
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
