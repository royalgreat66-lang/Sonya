import { useState, useEffect, useRef } from 'react';

export function useSpeechInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState<'en-US' | 'ar-EG'>('en-US');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptAccumRef = useRef<string>('');

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }
        }
        fullTranscript = fullTranscript.trim();

        if (fullTranscript) {
          const prevLen = transcriptAccumRef.current.length;
          const newPortion = fullTranscript.slice(prevLen).trim();
          if (newPortion) {
            onTranscript(newPortion);
          }
          transcriptAccumRef.current = fullTranscript;
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setIsSupported(false);
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        // Dynamically apply selected oral language context
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  return {
    isListening,
    isSupported,
    lang,
    setLang,
    toggleListening,
  };
}
