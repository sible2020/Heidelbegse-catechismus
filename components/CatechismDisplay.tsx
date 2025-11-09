import React, { useState, useRef, useCallback } from 'react';
import type { SundayContent, QuestionAnswer } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import TranscriptDisplay from './TranscriptDisplay';

// --- Audio Utility Functions ---
// Based on @google/genai documentation for decoding raw PCM audio data.

/**
 * Decodes a base64 string into a Uint8Array.
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer for playback.
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// --- UI Components ---

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
    </svg>
);

const LoadingIcon = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const PauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm9 0a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
);

const LightbulbIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path d="M11 3a1 1 0 100 2h.01a1 1 0 100-2H11zM11 6a1 1 0 011-1h.01a1 1 0 110 2H12a1 1 0 01-1-1zM9.5 8a1 1 0 00-1.447.894l-1 3A1 1 0 008 13.5V15a1 1 0 001 1h2a1 1 0 001-1v-1.5a1 1 0 00-.553-1.606l-1-3A1 1 0 009.5 8zM12 3a1 1 0 100 2h.01a1 1 0 100-2H12z" />
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 5a1 1 0 100-2 1 1 0 000 2zM7 6a1 1 0 100-2 1 1 0 000 2zM5.743 7.429a1 1 0 10-1.486 1.142 5.002 5.002 0 000 4.858 1 1 0 101.486 1.142A3.001 3.001 0 015 12a3 3 0 01.743-1.714zM14.257 7.429a1 1 0 10-1.486-1.142 3 3 0 00-2.514 4.858 1 1 0 101.486 1.142 5.002 5.002 0 010-4.858z" clipRule="evenodd" />
  </svg>
);


interface PlayAudioButtonProps {
  onClick: () => void;
  isLoading: boolean;
  isPlaying: boolean;
}

const PlayAudioButton: React.FC<PlayAudioButtonProps> = ({ onClick, isLoading, isPlaying }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className="flex-shrink-0 p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-sky-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    aria-label={isPlaying ? "Pauzeer audio" : "Speel audio af"}
  >
    {isLoading ? <LoadingIcon /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
  </button>
);


interface QuestionAnswerCardProps {
  qa: QuestionAnswer;
  onPlayAudio: (text: string) => void;
  loadingAudioText: string | null;
  playingAudioText: string | null;
  isHighlighted: boolean;
}

const QuestionAnswerCard: React.FC<QuestionAnswerCardProps> = ({ qa, onPlayAudio, loadingAudioText, playingAudioText, isHighlighted }) => {
    const isQuestionPlaying = playingAudioText === qa.vraag;
    const isQuestionLoading = loadingAudioText === qa.vraag;
    const isAnswerPlaying = playingAudioText === qa.antwoord;
    const isAnswerLoading = loadingAudioText === qa.antwoord;
    const [example, setExample] = useState<string | null>(null);
    const [isExampleLoading, setIsExampleLoading] = useState(false);

    const highlightClass = isHighlighted ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900' : '';

    const handleGenerateExample = async () => {
        setIsExampleLoading(true);
        setExample(null); // Clear previous example
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Gegeven de volgende vraag en antwoord uit de Heidelbergse Catechismus, geef een kort, praktisch en modern voorbeeld dat dit concept illustreert voor iemand van nu. Houd het voorbeeld bondig en begrijpelijk.\n\nVraag: "${qa.vraag}"\n\nAntwoord: "${qa.antwoord}"\n\nPraktisch Voorbeeld:`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            setExample(response.text);

        } catch (error) {
            console.error("Error generating example:", error);
            setExample("Er is een fout opgetreden bij het ophalen van een voorbeeld. Probeer het later opnieuw.");
        } finally {
            setIsExampleLoading(false);
        }
    };


    return (
      <div id={`vraag-${qa.nummer}`} className={`bg-slate-800 rounded-lg shadow-lg p-6 transition-all duration-300 transform hover:scale-[1.02] ${highlightClass}`}>
        <h3 className="text-lg font-semibold text-sky-400 mb-3">
          Vraag {qa.nummer}
        </h3>
        <div className="flex items-start gap-2">
            <PlayAudioButton 
                onClick={() => onPlayAudio(qa.vraag)}
                isLoading={isQuestionLoading}
                isPlaying={isQuestionPlaying}
            />
            <p className={`italic text-slate-300 my-2 transition-colors duration-300 ${isQuestionPlaying ? 'text-sky-300' : ''}`}>{qa.vraag}</p>
        </div>
        <div className="flex items-start gap-2 mt-2">
            <PlayAudioButton 
                onClick={() => onPlayAudio(qa.antwoord)}
                isLoading={isAnswerLoading}
                isPlaying={isAnswerPlaying}
            />
            <p className={`text-slate-200 leading-relaxed my-2 transition-colors duration-300 ${isAnswerPlaying ? 'text-sky-300' : ''}`}>{qa.antwoord}</p>
        </div>
        
        {/* Example Section */}
        <div className="mt-4 pt-4 border-t border-slate-700">
            <button
                onClick={handleGenerateExample}
                disabled={isExampleLoading}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-sky-300 bg-slate-700/50 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExampleLoading ? (
                    <LoadingIcon />
                ) : (
                    <>
                        <LightbulbIcon />
                        {example ? 'Nieuw voorbeeld' : 'Geef een praktisch voorbeeld'}
                    </>
                )}
            </button>
            {isExampleLoading && (
                 <p className="text-slate-400 italic mt-3 animate-pulse">Een moment, het voorbeeld wordt geladen...</p>
            )}
            {example && !isExampleLoading && (
                <div className="mt-3 p-4 bg-slate-900/50 rounded-md border border-slate-700">
                    <p className="text-slate-300">{example}</p>
                </div>
            )}
        </div>
      </div>
    );
};

// --- Main Display Component ---

interface CatechismDisplayProps {
  content: SundayContent[];
  highlightedQuestion: number;
}

const CatechismDisplay: React.FC<CatechismDisplayProps> = ({ content, highlightedQuestion }) => {
  const [loadingAudioText, setLoadingAudioText] = useState<string | null>(null);
  const [playingAudioText, setPlayingAudioText] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCache = useRef(new Map<string, AudioBuffer>());

  const stopAudioAndTranscript = useCallback(() => {
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
    }
    setPlayingAudioText(null);
    setTranscript('');
  }, []);

  const handlePlayAudio = useCallback(async (text: string) => {
    // Stop any currently playing audio
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
    }
    
    // If clicking the currently playing item, effectively stop it.
    if (playingAudioText === text) {
        stopAudioAndTranscript();
        return;
    }

    setPlayingAudioText(null);
    setTranscript('');

    // Initialize AudioContext on first use
    if (!audioContextRef.current) {
        // Fix for TypeScript error on line 153: Property 'webkitAudioContext' does not exist on type 'Window & typeof globalThis'. Did you mean 'AudioContext'?
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if(AudioContext) {
             audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        } else {
            console.error("Web Audio API is not supported in this browser.");
            alert("Sorry, je browser ondersteunt de audiofunctie niet.");
            return;
        }
    }
    const audioContext = audioContextRef.current;


    const playBuffer = (buffer: AudioBuffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => {
            stopAudioAndTranscript();
        };
        source.start();
        currentSourceRef.current = source;
        setPlayingAudioText(text);
        setTranscript(text);
    };

    // Check cache first
    if (audioCache.current.has(text)) {
        const cachedBuffer = audioCache.current.get(text);
        if (cachedBuffer) {
            playBuffer(cachedBuffer);
            return;
        }
    }

    // Not in cache, fetch from API
    setLoadingAudioText(text);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Zeg op een rustige en duidelijke toon: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const audioBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
            audioCache.current.set(text, audioBuffer);
            playBuffer(audioBuffer);
        } else {
            throw new Error("No audio data received from API.");
        }
    } catch (error) {
        console.error("Error generating or playing audio:", error);
        alert("Er is een fout opgetreden bij het genereren van de audio. Probeer het opnieuw.");
    } finally {
        setLoadingAudioText(null);
    }
  }, [playingAudioText, stopAudioAndTranscript]);


  if (!content || content.length === 0) {
    return (
      <div className="text-center text-slate-400 mt-10">
        <p>Selecteer een Zondag om de inhoud te bekijken.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-3xl mx-auto mt-8 space-y-12">
        {content.map((sundayContent) => (
          <section key={sundayContent.zondag} aria-labelledby={`sunday-title-${sundayContent.zondag}`}>
            <div className="text-center mb-8 border-b-2 border-slate-700 pb-4">
              <h2 id={`sunday-title-${sundayContent.zondag}`} className="text-3xl font-bold text-white">
                Zondag {sundayContent.zondag}
              </h2>
              <p className="text-xl text-slate-400 mt-1">{sundayContent.titel}</p>
            </div>
            <div className="space-y-6">
              {sundayContent.vragen.map((qa) => (
                <QuestionAnswerCard 
                  key={qa.nummer} 
                  qa={qa}
                  onPlayAudio={handlePlayAudio}
                  loadingAudioText={loadingAudioText}
                  playingAudioText={playingAudioText}
                  isHighlighted={qa.nummer === highlightedQuestion}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <TranscriptDisplay text={transcript} onClose={stopAudioAndTranscript} />
    </>
  );
};

export default CatechismDisplay;