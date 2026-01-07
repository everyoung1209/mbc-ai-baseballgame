
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, GuessRecord, GameStats } from './types.ts';
import { generateTargetNumber, calculateResult } from './utils/gameLogic.ts';
import { getAICommentary } from './services/geminiService.ts';
import Keypad from './components/Keypad.tsx';

const App: React.FC = () => {
  const [target, setTarget] = useState<string>('');
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [history, setHistory] = useState<GuessRecord[]>([]);
  const [status, setStatus] = useState<GameStatus>(GameStatus.PLAYING);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [stats, setStats] = useState<GameStats>({ wins: 0, losses: 0, bestScore: null });
  const scrollRef = useRef<HTMLDivElement>(null);

  // API KEY 확인
  const isApiKeyMissing = !process.env.API_KEY || process.env.API_KEY === 'YOUR_API_KEY';

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

    let commentary = "";
    if (!isApiKeyMissing) {
      commentary = await getAICommentary(target, history, currentGuess, strikes, balls);
    } else {
      commentary = "API Key가 설정되지 않아 분석 데이터를 제공할 수 없습니다. Vercel 환경 변수를 확인하세요.";
    }

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
    } else if (history.length >= 9) {
      setStatus(GameStatus.LOST);
      setStats(prev => ({ ...prev, losses: prev.losses + 1 }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-5xl mx-auto">
      {/* API Key Warning Banner */}
      {isApiKeyMissing && (
        <div className="w-full bg-amber-500/20 border border-amber-500/50 p-3 rounded-xl mb-6 flex items-center gap-3 text-amber-200 text-sm animate-fade">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>
            <b>Gemini API Key 미설정:</b> Vercel 대시보드에서 <code>API_KEY</code> 환경 변수를 등록해야 AI 해설 기능이 작동합니다.
          </span>
        </div>
      )}

      {/* Header */}
      <header className="w-full flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-emerald-400">NUMERUS</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">AI Strategic Match</p>
        </div>
        <div className="flex gap-3 text-sm font-medium">
          <div className="glass px-3 py-1.5 rounded-lg flex flex-col items-center min-w-[50px]">
            <span className="text-slate-400 text-[9px] uppercase">Wins</span>
            <span className="text-emerald-400 font-bold">{stats.wins}</span>
          </div>
          <div className="glass px-3 py-1.5 rounded-lg flex flex-col items-center min-w-[50px]">
            <span className="text-slate-400 text-[9px] uppercase">Best</span>
            <span className="text-blue-400 font-bold">{stats.bestScore || '-'}</span>
          </div>
          <button 
            onClick={startNewGame}
            className="bg-slate-800 hover:bg-slate-700 transition-all px-4 rounded-lg flex items-center justify-center border border-slate-700 active:scale-95"
          >
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>
      </header>

      <main className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow">
        {/* Match History */}
        <section className="flex flex-col gap-4 h-[50vh] lg:h-[70vh]">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <i className="fa-solid fa-terminal text-emerald-500 text-sm"></i>
              Match History
            </h2>
            <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
              TRY {history.length}/10
            </span>
          </div>
          
          <div 
            ref={scrollRef}
            className="glass rounded-2xl flex-grow overflow-y-auto p-5 space-y-5 custom-scrollbar shadow-inner"
          >
            {history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8">
                <i className="fa-solid fa-brain text-7xl mb-6"></i>
                <p className="text-lg">Waiting for your first sequence...</p>
              </div>
            )}
            {history.map((record, idx) => (
              <div key={record.timestamp} className="animate-fade">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-700">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="mono text-2xl font-black tracking-[0.2em] text-white">{record.guess}</span>
                      <div className="flex gap-2 text-[10px] font-black">
                        <span className={`px-2 py-1 rounded-md border ${record.strikes > 0 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-500 opacity-40'}`}>
                          {record.strikes} STRIKE
                        </span>
                        <span className={`px-2 py-1 rounded-md border ${record.balls > 0 ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-slate-700 text-slate-500 opacity-40'}`}>
                          {record.balls} BALL
                        </span>
                      </div>
                    </div>
                    {record.commentary && (
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 text-sm text-slate-400 leading-relaxed relative">
                        <div className="absolute -left-1 top-4 w-1 h-4 bg-emerald-500/50 rounded-full"></div>
                        {record.commentary}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isAIThinking && (
              <div className="flex items-center gap-3 p-4">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Master is analyzing...</span>
              </div>
            )}
          </div>
        </section>

        {/* Console / Input */}
        <section className="flex flex-col justify-center items-center gap-10">
          <div className="w-full max-w-xs">
            <div className="flex justify-between mb-4 px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">System Input</span>
              {status === GameStatus.WON && <span className="text-[10px] font-black text-emerald-400 animate-pulse">SYSTEM UNLOCKED</span>}
              {status === GameStatus.LOST && <span className="text-[10px] font-black text-rose-500 animate-pulse">ACCESS DENIED</span>}
            </div>
            <div className="flex gap-3 justify-center mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`w-16 h-20 rounded-2xl border-2 flex items-center justify-center text-4xl font-black mono transition-all duration-300
                    ${currentGuess[i] ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-slate-800 text-slate-700 bg-slate-900/50'}
                    ${status !== GameStatus.PLAYING ? 'opacity-30' : ''}
                  `}
                >
                  {status === GameStatus.LOST ? target[i] : (currentGuess[i] || '•')}
                </div>
              ))}
            </div>
            {status === GameStatus.LOST && (
              <p className="text-center text-rose-400 font-mono text-xs mt-4">CORRECT_SEQ: {target}</p>
            )}
          </div>

          <div className="w-full">
            {status === GameStatus.PLAYING ? (
              <Keypad 
                onKeyPress={handleKeyPress} 
                onDelete={handleDelete} 
                onSubmit={handleSubmit}
                disabled={isAIThinking}
              />
            ) : (
              <div className="text-center p-8 glass rounded-3xl border-emerald-500/20 max-w-xs mx-auto animate-fade">
                <div className={`text-5xl mb-6 ${status === GameStatus.WON ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <i className={`fa-solid ${status === GameStatus.WON ? 'fa-shield-check' : 'fa-skull-crossbones'}`}></i>
                </div>
                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">
                  {status === GameStatus.WON ? 'Breach Success' : 'Session Terminated'}
                </h3>
                <p className="text-xs text-slate-500 mb-8 uppercase font-bold tracking-widest">
                  {status === GameStatus.WON 
                    ? `Attempts: ${history.length}` 
                    : 'Security re-established.'}
                </p>
                <button 
                  onClick={startNewGame}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/20 active:scale-95 uppercase tracking-widest text-sm"
                >
                  Initiate New Session
                </button>
              </div>
            )}
          </div>

          {/* Quick Info Overlay */}
          <div className="glass p-5 rounded-2xl text-[11px] text-slate-400 max-w-xs w-full leading-relaxed border-l-4 border-l-blue-500">
            <h4 className="font-black text-slate-300 mb-2 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-microchip text-blue-500"></i>
              Operational Manual
            </h4>
            <ul className="space-y-1.5 opacity-80">
              <li className="flex items-start gap-2"><span className="text-blue-500">•</span> Input 4 unique digits (0-9).</li>
              <li className="flex items-start gap-2"><span className="text-blue-500">•</span> <b>STRIKE:</b> Correct digit, correct position.</li>
              <li className="flex items-start gap-2"><span className="text-blue-500">•</span> <b>BALL:</b> Correct digit, wrong position.</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="mt-12 mb-4 text-slate-700 text-[10px] uppercase tracking-[0.4em] font-black">
        Protocol Numerus v2.0 • AI Powered Logic
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
};

export default App;
