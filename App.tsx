import React, { useState, useMemo, useEffect } from 'react';
import SundaySelector from './components/SundaySelector';
import QuestionSelector from './components/QuestionSelector';
import CatechismDisplay from './components/CatechismDisplay';
import { CATECHISMUS_DATA } from './data/catechismus';
import type { SundayContent, QuestionAnswer } from './types';

function App() {
  const [selectedSunday, setSelectedSunday] = useState<number>(0); // 0 means 'show all'
  const [highlightedQuestion, setHighlightedQuestion] = useState<number>(0);

  const allSundays = useMemo(() => CATECHISMUS_DATA.map(item => item.zondag), []);

  const allQuestions = useMemo(() => {
    return CATECHISMUS_DATA.flatMap(sunday =>
      sunday.vragen.map(qa => ({ ...qa, zondag: sunday.zondag }))
    );
  }, []);

  const handleSundayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSunday(Number(event.target.value));
    setHighlightedQuestion(0);
  };
  
  const handleQuestionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const questionNum = Number(event.target.value);
      if (questionNum === 0) {
        setHighlightedQuestion(0);
        setSelectedSunday(0); // Optionally go to "show all"
        return;
      }
      
      const questionData = allQuestions.find(q => q.nummer === questionNum);
      if (questionData) {
        setSelectedSunday(questionData.zondag);
        // Set highlighted question, which triggers the useEffect
        setHighlightedQuestion(questionNum);
      }
    };

  useEffect(() => {
      if (highlightedQuestion > 0) {
        const element = document.getElementById(`vraag-${highlightedQuestion}`);
        if (element) {
          // Timeout ensures the DOM has updated, especially if the Sunday view has just changed
          const scrollTimer = setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Remove the highlight after a couple of seconds
            const highlightTimer = setTimeout(() => {
              setHighlightedQuestion(0);
            }, 2500);
            // Cleanup for the highlight timer
            return () => clearTimeout(highlightTimer);
          }, 100);
          // Cleanup for the scroll timer
          return () => clearTimeout(scrollTimer);
        }
      }
  }, [highlightedQuestion]);


  const currentContent: SundayContent[] = useMemo(() => {
    if (selectedSunday === 0) {
      return CATECHISMUS_DATA;
    }
    const foundContent = CATECHISMUS_DATA.find(item => item.zondag === selectedSunday);
    return foundContent ? [foundContent] : [];
  }, [selectedSunday]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        <header className="text-center my-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Heidelbergse Catechismus
          </h1>
          <p className="mt-2 text-lg text-sky-300">
            In moderne taal
          </p>
        </header>

        <main>
          <section className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md py-4 -mx-4 px-4 mb-4 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto">
                <SundaySelector
                  sundays={allSundays}
                  selectedSunday={selectedSunday}
                  onChange={handleSundayChange}
                />
                <QuestionSelector
                   allQuestions={allQuestions}
                   onChange={handleQuestionChange}
                />
            </div>
          </section>

          <section>
            <CatechismDisplay content={currentContent} highlightedQuestion={highlightedQuestion} />
          </section>
        </main>

        <footer className="text-center text-slate-500 mt-12 py-6 border-t border-slate-800">
          <p>&copy; {new Date().getFullYear()} Gemaakt met moderne technologie voor een tijdloze boodschap.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
