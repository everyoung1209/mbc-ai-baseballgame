
import React from 'react';

interface KeypadProps {
  onKeyPress: (num: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled: boolean;
}

const Keypad: React.FC<KeypadProps> = ({ onKeyPress, onDelete, onSubmit, disabled }) => {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
      {numbers.map((num) => (
        <button
          key={num}
          onClick={() => onKeyPress(num)}
          disabled={disabled}
          className="h-14 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xl font-bold transition-all border border-slate-700 active:scale-95 flex items-center justify-center shadow-lg"
        >
          {num}
        </button>
      ))}
      <button
        onClick={onDelete}
        disabled={disabled}
        className="h-14 bg-rose-900/40 hover:bg-rose-900/60 disabled:opacity-50 rounded-xl text-xl flex items-center justify-center border border-rose-800/50"
      >
        <i className="fa-solid fa-backspace"></i>
      </button>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="h-14 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-xl flex items-center justify-center border border-emerald-500 shadow-emerald-500/20 shadow-lg"
      >
        <i className="fa-solid fa-paper-plane"></i>
      </button>
    </div>
  );
};

export default Keypad;
