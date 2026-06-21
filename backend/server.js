const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } 
});

const rooms = {};

io.on('connection', (socket) => {
  console.log(`Usuário conectado: ${socket.id}`);

  socket.on('createRoom', ({ hostName, questions }) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    rooms[roomCode] = {
      host: socket.id,
      players: [{ id: socket.id, name: hostName, score: 0, hasAnswered: false }],
      questions: questions,
      currentQuestionIndex: 0,
      status: 'waiting', 
      answersThisRound: 0
    };

    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode, isHost: true });
    io.to(roomCode).emit('updatePlayers', rooms[roomCode].players);
  });

  socket.on('joinRoom', ({ roomCode, playerName }) => {
    const room = rooms[roomCode];
    if (!room) return socket.emit('error', 'Sala não encontrada.');
    if (room.status !== 'waiting') return socket.emit('error', 'O jogo já começou.');
    if (room.players.length >= 10) return socket.emit('error', 'Sala cheia.');

    room.players.push({ id: socket.id, name: playerName, score: 0, hasAnswered: false });
    socket.join(roomCode);
    
    io.to(roomCode).emit('updatePlayers', room.players);
  });

  socket.on('startGame', (roomCode) => {
    const room = rooms[roomCode];
    if (room && room.host === socket.id) {
      room.status = 'playing';
      sendQuestion(roomCode);
    }
  });

  socket.on('submitAnswer', ({ roomCode, answer }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'playing') return;

    const player = room.players.find(p => p.id === socket.id);
    if (player && !player.hasAnswered) {
      player.hasAnswered = true;
      room.answersThisRound += 1;

      const currentQ = room.questions[room.currentQuestionIndex];
      if (answer === currentQ.correta) {
        player.score += 10;
      }

      io.to(roomCode).emit('playerAnswered', player.id);

      if (room.answersThisRound === room.players.length) {
        showResults(roomCode);
      }
    }
  });

  socket.on('nextQuestion', (roomCode) => {
    const room = rooms[roomCode];
    if (room && room.host === socket.id) {
      room.currentQuestionIndex += 1;
      room.answersThisRound = 0;
      
      // Reseta o status de resposta de todos no backend
      room.players.forEach(p => p.hasAnswered = false); 
      
      // CORREÇÃO AQUI: Avisa o frontend para limpar a tag "RESPONDIDO"
      io.to(roomCode).emit('updatePlayers', room.players);
      
      if (room.currentQuestionIndex >= room.questions.length) {
        io.to(roomCode).emit('gameOver', room.players);
      } else {
        room.status = 'playing';
        sendQuestion(roomCode);
      }
    }
  });

  socket.on('leaveRoom', (roomCode) => {
    handlePlayerLeave(socket.id, roomCode);
  });

  socket.on('disconnect', () => {
    for (const code in rooms) {
      handlePlayerLeave(socket.id, code);
    }
  });

  function handlePlayerLeave(socketId, roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);
      
      // Se era o último, deleta a sala
      if (room.players.length === 0) {
        delete rooms[roomCode];
      } else {
        // Se o host saiu, passa o host pro próximo
        if (room.host === socketId) {
          room.host = room.players[0].id;
          io.to(room.host).emit('youAreHost');
        }
        io.to(roomCode).emit('updatePlayers', room.players);
        
        // Se alguém saiu durante a partida, verifica se o round deve acabar
        if (room.status === 'playing' && room.answersThisRound >= room.players.length) {
           showResults(roomCode);
        }
      }
    }
  }

  function sendQuestion(roomCode) {
    const room = rooms[roomCode];
    const q = room.questions[room.currentQuestionIndex];
    const questionPayload = {
      pergunta: q.pergunta,
      alternativas: q.alternativas
    };
    io.to(roomCode).emit('newQuestion', questionPayload);
  }

  function showResults(roomCode) {
    const room = rooms[roomCode];
    room.status = 'results';
    const correctAnswer = room.questions[room.currentQuestionIndex].correta;
    io.to(roomCode).emit('roundResults', { correctAnswer, players: room.players });
  }
});

server.listen(3001, () => {
  console.log('Servidor WebSocket rodando na porta 3001');
});