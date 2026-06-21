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
      answersThisRound: 0,
      timerInterval: null, 
      timeLeft: 20         
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
        const timeBonus = Math.max(0, room.timeLeft);
        player.score += (10 + timeBonus); 
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
      
      room.players.forEach(p => p.hasAnswered = false); 
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
      
      if (room.players.length === 0) {
        clearInterval(room.timerInterval);
        delete rooms[roomCode];
      } else {
        if (room.host === socketId) {
          room.host = room.players[0].id;
          io.to(room.host).emit('youAreHost');
        }
        io.to(roomCode).emit('updatePlayers', room.players);
        
        if (room.status === 'playing' && room.answersThisRound >= room.players.length) {
           showResults(roomCode);
        }
      }
    }
  }

  function startTimer(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    clearInterval(room.timerInterval); 
    room.timeLeft = 20; 
    io.to(roomCode).emit('timerUpdate', room.timeLeft);

    room.timerInterval = setInterval(() => {
      room.timeLeft -= 1;
      io.to(roomCode).emit('timerUpdate', room.timeLeft);

      if (room.timeLeft <= 0) {
        showResults(roomCode);
      }
    }, 1000);
  }

  function sendQuestion(roomCode) {
    const room = rooms[roomCode];
    const q = room.questions[room.currentQuestionIndex];
    const questionPayload = {
      pergunta: q.pergunta,
      alternativas: q.alternativas
    };
    
    io.to(roomCode).emit('newQuestion', questionPayload);
    startTimer(roomCode); 
  }

  function showResults(roomCode) {
    const room = rooms[roomCode];
    clearInterval(room.timerInterval); 
    room.status = 'results';
    const correctAnswer = room.questions[room.currentQuestionIndex].correta;
    io.to(roomCode).emit('roundResults', { correctAnswer, players: room.players });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});