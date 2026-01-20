import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ALGORITHM: Smart Random Position
const getSafePosition = (existingItems) => {
  let attempts = 0;
  let pos;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const t = Math.floor(Math.random() * 80) + 10; 
    const l = Math.floor(Math.random() * 80) + 10;

    const inCenterBox = (t > 30 && t < 65) && (l > 25 && l < 75);
    const inBottomBtn = (t > 75) && (l > 35 && l < 65);

    if (inCenterBox || inBottomBtn) {
      attempts++;
      continue;
    }

    const tooClose = existingItems.some(item => {
      const existingT = parseFloat(item.pos.top);
      const existingL = parseFloat(item.pos.left);
      const dist = Math.sqrt(Math.pow(t - existingT, 2) + Math.pow(l - existingL, 2));
      return dist < 12;
    });

    if (!tooClose) {
      pos = {
        top: `${t}%`,
        left: `${l}%`,
        rotation: Math.floor(Math.random() * 20) - 10,
      };
      break;
    }
    attempts++;
  }

  if (!pos) {
    pos = { 
      top: `${Math.floor(Math.random() * 80) + 10}%`, 
      left: `${Math.floor(Math.random() * 80) + 10}%`, 
      rotation: 0 
    };
  }

  return pos;
};

// --- ICONS ---
const WeakCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-zinc-500" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// --- COMPONENTS ---

const MentalDump = ({ items, onAddItem, onNext }) => {
  const [input, setInput] = useState('');
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    try {
      const savedRecents = JSON.parse(localStorage.getItem('glass-rubber-recents') || '[]');
      const visibleRecents = savedRecents.filter(r => !items.some(i => i.text === r));
      setRecents(visibleRecents);
    } catch (e) {
      console.error("Failed to load recents", e);
    }
  }, [items]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAddItem(input);
    setInput('');
  };

  return (
    <div className="h-screen w-full relative flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute text-xl font-medium text-text-dim/40 pointer-events-auto cursor-default whitespace-nowrap"
            style={{ 
              top: item.pos.top, 
              left: item.pos.left, 
              transform: `translate(-50%, -50%) rotate(${item.pos.rotation}deg)` 
            }}
          >
            {item.text}
          </motion.div>
        ))}
      </div>

      <div className="z-20 w-full max-w-md bg-card/90 backdrop-blur-md p-8 rounded-3xl border border-border shadow-2xl shadow-black/50">
        <h1 className="text-2xl font-medium mb-6 text-center text-text">What’s on your mind?</h1>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-b-2 border-zinc-700 focus:border-glass outline-none py-2 text-lg text-text transition-colors placeholder:text-zinc-600"
            placeholder="Type here..."
          />
          <button 
            type="submit"
            className="text-zinc-500 hover:text-glass transition-colors font-medium"
          >
            Add
          </button>
        </form>

        <AnimatePresence>
          {recents.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-4 border-t border-zinc-800/50"
            >
              <p className="text-xs text-zinc-600 mb-3 uppercase tracking-wider font-medium">Yesterday you held:</p>
              <div className="flex flex-wrap gap-2">
                {recents.map((text, idx) => (
                  <motion.button
                    key={idx}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={() => onAddItem(text)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-500 hover:border-glass/50 hover:text-glass hover:bg-glass/5 transition-all"
                  >
                    {text}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {items.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onNext}
          className="z-20 absolute bottom-12 bg-zinc-100 text-black px-10 py-3 rounded-full font-medium hover:bg-white transition-colors shadow-lg shadow-black/50"
        >
          Done
        </motion.button>
      )}
    </div>
  );
};

const GlassSelection = ({ items, onToggleType, onNext }) => {
  const glassCount = items.filter(i => i.type === 'glass').length;

  return (
    <div className="min-h-screen w-full flex flex-col items-center pt-20 px-6 max-w-4xl mx-auto pb-32">
      <h1 className="text-3xl font-medium mb-2 text-center text-text">Which are glass balls?</h1>
      <p className="text-zinc-500 mb-12 text-center">Click to select. Unselected items will bounce.</p>

      <div className="flex flex-wrap gap-4 justify-center">
        {items.map((item) => (
          <motion.button
            key={item.id}
            layout
            onClick={() => onToggleType(item.id)}
            className={cn(
              "px-6 py-4 rounded-2xl text-lg font-medium transition-all duration-300 border-2 select-none",
              item.type === 'glass' 
                ? "border-glass bg-glass/10 text-glass shadow-md shadow-glass/10 scale-105" 
                : "border-border bg-card shadow-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            )}
            whileTap={{ scale: 0.95 }}
          >
            {item.text}
          </motion.button>
        ))}
      </div>

      <div className="fixed bottom-10 flex flex-col items-center gap-4 z-20 px-4 text-center">
         <AnimatePresence>
            {glassCount > 5 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-orange-400 font-medium text-sm bg-orange-400/10 px-4 py-2 rounded-full border border-orange-400/20"
              >
                That's a lot of glass. Consider dropping some.
              </motion.div>
            )}
         </AnimatePresence>
        <button
          onClick={onNext}
          className="bg-zinc-100 text-black px-10 py-3 rounded-full font-medium hover:bg-white transition-colors shadow-lg shadow-black/50"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const Explanation = ({ onDismiss }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center cursor-pointer"
      onClick={onDismiss}
    >
      <div className="max-w-md w-full p-8 space-y-12">
        <div className="text-center space-y-2">
          <div className="w-4 h-4 rounded-full bg-glass mx-auto mb-4 shadow-[0_0_15px_rgba(96,165,250,0.5)]"></div>
          <h2 className="text-xl font-medium text-glass">Glass Balls</h2>
          <p className="text-zinc-400">These must not be dropped. If they fall, they shatter.</p>
        </div>
        
        <div className="w-px h-12 bg-zinc-800 mx-auto"></div>

        <div className="text-center space-y-2">
          <div className="w-4 h-4 rounded-full bg-rubber mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-rubber">Rubber Balls</h2>
          <p className="text-zinc-400">These can bounce. You can pick them up later.</p>
        </div>
      </div>
      <p className="absolute bottom-10 text-zinc-600 text-sm animate-pulse">Tap anywhere to continue</p>
    </motion.div>
  );
};

const BalanceScreen = ({ items, setItems, onLock }) => {
  const [energy, setEnergy] = useState(null); 
  const [rubberExpanded, setRubberExpanded] = useState(false);

  const glassItems = items.filter(i => i.type === 'glass');
  const rubberItems = items.filter(i => i.type === 'rubber');

  const handleReorder = (newGlassOrder) => {
    setItems([...newGlassOrder, ...rubberItems]);
  };

  const updateAction = (id, text) => {
    setItems(items.map(i => i.id === id ? { ...i, action: text } : i));
  };

  const getGlassLimit = () => {
    if (energy === 'low') return 1;
    if (energy === 'medium') return 3;
    if (energy === 'high') return 5;
    return 100; 
  };

  const activeGlassLimit = getGlassLimit();

  return (
    <div className="min-h-screen w-full max-w-2xl mx-auto py-12 px-6 pb-40">
      
      <section className="mb-12">
        <h2 className="text-zinc-500 text-sm font-medium uppercase tracking-wide mb-4">1. Energy Check</h2>
        <h3 className="text-xl font-medium mb-6 text-text">How much do you realistically have today?</h3>
        <div className="grid grid-cols-3 gap-4">
          {['low', 'medium', 'high'].map((level) => (
            <button
              key={level}
              onClick={() => setEnergy(level)}
              className={cn(
                "py-4 rounded-xl border transition-all capitalize relative overflow-hidden",
                energy === level 
                  ? "border-zinc-200 bg-zinc-100 text-black shadow-lg scale-105" 
                  : "border-zinc-800 bg-card text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              )}
            >
              <span className="font-bold text-lg">{level}</span>
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {energy && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-glass text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-glass shadow-[0_0_10px_rgba(96,165,250,0.5)]"></span>
                2. Glass Zone
              </h2>
              <span className="text-xs text-zinc-500 italic">Drag to prioritize</span>
            </div>
            
            <Reorder.Group 
              axis="y" 
              values={glassItems} 
              onReorder={handleReorder} 
              className="space-y-4"
            >
              {glassItems.map((item, index) => {
                const isOverLimit = index >= activeGlassLimit;

                return (
                  <Reorder.Item 
                    key={item.id} 
                    value={item}
                    whileDrag={{ scale: 1.05, cursor: "grabbing" }}
                    className="relative"
                  >
                    <div 
                      className={cn(
                        "relative p-6 rounded-2xl border transition-all duration-300 bg-card shadow-lg shadow-glass/5",
                        isOverLimit ? "border-zinc-800" : "border-glass/30"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className={cn(
                          "text-lg font-medium transition-colors",
                          isOverLimit ? "text-zinc-500" : "text-text"
                        )}>
                          {item.text}
                        </span>
                        
                        {isOverLimit && (
                          <span className="text-xs font-medium text-zinc-500 px-2 py-1 border border-zinc-800 rounded bg-zinc-900/50">
                            Postponed
                          </span>
                        )}
                      </div>
                      
                      <div className="relative z-10">
                        {!isOverLimit ? (
                          <>
                            <label className="block text-sm text-zinc-500 mb-2">
                              Smallest action to keep safe:
                            </label>
                            <input
                              type="text"
                              value={item.action || ''}
                              onChange={(e) => updateAction(item.id, e.target.value)}
                              placeholder="e.g. Send one email"
                              className="w-full bg-zinc-900/50 border border-zinc-800 text-text p-3 rounded-lg outline-none focus:border-glass/50 transition-all text-sm placeholder:text-zinc-700"
                            />
                          </>
                        ) : (
                          <div className="text-sm text-zinc-600 italic py-2 border-t border-dashed border-zinc-800 mt-2">
                            To enable this item, drag it higher in the list.
                          </div>
                        )}
                      </div>
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </motion.section>
        )}
      </AnimatePresence>

      <section className="mb-12 border-t border-dashed border-zinc-800 pt-8">
        <button 
          onClick={() => setRubberExpanded(!rubberExpanded)}
          className="w-full flex items-center justify-between text-rubber hover:text-zinc-400 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rubber"></span>
            <span className="font-medium">The Rubber Container ({rubberItems.length})</span>
          </div>
          <span className="text-sm">{rubberExpanded ? 'Collapse' : 'Expand'}</span>
        </button>

        <AnimatePresence>
          {rubberExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 grid grid-cols-2 gap-3">
                {rubberItems.map(item => (
                  <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-zinc-500 text-sm">
                    {item.text}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="fixed bottom-0 left-0 w-full bg-linear-to-t from-bg via-bg to-transparent pb-8 pt-12 flex justify-center z-50 pointer-events-none">
        <button
          onClick={onLock}
          disabled={!energy}
          className="pointer-events-auto bg-zinc-100 text-black px-12 py-4 rounded-full font-medium shadow-xl shadow-black/50 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Lock Today
        </button>
      </div>
    </div>
  );
};

// --- LOCKED SCREEN (WITH WEAK CHECK) ---
const LockedScreen = ({ items, onToggleHandled, onReset }) => {
  const glass = items.filter(i => i.type === 'glass' && i.action);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <div className="text-center mb-8 max-w-lg">
        <div className="w-16 h-16 rounded-full border-4 border-zinc-800 flex items-center justify-center mx-auto mb-4 bg-zinc-900">
           <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h1 className="text-2xl font-medium mb-2 text-text">Today is Locked</h1>
        <p className="text-zinc-500">Focus only on what matters.</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        {glass.map(item => {
          const isHandled = item.handled || false;
          return (
            <motion.div 
              layout
              key={item.id} 
              className={cn(
                "bg-card border-l-4 p-4 rounded-r-xl shadow-sm border-y border-r border-zinc-800 transition-all duration-300",
                isHandled ? "border-l-zinc-700 opacity-50 grayscale" : "border-l-glass opacity-100"
              )}
            >
               <div className="flex items-start gap-4">
                  {/* WEAK CIRCLE INTERACTION */}
                  <button 
                    onClick={() => onToggleHandled(item.id)}
                    className={cn(
                      "mt-1 w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0",
                      isHandled 
                        ? "bg-zinc-800 border-zinc-800" // Handled State
                        : "border-zinc-700 hover:border-zinc-500" // Unhandled State
                    )}
                  >
                    {isHandled && <WeakCheckIcon />}
                  </button>

                  <div className="flex-1">
                    <p className={cn("text-sm mb-1 transition-colors", isHandled ? "text-zinc-600" : "text-zinc-500")}>{item.text}</p>
                    <p className={cn("font-medium text-lg transition-colors", isHandled ? "text-zinc-500 line-through decoration-zinc-700" : "text-text")}>{item.action}</p>
                  </div>
               </div>
            </motion.div>
          );
        })}
        
        {glass.length === 0 && (
            <p className="text-center text-zinc-600 italic">No glass balls actively carried today. Rest well.</p>
        )}
      </div>

      <div className="absolute top-6 right-6">
        <button 
          onClick={onReset}
          className="text-xs text-zinc-600 hover:text-red-400 transition-colors uppercase tracking-wider"
        >
          Reset Day
        </button>
      </div>
      
      <p className="absolute bottom-6 text-xs text-zinc-700">Come back tomorrow.</p>
    </div>
  )
}

// --- MAIN APP ---
export default function App() {
  const [step, setStep] = useState('dump'); 
  const [items, setItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('glass-rubber-data');
    if (saved) {
      const { date, state, data } = JSON.parse(saved);
      const today = new Date().toDateString();
      if (date === today && state === 'locked') {
        setItems(data);
        setStep('locked');
      }
    }
  }, []);

  const addItem = (text) => {
    const pos = getSafePosition(items);
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      type: 'rubber', 
      pos: pos,
    };
    setItems([...items, newItem]);
  };

  const toggleType = (id) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, type: item.type === 'glass' ? 'rubber' : 'glass' };
      }
      return item;
    }));
  };

  // TOGGLE HANDLED (WEAK CHECK) + PERSISTENCE
  const toggleHandled = (id) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        return { ...item, handled: !item.handled };
      }
      return item;
    });
    setItems(updatedItems);

    // Save immediately so checks persist on refresh
    if (step === 'locked') {
      const dataToSave = {
        date: new Date().toDateString(),
        state: 'locked',
        data: updatedItems
      };
      localStorage.setItem('glass-rubber-data', JSON.stringify(dataToSave));
    }
  };

  const finishSelection = () => {
    const hasSeenIntro = localStorage.getItem('glass-rubber-intro-seen');
    if (hasSeenIntro) {
      setStep('balance');
    } else {
      setStep('explain');
    }
  };

  const finishExplanation = () => {
    localStorage.setItem('glass-rubber-intro-seen', 'true');
    setStep('balance');
  };

  const lockDay = () => {
    const glassTexts = items.filter(i => i.type === 'glass').map(i => i.text);
    const existingRecents = JSON.parse(localStorage.getItem('glass-rubber-recents') || '[]');
    const newRecents = [...new Set([...glassTexts, ...existingRecents])].slice(0, 10);
    localStorage.setItem('glass-rubber-recents', JSON.stringify(newRecents));

    const dataToSave = {
      date: new Date().toDateString(),
      state: 'locked',
      data: items
    };
    localStorage.setItem('glass-rubber-data', JSON.stringify(dataToSave));
    setStep('locked');
  };

  const resetDay = () => {
    if (window.confirm("Are you sure? This will clear today's plan.")) {
      localStorage.removeItem('glass-rubber-data');
      setItems([]);
      setStep('dump');
    }
  };

  return (
    <div className="font-sans text-text antialiased selection:bg-glass/20 selection:text-glass">
      {step === 'dump' && <MentalDump items={items} onAddItem={addItem} onNext={() => setStep('select')} />}
      
      {step === 'select' && <GlassSelection items={items} onToggleType={toggleType} onNext={finishSelection} />}
      
      {step === 'explain' && <Explanation onDismiss={finishExplanation} />}
      
      {step === 'balance' && <BalanceScreen items={items} setItems={setItems} onLock={lockDay} />}
      
      {step === 'locked' && <LockedScreen items={items} onToggleHandled={toggleHandled} onReset={resetDay} />}
    </div>
  );
}