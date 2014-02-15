module.exports = function(gameState, io) {
    var models = require('../models/models.js');
    io.sockets.on('connection', function (socket) {
        var player = new models.Player(gameState);
        socket.player = player;
        onRegisterPlayer(socket);
    });

    var lastEmitTime = 0;
    function floodCheck() {
        var time = new Date().getTime();

        if (time - lastEmitTime < 200) {
            return false;
        }

        lastEmitTime = time;
        return true;
    }

    function broadcastGameState() {
        io.sockets.emit('gameState', gameState.serialize());
    }

    gameState.broadcastGameState = broadcastGameState;

    function onRegisterPlayer(socket) {
        socket.on('registerPlayer', function(data) {
            socket.emit('gameReady', socket.player.serialize());
            broadcastGameState();
        });

        socket.on('playerMove', function(data) {
            if (socket.player.id == data.playerId) {
                if (floodCheck()) {
                    gameState.players[data.playerId].move(data.direction);
                    broadcastGameState();
                }
            }
        });

        socket.on('playerShoot', function(data) {
            if (socket.player.id == data.playerId) {
                if (floodCheck()) {
                  var projectile = gameState.players[data.playerId].shoot(data.direction);
                  console.log('length asdfhas', Object.keys(gameState.projectiles).length);
                  if (Object.keys(gameState.projectiles).length == 1) {
                    gameState.updateProjectiles(broadcastGameState);
                  }
                }
            }
        });

        socket.on('disconnect', function () {
          gameState.deregisterPlayer(socket.player);
        });
    }
};
