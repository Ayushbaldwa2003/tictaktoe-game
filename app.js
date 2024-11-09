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
let count = 0; //To Track Draw

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
// boxes.forEach((box) => {
//   box.addEventListener("click", () => {
//     ws.send(JSON.stringify({ type: 'playing', code: code ,box:box}));
//     // if (turnO) {
//     //   //playerO
//     //   box.innerText = "O";
//     //   turnO = false;
//     // } else {
//     //   //playerX
//     //   box.innerText = "X";
//     //   turnO = true;
//     // }
//     // box.disabled = true;
//     // count++;

//     // let isWinner = checkWinner();

//     // if (count === 9 && !isWinner) {
//     //   gameDraw();
//     // }
//   });
// });

ws.addEventListener('open', () => {
  console.log("Connection opened");
  ws.send(JSON.stringify({ type: 'turn', code: code }));
});
// ws.onmessage = (message) => {
//   const data = JSON.parse(message.data);

//   if (data.type === "turn") {
//     // Assuming 'turnIndicator' is the element that shows the turn message
//     turnIndicator.innerText = "It's your turn"; // Display this when it's the player's turn
//   }
// };

boxes.forEach((box, index) => {
  box.addEventListener("click", () => {
    // Send the move to the server
    ws.send(JSON.stringify({ type: "playing", code: code, box: index }));
  });
});

// Handle incoming messages
ws.onmessage = (message) => {
  const data = JSON.parse(message.data);

  // Update the box when a move is made
  if (data.type === "moveMade") {
    console.log('hi');
    boxes[data.box].innerText = data.symbol;
    boxes[data.box].disabled = true; // Disable the box after a move

    // Optionally, update turn indicator or display message
    msg.innerText = `It's ${data.nextTurn}'s turn`;
    count++;
    checkWinner();
    if(count==9){
      gameDraw();
    }
  } else if (data.type === "error") {
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

    if (pos1Val != "" && pos2Val != "" && pos3Val != "") {
      if (pos1Val === pos2Val && pos2Val === pos3Val) {
        showWinner(pos1Val);
        return true;
      }
    }
  }
};

newGameBtn.addEventListener("click", resetGame);