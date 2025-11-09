import React from 'react';

interface TranscriptDisplayProps {
  text: string;
  onClose: () => void;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ text, onClose }) => {
  if (!text) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm p-4 bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-700 animate-fade-in-up">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-bold uppercase tracking-wider text-sky-400">Audioscript</h4>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="Sluit transcript"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <p className="text-slate-200 text-base leading-relaxed max-h-48 overflow-y-auto">
        {text}
      </p>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(1rem); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TranscriptDisplay;
