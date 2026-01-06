
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, GuessRecord, GameStats } from './types';
import { generateTargetNumber, calculateResult } from './utils/gameLogic';
import { getAICommentary } from './services/geminiService';
import Keypad from './components/Keypad';

const App: React.FC = () => {
  const [target, setTarget] = useState<string>('');
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [history, setHistory] = useState<GuessRecord[]>([]);
  const [status, setStatus] = useState<GameStatus>(GameStatus.PLAYING);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [stats, setStats] = useState<GameStats>({ wins: 0, losses: 0, bestScore: null });
  const scrollRef = useRef<HTMLDivElement>(null);

  const startNewGame = useCallback(() => {
    setTarget(generateTargetNumber(4));
    setHistory([]);
    setCurrentGuess('');
    setStatus(GameStatus.PLAYING);
    setIsAIThinking(false);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleKeyPress = (num: string) => {
    if (currentGuess.length < 4 && !currentGuess.includes(num)) {
      setCurrentGuess(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (currentGuess.length !== 4 || status !== GameStatus.PLAYING || isAIThinking) return;

    const { strikes, balls } = calculateResult(target, currentGuess);
    setIsAIThinking(true);

    const commentary = await getAICommentary(target, history, currentGuess, strikes, balls);

    const newRecord: GuessRecord = {
      guess: currentGuess,
      strikes,
      balls,
      commentary,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, newRecord]);
    setCurrentGuess('');
    setIsAIThinking(false);

    if (strikes === 4) {
      setStatus(GameStatus.WON);
      setStats(prev => ({
        ...prev,
        wins: prev.wins + 1,
        bestScore: prev.bestScore === null ? history.length + 1 : Math.min(prev.bestScore, history.length + 1)
      }));
    } else if (history.length >= 9) { // 10 chances total
      setStatus(GameStatus.LOST);
      setStats(prev => ({ ...prev, losses: prev.losses + 1 }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-emerald-400">NUMERUS</h1>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">AI Strategic Baseball</p>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <div className="glass px-4 py-2 rounded-lg flex flex-col items-center">
            <span className="text-slate-400 text-[10px] uppercase">Wins</span>
            <span className="text-emerald-400">{stats.wins}</span>
          </div>
          <div className="glass px-4 py-2 rounded-lg flex flex-col items-center">
            <span className="text-slate-400 text-[10px] uppercase">Best</span>
            <span className="text-blue-400">{stats.bestScore || '-'}</span>
          </div>
          <button 
            onClick={startNewGame}
            className="bg-slate-800 hover:bg-slate-700 transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <i className="fa-solid fa-rotate-right"></i>
            Reset
          </button>
        </div>
      </header>

      <main className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow">
        {/* Game History Section */}
        <section className="flex flex-col gap-4 h-[60vh] lg:h-[70vh]">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <i className="fa-solid fa-list-ul text-emerald-500"></i>
              Match History
            </h2>
            <span className="text-xs font-mono text-slate-500">
              CHANCE {history.length}/10
            </span>
          </div>
          
          <div 
            ref={scrollRef}
            className="glass rounded-2xl flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar"
          >
            {history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                <i className="fa-solid fa-baseball-bat-ball text-6xl mb-4"></i>
                <p>No data recorded. The AI is waiting for your move.</p>
              </div>
            )}
            {history.map((record, idx) => (
              <div key={record.timestamp} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-600">
                    {idx + 1}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="mono text-xl font-bold tracking-widest text-white">{record.guess}</span>
                      <div className="flex gap-2 text-xs font-bold">
                        <span className={`px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 ${record.strikes > 0 ? 'strike-glow' : ''}`}>
                          {record.strikes}S
                        </span>
                        <span className={`px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 ${record.balls > 0 ? 'ball-glow' : ''}`}>
                          {record.balls}B
                        </span>
                      </div>
                    </div>
                    {record.commentary && (
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-sm text-slate-300 italic">
                        <span className="text-emerald-500 mr-2">GM:</span>
                        {record.commentary}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isAIThinking && (
              <div className="flex items-center gap-2 p-4 animate-pulse">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
                <span className="text-xs text-slate-500 uppercase ml-2">AI Analyzing...</span>
              </div>
            )}
          </div>
        </section>

        {/* Input Section */}
        <section className="flex flex-col justify-center items-center gap-8">
          {/* Current Guess Display */}
          <div className="w-full max-w-xs">
            <div className="flex justify-between mb-4 px-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Input Sequence</span>
              {status === GameStatus.WON && <span className="text-xs font-bold text-emerald-500">VICTORY</span>}
              {status === GameStatus.LOST && <span className="text-xs font-bold text-rose-500">DEFEAT</span>}
            </div>
            <div className="flex gap-2 justify-center mb-2">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black mono transition-all
                    ${currentGuess[i] ? 'border-emerald-500 text-white bg-emerald-500/10 shadow-lg shadow-emerald-500/10' : 'border-slate-700 text-slate-600 bg-slate-800/30'}
                    ${status !== GameStatus.PLAYING ? 'opacity-50' : ''}
                  `}
                >
                  {status === GameStatus.LOST ? target[i] : (currentGuess[i] || '•')}
                </div>
              ))}
            </div>
            {status === GameStatus.LOST && (
              <p className="text-center text-rose-400 text-sm font-bold mt-2">The answer was {target}</p>
            )}
          </div>

          {/* Controls */}
          <div className="w-full">
            {status === GameStatus.PLAYING ? (
              <Keypad 
                onKeyPress={handleKeyPress} 
                onDelete={handleDelete} 
                onSubmit={handleSubmit}
                disabled={isAIThinking}
              />
            ) : (
              <div className="text-center p-8 glass rounded-2xl border-emerald-500/20 max-w-xs mx-auto animate-in zoom-in duration-500">
                <div className={`text-4xl mb-4 ${status === GameStatus.WON ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <i className={`fa-solid ${status === GameStatus.WON ? 'fa-trophy' : 'fa-skull'}`}></i>
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {status === GameStatus.WON ? 'Perfect Game!' : 'Match Over'}
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  {status === GameStatus.WON 
                    ? `You cracked the code in ${history.length} guesses.` 
                    : 'The AI outplayed you this time.'}
                </p>
                <button 
                  onClick={startNewGame}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="glass p-4 rounded-xl text-xs text-slate-400 max-w-xs w-full">
            <h4 className="font-bold text-slate-300 mb-1 uppercase tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-circle-info text-blue-400"></i>
              Tactical Briefing
            </h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Guess 4 unique digits (0-9).</li>
              <li>Strikes = Right digit, right spot.</li>
              <li>Balls = Right digit, wrong spot.</li>
              <li>You have 10 attempts total.</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="mt-12 text-slate-600 text-[10px] uppercase tracking-widest font-bold">
        Powered by Gemini 3 Flash • Built for Vercel
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};

export default App;
