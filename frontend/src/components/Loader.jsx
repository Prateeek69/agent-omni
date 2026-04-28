import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export default function Loader({ message = "Processing..." }) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    const messages = [
      "Analyzing...",
      "Extracting text...",
      "Generating insights...",
      "Finalizing..."
    ];
    let count = 0;
    const interval = setInterval(() => {
      setCurrentMessage(messages[count % messages.length]);
      count++;
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <div className="relative flex items-center justify-center w-20 h-20">
        <div className="absolute inset-0 border-[5px] border-slate-100 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.02)]"></div>
        <div className="absolute inset-0 border-[5px] border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
      </div>
      <p className="text-xl font-bold text-slate-700 animate-pulse transition-all duration-300">{currentMessage}</p>
    </div>
  );
}
