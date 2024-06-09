const socket = io();
//require chess.js here
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

//pehle se null, so player role null hoga, as after game starts then only role milta
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  //board is chess board provided by chess.js which is a 8*8 array
  const board = chess.board();
  //khali kar ke start karna board ko in case, chessboard div ke beech mein kuch likh ho , to just to handle that, we make it empty every time it start
  boardElement.innerHTML = "";

  //as board is an array , so we do foreach
  board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => {
      //for each block in the 8*8 array make a div insdie the board, using createElement
      const squareElement = document.createElement("div");
      //class list mein added so that we cna eidt in css using class
      //making the light dark pattern
      /// light and dark are classes applied to that div, which we may change in css
      //yhe square, is the class name we gave to the div just created, which we may edit in css(so we can give class to div's in js also )
      //light and dark are also the class we gave here which again we edit using css code(okay to aise bhi condition ke basis par cclass de sakte)
      squareElement.classList.add(
        "square",
        (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
      );

      //har square ko humnbe two values di hai like this, row number and col number, which we use to find the target source jaha pice ko drip kiya ak loccaiton janne ke liye
      squareElement.dataset.row = rowindex;
      squareElement.dataset.col = squareindex;

      //aise sare square jo null nhi hai , vo piece hold karte hai , ( as u know that jaha peice nihi wahah , chess board is null which is an array), so , if piece hai then we willl have to develop that piece
      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece", // square.color, color is specified in the board array
          square.color === "w" ? "white" : "black"
        );

        //as square ke pass type bhi hai , which we get by ches.js. so , we pass pura square hi, and in get pice unicode we search type by , square.type
        pieceElement.innerText = getPieceUnicode(square);

        //yeh likh diya ki jisnka turn whai chl skata ak logic ka arambh, wehre piece elemnt.draggable stores, true of false,
        // thsi was new for me to stroe something in div.x
        pieceElement.draggable = playerRole === square.color;

        //ab yaha drag true hai then we update some pieces info
        pieceElement.addEventListener("dragstart", (e) => {
          //draggable tell sabout whether a pieve is dragable or not
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowindex, col: squareindex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        //square elemnt pe append kiya pieceelement , which we get form unicode
        //here we attached piecelemnt div on top of square elment div

        squareElement.appendChild(pieceElement);
      }

      //.this means thta, drag on khali square wont do anything, just learn
      squareElement.addEventListener("dragover", function (e) {
        e.preventDefault();
      });

      //drop is an event in mouse
      squareElement.addEventListener("drop", function (e) {
        //yeh karna padta hai alwys to stop basic nature of drop(i will do what i want , basic nature mat dikhao drop tum)
        e.preventDefault();

        if (draggedPiece) {
          const targetSource = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          //here handle move se humne bola, ki move the piece form source to target, and handlmove fn we write aage
          handleMove(sourceSquare, targetSource);
        }
      });
      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

//yeh thoda tricky to understand
const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };

  //backend pe yeh move bhajea

  socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♙",
    r: "♖",
    n: "♘",
    b: "♗",
    q: "♕",
    k: "♔",
    P: "♟",
    R: "♜",
    N: "♞",
    B: "♝",
    Q: "♛",
    K: "♚",
  };
  //es object mein se jo pece manga gaya hai usko return kar do
  return unicodePieces[piece.type] || "";
};

//esko kuch likhna is a little tricky and hard to manage
//yhaa sockeg use krte hai in front end not uniacue socket
socket.on("playerRole", function (role) {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", function () {
  playerRole = null;
  renderBoard();
});

//imp to render the board with pieces moved
socket.on("boardState", function () {
  chess.load(fen);
  renderBoard();
});

socket.on("move", function (move) {
  chess.move(move);
  renderBoard();
});

renderBoard();
