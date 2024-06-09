const express = require("express");
const socket = require("socket.io");
//u need not npm i the http
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

//create express app instancce
const app = express();
//initialize http server with express
const server = http.createServer(app);

//instantiate socket.io on http server(as socket ko chaiye http ka server)
//so socket io says that , express server nhi do mujhe give me http server which is linked to express server, and http server dete socket ko ,
//we saved socket ki sari funcitnalitines in io varibale
const io = socket(server);

//initiate chess
// according to chess.js documentation
const chess = new Chess();

//set up varibales
let players = {};
let currentPlayer = "w";



app.set("view engine", "ejs");
//to use static files
app.use(express.static(path.join(__dirname, "public")));




//creating routes
app.get("/", (req, res) => {
  res.render("index", {title: "Chess Game"});
});


// here for console message to show on front end, we need to set up socket .io on front end also(using cdn, web socket cdn (from a cdn)), as this file app.js is of backend

io.on("connection", function (uniqueSocket) {
  console.log("connected")

  if (!players.white) {
    players.white = uniqueSocket.id;
    //player ko batao and assign it the role
    uniqueSocket.emit("playerRole", "w")
  }
  else if (!players.black) {
    players.black = uniqueSocket.id;
    uniqueSocket.emit("playerRole","b")
  }
  else {
    uniqueSocket.emit("spectatorRole");
  }
  uniqueSocket.on("disconnect", function () {
    if (uniqueSocket.id == players.white) delete players.white;
    else if (uniqueSocket.id == players.black) delete players.black;
  })    
  uniqueSocket.on("move", (move) => {
    try {
      //validating correct player turn 
      if (chess.turn() === 'w' && uniqueSocket.id !== players.white) return;
      if (chess.turn() === 'b' && uniqueSocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen())
      }
      else {
        console.log("invalid move:", move);
        uniqueSocket.emit("invalidMove", move); 
      }  
    }

    catch (err) {
      console.log(err);
      //only sending error message to the player who did the worng move
      uniqueSocket.emit("invalid move: ", move)
      
    }
    
  })

})






 
server.listen(3000);
