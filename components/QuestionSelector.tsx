import React from 'react';
import type { QuestionAnswer } from '../types';

interface QuestionSelectorProps {
  allQuestions: QuestionAnswer[];
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({ allQuestions, onChange }) => {
  return (
    <div className="w-full sm:w-1/2">
      <label htmlFor="question-select" className="block text-sm font-medium text-slate-400 mb-2">
        Zoek een vraag
      </label>
      <div className="relative">
        <select
          id="question-select"
          // We don't control the value from the parent, reset to default on each render
          // The parent will handle the selection logic
          onChange={onChange}
          // Set a default value so the placeholder is shown
          defaultValue="0"
          className="block w-full px-4 py-3 pr-8 text-base bg-slate-700 border border-slate-600 rounded-md shadow-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 appearance-none"
        >
          <option value="0" disabled>Kies een vraag...</option>
          {allQuestions.map((qa) => (
            <option key={qa.nummer} value={qa.nummer}>
              Vraag {qa.nummer}: {qa.vraag.substring(0, 50)}...
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 7.53 7.28a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.28a.75.75 0 011.06 0L10 15.19l2.47-2.47a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default QuestionSelector;
