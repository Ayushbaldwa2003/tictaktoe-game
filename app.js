const wsUrl = window.location.hostname === "localhost" ? 'ws://localhost:3000' : 'wss://tictaktoe-game-yj0r.onrender.com';
const ws = new WebSocket(wsUrl);

const code = localStorage.getItem("gameCode");
ws.addEventListener('open', () => {
  console.log("Connection opened");
  ws.send(JSON.stringify({ type: 'connection', code: code }));
});

let boxes = document.querySelectorAll(".box");
let resetBtn = document.querySelector("#reset-btn");
let newGameBtn = document.querySelector("#new-btn");
let msgContainer = document.querySelector(".msg-container");
let msg = document.querySelector("#msg");

let turnO = true; //playerX, playerO
let count = 0; // To Track Draw

const winPatterns = [
  [0, 1, 2],
  [0, 3, 6],
  [0, 4, 8],
  [1, 4, 7],
  [2, 5, 8],
  [2, 4, 6],
  [3, 4, 5],
  [6, 7, 8],
];

const resetGame = () => {
  turnO = true;
  count = 0;
  enableBoxes();
  msgContainer.classList.add("hide");
};

// Box click handler: Send the box index to the server
boxes.forEach((box, index) => {
  box.addEventListener("click", () => {
    ws.send(JSON.stringify({ type: "playing", code: code, box: index }));
  });
});

// Handle incoming WebSocket messages
ws.onmessage = (message) => {
  const data = JSON.parse(message.data);

  if (data.type === "moveMade") {
    // Update the box when a move is made
    boxes[data.box].innerText = data.symbol;
    boxes[data.box].disabled = true; // Disable the box after a move

    // Update turn indicator or display message
    msg.innerText = `It's ${data.nextTurn}'s turn`;
    count++;
    checkWinner();
    
    // Check for a draw if all boxes are filled
    if (count === 9) {
      gameDraw();
    }
  } else if (data.type === "error") {
    // Display error messages
    msg.innerText = data.message;
  }
};

const gameDraw = () => {
  msg.innerText = `Game was a Draw.`;
  msgContainer.classList.remove("hide");
  disableBoxes();
};

const disableBoxes = () => {
  for (let box of boxes) {
    box.disabled = true;
  }
};

const enableBoxes = () => {
  for (let box of boxes) {
    box.disabled = false;
    box.innerText = "";
  }
};

const showWinner = (winner) => {
  msg.innerText = `Congratulations, Winner is ${winner}`;
  msgContainer.classList.remove("hide");
  disableBoxes();
};

const checkWinner = () => {
  for (let pattern of winPatterns) {
    let pos1Val = boxes[pattern[0]].innerText;
    let pos2Val = boxes[pattern[1]].innerText;
    let pos3Val = boxes[pattern[2]].innerText;

    if (pos1Val !== "" && pos1Val === pos2Val && pos2Val === pos3Val) {
      showWinner(pos1Val);
      return true;
    }
  }
};

newGameBtn.addEventListener("click", resetGame);
