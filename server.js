var express = require('express');
var http = require('http');

var app = express();
var port = 24824;



var MongoClient = require('mongodb').MongoClient;
var db_url = 'mongodb://hilahi:haideraamir98@ds237669.mlab.com:37669/cmpt218_asn4'
var db;

var users = [];
var games = [];

var server = http.createServer(app).listen(port);
console.log('running on port',port);

var io = require('socket.io')(server)

MongoClient.connect(db_url, function(err, client) {
  if (err) {
    throw err;
  } else {
    console.log("Connection to database established.");
    db = client.db('cmpt218_asn4');
    db.createCollection('users', function(err, res) {
      if (err) throw err;
      console.log("Collection users created.");
    });
    db.createCollection('games', function(err, res) {
      if (err) throw err;
      console.log("Collection games created.");
    });
    // Initialize inmemory arrays
    initUsers();
    initGames();
  }
});

function initUsers() {
  db.collection('users').find({}).toArray(function(err, res) {
    if (err) throw err;
    //console.log(res);
    users = res;
  });
}

function initGames() {
  db.collection('games').find({}).toArray(function(err, res) {
    if (err) throw err;
    //console.log(res);
    games = res;
  });
}


// parsing body
app.use(express.json());
app.use(express.urlencoded( { extended:false} ));

var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm','html'],
  index: "login.html"
}

app.use('/', function(req,res,next){
  console.log(req.method, 'request:', req.url);
  next();
});

app.use('/', express.static('./pub_html', options));

io.on('connection', function (socket) {

  socket.on('identify', function(user) {
    //if user exists set it for the socket.
    users.forEach(function(theUser) {
      if (theUser.username === user.username && theUser.password === user.password) {
            socket.player = theUser;
      }
      // If incorrect identification, then redirect to login page
      if (socket.player == null || socket.player == undefined) {
        // Handle
      }
    });
  });

  socket.on('createGame', function(user) {
    //Create a new game object
    game = {
      date: new Date(),
      host: user.username,
      player2: '',
      moves: 0,
      winner: '',
      status: 'open',
      ended: false
    }
    games.push(game);
    // Store game in db
    db.collection('games').insertOne(game, function(err,ret) {
      // Broadcast users game to show an open game.
      socket.broadcast.emit('openGame', game);
    });
  });

  socket.on('joinGame', function(game) {
    host = '';
    allSockets = Object.keys(io.sockets.sockets); 
    allSockets.forEach(function (id) {
      client = io.sockets.connected[id];    
      if (client.player.username === game.host) {
        host = client;
      }
    });

    //find the game object and update it
    db.collection('games').updateOne({host:game.host, status:'open'}, {$set: {player2: socket.player.username, status:'closed'}}, function(err, ret1) {
      if (err) return err;
      games.forEach(function(theGame) {
        if (JSON.stringify(game)===JSON.stringify(theGame)) {
          theGame.player2 = socket.player.username;
          theGame.status = 'closed';
          game = theGame
        }
      });
      socket.broadcast.emit('closedGame', game);
          // Show connected
      socket.emit('connected', game.host);
      host.emit('connected',socket.player.username);

      // Random start
      if (Math.floor(Math.random() * 2) == 0) {
        //host starts game
        if (host !== '') {
          socket.broadcast.to(host.id).emit('makeMove', null);
        }
      } else {
        socket.emit('makeMove', null);
      }
    });
  });

  socket.on('madeMove', function(move){

    //find other player
    toPlayer = '';
    allSockets = Object.keys(io.sockets.sockets); 
    allSockets.forEach(function (id) {
      client = io.sockets.connected[id]; 
      if (client.player.username === move.toPlayer) {
        toPlayer = client;
      }
    });

    //find game
    game='';
    games.forEach(function(theGame){
      if (!theGame.ended && (theGame.host === socket.player.username || theGame.player2 === socket.player.username)) {
        game = theGame;
      }
    });
    if (move.won) {
      db.collection('games').updateOne(game, {$set: {winner: socket.player.username, ended: true, moves: game.moves+1}}, function(err, ret1) {
        if (err) throw err;
        game.winner = socket.player.username;
        game.ended = true;
        game.moves++;
        mockStats = JSON.parse(JSON.stringify(socket.player.stats));
        mockStats.games++;
        mockStats.wins++;
        db.collection('users').updateOne(socket.player, {$set: {stats: mockStats}}, function(err, ret2) {
          if (err) return err;
          socket.player.stats.games++;
          socket.player.stats.wins++;
          mockStats = JSON.parse(JSON.stringify(toPlayer.player.stats));
          mockStats.games++;
          mockStats.losses++;
          db.collection('users').updateOne(toPlayer.player, {$set: {stats: mockStats}}, function(err, ret3) {
            if (err) return err;
            toPlayer.player.stats.games++;
            toPlayer.player.stats.losses++;
            // send end message
            toPlayer.emit('loss');
            socket.emit('win');
          });
        });  
      });
    } else {
      // send to other player
      db.collection('games').updateOne(game, {$set: {moves: game.moves+1}}, function(err, ret1) {
        if (err) return err;
        game.moves++;
        toPlayer.emit('makeMove', move);
      });
    }
  });

  socket.on('end', function() {
    socket.disconnect(0);
  });

  socket.on('quit', function() {
    //find game
    game='';
    games.forEach(function(theGame){
      if (!theGame.ended && (theGame.host === socket.player.username || theGame.player2 === socket.player.username)) {
        game = theGame;
      }
    });
    //If both users are in game
    if (game.status!=='open') {
      //find other player username
      if (game.host !== socket.player.username) otherPlayer = game.host;
      else otherPlayer = game.player2;

      // find other players socket
      toPlayer = '';
      allSockets = Object.keys(io.sockets.sockets); 
      allSockets.forEach(function (id) {
        client = io.sockets.connected[id];
        if (client.player.username === otherPlayer) {
          toPlayer = client;
        }
      });

      //Update stats
      db.collection('games').updateOne(game, {$set: {ended: true}}, function(err, ret1) {
        if (err) return (err);
        game.ended = true;
        mockStats = JSON.parse(JSON.stringify(socket.player.stats));
        mockStats.games++;
        mockStats.losses++;
        db.collection('users').updateOne(socket.player, {$set: {stats: mockStats}}, function(err, ret2) {
          if (err) return err;
          socket.player.stats.games++;
          socket.player.stats.losses++;
          mockStats = JSON.parse(JSON.stringify(toPlayer.player.stats));
          mockStats.games++;
          mockStats.wins++;
          db.collection('users').updateOne(toPlayer.player, {$set: {stats: mockStats}}, function(err, ret3) {
            if (err) return err;
            toPlayer.player.stats.games++;
            toPlayer.player.stats.wins++;
            // send end message
            toPlayer.emit('end');
            socket.emit('end');
          });
        });  
      });
    } else {
      db.collection('games').updateOne(game, {$set: {ended: true, status: 'closed'}}, function(err, ret1) {
        game.status = 'closed';
        game.ended = true;
        socket.emit('end');
      });
    }
  });
});


// On login attempt check if user exists and if password is correct.
// On failure send object with success: failure which is checked on client side
// On success send back the user object along with success: true 
app.post('/login', function(req,res,next){
  login = {
    sucess: false
  }
  // find user in db
  db.collection('users').findOne({username:req.body.username, password: req.body.password}, function(err, ret1) {
    if (err) throw err;
    if (ret1 === null || ret1 === undefined) {
      res.json(login);
    } else {
      login.success = true;
      login.user = ret1;
      res.json(login);
    }
  });
});

app.delete('/users', function(req,res,next) {
  result = {
    success: false
  }
  username = req.query.username;
  password = req.query.password;
  user = '';
  index = '';
  //find the user
  users.forEach(function (theUser,i) {
    if ((username === theUser.username) && (password === theUser.password)) {
      user = theUser;
      index = i;
    }
  });
  if (user === '') {
    res.json(result);
    return;
  } else {
    db.collection('users').deleteOne({username: user.username}, function(err) {
      if (err) throw err;
      users.splice(index,1);
      result.success = true;
      res.json(result);
      return;
    });
  }
});


app.post('/register', function(req,res,next){
  user = null;
  users.forEach(function(theUser) {
    if (theUser.username === req.body.username) {
      user = theUser;
    }
  });
  register = {
    success: false
  }
  if (!user) {
    user = req.body;
    user.stats = {
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0
    };
    users.push(user);
    // Insert into db
    db.collection('users').insertOne(user, function(err,ret) {
      if (err) throw err;
      register = {
        success: true
      }
      res.json(register);
    });
  } else {
    res.json(register);
  }
});

app.get('/games', function(req,res,next) {
  openGames = [];
  games.forEach(function(game) {
    if (game.status === 'open') {
      openGames.push(game);
    }
  });
  obj = {
    games: openGames
  }
  res.json(obj);
});