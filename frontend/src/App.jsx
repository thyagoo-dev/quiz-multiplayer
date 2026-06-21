import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

export default function App() {
  const [appState, setAppState] = useState('home');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [rawQuestions, setRawQuestions] = useState('');
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  
  const [selectedOption, setSelectedOption] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    socket.on('roomCreated', (data) => {
      setRoomCode(data.roomCode);
      setIsHost(data.isHost);
      setAppState('waiting');
    });

    socket.on('updatePlayers', (updatedPlayers) => {
      setPlayers(updatedPlayers);
      if (appState === 'home') setAppState('waiting');
    });

    socket.on('playerAnswered', (playerId) => {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, hasAnswered: true } : p));
    });

    socket.on('youAreHost', () => setIsHost(true));

    socket.on('newQuestion', (questionData) => {
      setCurrentQuestion(questionData);
      setCorrectAnswer(null);
      setSelectedOption(null);
      setIsConfirmed(false); 
      setAppState('playing');
    });

    socket.on('timerUpdate', (time) => {
      setTimeLeft(time);
    });

    socket.on('roundResults', ({ correctAnswer, players: updatedPlayers }) => {
      setCorrectAnswer(correctAnswer);
      setPlayers(updatedPlayers);
      setTimeLeft(null); // Limpa o tempo na tela de resultado
      setAppState('results');
    });

    socket.on('gameOver', (finalPlayers) => {
      setPlayers(finalPlayers);
      setTimeLeft(null);
      setAppState('gameover');
    });

    socket.on('error', (msg) => alert(msg));

    return () => {
      socket.off('roomCreated');
      socket.off('updatePlayers');
      socket.off('playerAnswered');
      socket.off('youAreHost');
      socket.off('newQuestion');
      socket.off('timerUpdate');
      socket.off('roundResults');
      socket.off('gameOver');
      socket.off('error');
    };
  }, [appState]);

  const parseQuestions = (text) => {
    try {
      return text.split('---').map(block => {
        const lines = block.trim().split('\n').filter(line => line.trim() !== '');
        if (lines.length < 6) return null;
        
        return {
          pergunta: lines[0].replace('PERGUNTA:', '').trim(),
          alternativas: {
            A: lines[1].replace('A)', '').trim(),
            B: lines[2].replace('B)', '').trim(),
            C: lines[3].replace('C)', '').trim(),
            D: lines[4].replace('D)', '').trim()
          },
          correta: lines[5].replace('CORRETA:', '').trim().toUpperCase()
        };
      }).filter(q => q !== null);
    } catch (err) {
      alert("Erro ao formatar perguntas. Verifique o padrão.");
      return [];
    }
  };

  const handleCreateRoom = () => {
    if (!playerName || !rawQuestions) return alert("Preencha seu nome e cole as perguntas.");
    const formattedQuestions = parseQuestions(rawQuestions);
    if (formattedQuestions.length === 0) return;
    socket.emit('createRoom', { hostName: playerName, questions: formattedQuestions });
  };

  const handleJoinRoom = () => {
    if (!playerName || !roomCode) return alert("Preencha seu nome e o código da sala.");
    socket.emit('joinRoom', { roomCode: roomCode.toUpperCase(), playerName });
  };

  const handleStart = () => socket.emit('startGame', roomCode);
  const handleNext = () => socket.emit('nextQuestion', roomCode);

  const handleConfirmAnswer = () => {
    if (!selectedOption || isConfirmed) return;
    setIsConfirmed(true);
    socket.emit('submitAnswer', { roomCode, answer: selectedOption });
  };

  const handleLeave = () => {
    socket.emit('leaveRoom', roomCode);
    setAppState('home');
    setRoomCode('');
    setIsHost(false);
    setSelectedOption(null);
    setIsConfirmed(false);
    setTimeLeft(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-gray-100 font-sans flex flex-col md:flex-row">
      
      {appState !== 'home' && (
        <aside className="w-full md:w-72 bg-[#0d1323] border-b md:border-b-0 md:border-r border-gray-800 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-wide text-gray-300">TH Quiz</h2>
            <button onClick={handleLeave} className="text-xs bg-red-900/50 hover:bg-red-800 text-red-300 px-3 py-1 rounded transition-colors">
              Sair
            </button>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto">
            {players.map(p => (
              <div key={p.id} className="flex items-center p-3 bg-[#131b2f] rounded-lg shadow-sm border border-gray-800/50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-900 ${p.hasAnswered ? 'bg-green-400 ring-2 ring-green-400/50' : 'bg-green-400/80'}`}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.score} pts</p>
                </div>
                {p.hasAnswered && appState === 'playing' && (
                  <span className="text-[9px] bg-green-900/80 text-green-300 px-2 py-1 rounded font-bold tracking-wider">RESPONDIDO</span>
                )}
              </div>
            ))}
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        
        {appState === 'home' && (
          <div className="w-full max-w-md bg-[#0d1323] p-8 rounded-xl shadow-2xl border border-gray-800">
            <h1 className="text-3xl font-bold text-center mb-8 tracking-tight text-white">TH Quiz</h1>
            
            <div className="space-y-4 mb-8">
              <input 
                type="text" placeholder="Seu Nickname" 
                className="w-full p-3 bg-[#0a0f1c] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                value={playerName} onChange={e => setPlayerName(e.target.value)}
              />
            </div>

            <div className="border-t border-gray-800 pt-6 space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entrar em uma sala</h3>
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Código (Ex: A1B2C3)" 
                  className="flex-1 p-3 bg-[#0a0f1c] border border-gray-700 rounded-lg uppercase focus:outline-none focus:border-blue-500 text-white"
                  value={roomCode} onChange={e => setRoomCode(e.target.value)}
                />
                <button onClick={handleJoinRoom} className="bg-blue-600 hover:bg-blue-700 px-6 font-bold rounded-lg transition-colors">
                  ENTRAR
                </button>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6 mt-6 space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ou Crie uma Sala (Host)</h3>
              <textarea 
                placeholder="Cole aqui o texto gerado pela IA..." 
                className="w-full p-3 bg-[#0a0f1c] border border-gray-700 rounded-lg h-32 focus:outline-none focus:border-blue-500 text-sm font-mono text-gray-300"
                value={rawQuestions} onChange={e => setRawQuestions(e.target.value)}
              />
              <button onClick={handleCreateRoom} className="w-full bg-blue-600 hover:bg-blue-700 p-3 font-bold rounded-lg transition-colors text-white">
                CRIAR SALA
              </button>
            </div>
          </div>
        )}

        {appState === 'waiting' && (
          <div className="text-center">
            <h2 className="text-gray-400 mb-2 uppercase tracking-widest text-sm">Código da Sala</h2>
            <div className="text-6xl font-black tracking-widest mb-8 text-white">{roomCode}</div>
            <p className="mb-8 text-gray-400">Aguardando jogadores... ({players.length}/10)</p>
            {isHost ? (
              <button onClick={handleStart} className="bg-green-600 hover:bg-green-500 px-10 py-4 text-xl font-bold rounded-lg transition-colors shadow-lg">
                INICIAR QUIZ
              </button>
            ) : (
              <p className="text-lg animate-pulse text-gray-400">Aguardando o host iniciar a partida...</p>
            )}
          </div>
        )}

        {appState === 'playing' && currentQuestion && (
          <div className="w-full max-w-4xl w-full flex flex-col items-center">
            
            {/* Mostrador de Tempo */}
            {timeLeft !== null && (
              <div className={`text-4xl md:text-5xl font-black mb-8 transition-colors duration-300 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                {timeLeft}s
              </div>
            )}

            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 leading-relaxed text-white">
              {currentQuestion.pergunta}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
              {Object.entries(currentQuestion.alternativas).map(([key, text]) => (
                <button
                  key={key}
                  onClick={() => !isConfirmed && setSelectedOption(key)}
                  disabled={isConfirmed}
                  className={`p-6 text-left rounded-xl border-2 transition-all duration-200 ${
                    selectedOption === key 
                      ? 'bg-[#1e2b4d] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                      : 'bg-[#131b2f] border-gray-700 hover:border-gray-500'
                  } ${isConfirmed && selectedOption !== key ? 'opacity-50' : ''}`}
                >
                  <span className="font-bold text-blue-400 mr-4">{key})</span> 
                  <span className="text-gray-200">{text}</span>
                </button>
              ))}
            </div>

            {selectedOption && !isConfirmed && (
              <button 
                onClick={handleConfirmAnswer} 
                className="bg-green-600 hover:bg-green-500 px-8 py-3 font-bold rounded-lg transition-colors text-white shadow-lg animate-fade-in-up"
              >
                CONFIRMAR ESCOLHA
              </button>
            )}
            {isConfirmed && (
               <p className="text-gray-400 animate-pulse">Aguardando outros jogadores...</p>
            )}
          </div>
        )}

        {appState === 'results' && currentQuestion && (
          <div className="w-full max-w-4xl w-full flex flex-col items-center">
            <h2 className="text-xl text-center text-gray-400 mb-8 uppercase tracking-widest text-sm">O tempo acabou! A resposta correta era:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
              {Object.entries(currentQuestion.alternativas).map(([key, text]) => {
                const isCorrect = key === correctAnswer;
                const isMyWrongAnswer = key === selectedOption && key !== correctAnswer;
                return (
                  <div key={key} className={`p-6 text-left rounded-xl border-2 ${
                    isCorrect ? 'bg-[#113320] border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 
                    isMyWrongAnswer ? 'bg-[#401616] border-red-500 opacity-90' : 'bg-[#131b2f] border-gray-800 opacity-40'
                  }`}>
                    <span className="font-bold mr-4">{key})</span> 
                    <span className={isCorrect || isMyWrongAnswer ? 'text-white' : 'text-gray-400'}>{text}</span>
                  </div>
                );
              })}
            </div>
            {isHost && (
              <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-500 px-10 py-4 text-lg font-bold rounded-lg transition-colors text-white shadow-lg">
                PRÓXIMA PERGUNTA
              </button>
            )}
            {!isHost && (
              <p className="text-gray-400 animate-pulse">Aguardando o host avançar...</p>
            )}
          </div>
        )}

        {appState === 'gameover' && (
          <div className="text-center w-full max-w-md">
            <h1 className="text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">FIM DE JOGO</h1>
            <h2 className="text-2xl mb-8 text-white">Placar Final</h2>
            <div className="flex flex-col gap-3 mx-auto mb-8">
              {[...players].sort((a, b) => b.score - a.score).map((p, index) => (
                <div key={p.id} className="flex justify-between items-center bg-[#131b2f] border border-gray-800 p-4 rounded-lg shadow-md">
                  <span className="font-bold text-xl text-gray-500">#{index + 1}</span>
                  <span className="font-semibold text-lg text-gray-200">{p.name}</span>
                  <span className="font-mono font-bold text-blue-400">{p.score} pts</span>
                </div>
              ))}
            </div>
            <button onClick={handleLeave} className="text-gray-400 hover:text-white underline transition-colors">
              Voltar ao Início
            </button>
          </div>
        )}

      </main>
    </div>
  );
}