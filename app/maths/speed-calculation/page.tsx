"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, RotateCcw, Pause } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { createClient } from "@/utils/supabase/client";
import questionsData from "@/app/data/speed_calc_questions.json";

// --- Game Constants ---
const COLUMNS = 5;
const COL_WIDTH_PERCENT = 100 / COLUMNS;
const SPAWN_Rate_MS = 3500; 
const GRAVITY_PIXELS_PER_TICK = 1.0; 
const TICK_Rate_MS = 16;

interface NumberBlock {
  id: string;
  value: number;
  col: number; // Column index 0-4
  y: number; // Pixels
  speed: number;
  color: string;
}

const COLORS = [
  "border-cyan-500 shadow-cyan-500/50 text-cyan-500",
  "border-purple-500 shadow-purple-500/50 text-purple-500",
  "border-green-500 shadow-green-500/50 text-green-500",
  "border-yellow-500 shadow-yellow-500/50 text-yellow-500",
  "border-pink-500 shadow-pink-500/50 text-pink-500",
];

export default function SpeedCalculationGame() {
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [blocks, setBlocks] = useState<NumberBlock[]>([]);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [target, setTarget] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [gameTime, setGameTime] = useState(0);
  const [operation, setOperation] = useState<'add' | 'subtract' | 'multiply' | 'divide' | 'square'>('add');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0); 
  const gameOverRef = useRef(false); 

  // --- Core Game Loop ---

  // Spawning Rows (Wave Logic)
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    // Only spawn if NO blocks exist (Wave Cleared)
    if (blocks.length === 0) {
       spawnRow();
    }
  }, [isPlaying, isGameOver, blocks.length]);

  const spawnRow = () => {
    // Pick a random question from the dataset
    const randomIndex = Math.floor(Math.random() * questionsData.length);
    const question = questionsData[randomIndex];

    // Map JSON type to internal operation type
    let opType: 'add' | 'subtract' | 'multiply' | 'divide' | 'square' = 'add';
    switch(question.type) {
      case 'addition': opType = 'add'; break;
      case 'subtraction': opType = 'subtract'; break;
      case 'multiplication': opType = 'multiply'; break;
      case 'division': opType = 'divide'; break;
      case 'square': opType = 'square'; break;
    }
    
    setOperation(opType);
    setTarget(question.target);
    targetRef.current = question.target;

    // Generate Blocks from Question Numbers
    const newBlocks: NumberBlock[] = [];
    const rowId = Math.random().toString(36).substr(2, 5);
    
    // Ensure we have exactly COLUMNS (5) numbers. 
    const rowValues = question.numbers; 

    for (let i = 0; i < COLUMNS; i++) {
        // Fallback random if data is missing (safety)
        const val = rowValues[i] !== undefined ? rowValues[i] : Math.floor(Math.random() * 9) + 1;
        
        newBlocks.push({
            id: `${rowId}-${i}`,
            value: val,
            col: i,
            y: -80,
            speed: 1, 
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
    }

    setBlocks(newBlocks); 
  };

  // Gravity & Game Over Check
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    
    const gameLoop = setInterval(() => {
      if (!containerRef.current) return;
      const height = containerRef.current.clientHeight;

      setBlocks((prev) => {
        // Difficulty Ramp: Increase speed multiplier
        const difficultyMultiplier = 1 + (score / 500); 

        const nextBlocks = prev.map((b) => ({
          ...b,
          y: b.y + (GRAVITY_PIXELS_PER_TICK * difficultyMultiplier),
        }));

        // Check Logic: Game Over if block hits bottom
        const hitBottom = nextBlocks.some((b) => b.y > height - 60);
        if (hitBottom) {
          endGame();
        }

        return nextBlocks;
      });
      
       setGameTime(prev => prev + TICK_Rate_MS);

    }, TICK_Rate_MS);

    return () => clearInterval(gameLoop);
  }, [isPlaying, isGameOver, score]); 


  // --- Interaction Handlers ---

  const handleBlockClick = (block: NumberBlock) => {
    if (!isPlaying || isGameOver) return;

    // For square operation, only allow single selection
    if (operation === 'square') {
      const newSelected = [block.id];
      setSelectedBlockIds(newSelected);
      
      const selectedValue = block.value;
      const squared = selectedValue * selectedValue;
      
      if (squared === target) {
        handleSuccess(newSelected);
      }
      return;
    }

    // Toggle selection for other operations
    let newSelected = [...selectedBlockIds];
    if (newSelected.includes(block.id)) {
      newSelected = newSelected.filter((id) => id !== block.id);
    } else {
      // Limit selections based on operation
      if (operation === 'add' && newSelected.length >= 3) return;
      if ((operation === 'subtract' || operation === 'multiply' || operation === 'divide') && newSelected.length >= 2) return;
      
      newSelected.push(block.id);
    }
    setSelectedBlockIds(newSelected);

    // Check result based on operation
    const selectedBlocks = blocks.filter((b) => newSelected.includes(b.id));
    const values = selectedBlocks.map(b => b.value);
    
    let result: number = 0;
    
    switch(operation) {
      case 'add':
        result = values.reduce((a, b) => a + b, 0);
        break;
      case 'subtract':
        if (values.length === 2) {
          result = Math.max(...values) - Math.min(...values);
        }
        break;
      case 'multiply':
        if (values.length === 2) {
          result = values[0] * values[1];
        }
        break;
      case 'divide':
        if (values.length === 2) {
          const sorted = values.sort((a, b) => b - a);
          result = Math.floor(sorted[0] / sorted[1]);
        }
        break;
    }

    if (result === target && result > 0) {
      handleSuccess(newSelected);
    }
  };

  const handleSuccess = (matchedIds: string[]) => {
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#ec4899', '#3b82f6']
    });

    setScore((prev) => prev + (matchedIds.length * 10) + target);
    setSelectedBlockIds([]);
    
    // Clear ALL blocks to trigger next wave
    setBlocks([]);
    setTarget(0);
    targetRef.current = 0;
  };



  const startGame = () => {
    gameOverRef.current = false; // Reset ref
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setBlocks([]);
    setSelectedBlockIds([]);
    setTarget(0);
    setGameTime(0);
    setOperation('add');
  };




  const endGame = async () => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    
    setIsPlaying(false);
    setIsGameOver(true);
    
    // Save Score to Supabase
    if (score > 0) {
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('quant_scores').insert({
              user_id: user.id,
              game_mode: 'Speed Calculation',
              score: score,
              wave_reached: Math.floor(score / 50) + 1 
          });

          // Update XP
          const { data: profile } = await supabase
            .from('users')
            .select('xp')
            .eq('id', user.id)
            .single();
          
          if (profile) {
              const currentXp = profile.xp || 0;
              const xpGain = Math.floor(score / 2); // 50% of score as XP
              await supabase
                .from('users')
                .update({ xp: currentXp + xpGain })
                .eq('id', user.id);
          }
        }
      } catch (error) {
        console.error("Error saving quant score:", error);
      }
    }
  };

  // --- Render Helpers ---
  
  const getOperationSymbol = () => {
    switch(operation) {
      case 'add': return '+';
      case 'subtract': return '−';
      case 'multiply': return '×';
      case 'divide': return '÷';
      case 'square': return 'x²';
      default: return '+';
    }
  };
  
  const getOperationName = () => {
    switch(operation) {
      case 'add': return 'Addition';
      case 'subtract': return 'Subtraction';
      case 'multiply': return 'Multiplication';
      case 'divide': return 'Division';
      case 'square': return 'Square';
      default: return 'Addition';
    }
  };
  
  const getCurrentResult = () => {
    const values = blocks
      .filter(b => selectedBlockIds.includes(b.id))
      .map(b => b.value);
    
    if (values.length === 0) return 0;
    
    switch(operation) {
      case 'add':
        return values.reduce((a, b) => a + b, 0);
      case 'subtract':
        if (values.length === 2) {
          return Math.max(...values) - Math.min(...values);
        }
        return 0;
      case 'multiply':
        if (values.length === 2) {
          return values[0] * values[1];
        }
        return 0;
      case 'divide':
        if (values.length === 2) {
          const sorted = values.sort((a, b) => b - a);
          return Math.floor(sorted[0] / sorted[1]);
        }
        return 0;
      case 'square':
        if (values.length === 1) {
          return values[0] * values[0];
        }
        return 0;
      default:
        return 0;
    }
  };
  
  const currentResult = getCurrentResult();

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden font-sans select-none">
       {/* Subtle Background Pattern */}
       <div 
         className="absolute inset-0 z-0 opacity-5"
         style={{
           backgroundImage: "url('/assets/generated/speed_calc_bg_1766630371104.png')",
           backgroundSize: 'cover',
           backgroundPosition: 'center',
         }}
       />

       {/* Minimal Corner HUD */}
       <div className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between p-4">
          {/* Exit Button - Top Left */}
          <Link href="/maths">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            >
               <ArrowLeft className="w-4 h-4 mr-1" /> Exit
            </Button>
          </Link>

          {/* Target - Top Center */}
          <div className="flex flex-col items-center">
             <span className="text-[10px] uppercase tracking-wider text-white/40 mb-1">TARGET</span>
             <div className="flex items-center gap-3">
               <div className="flex flex-col items-center gap-1">
                 <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-lg font-bold border border-cyan-500/30">
                   {getOperationSymbol()}
                 </span>
                 <span className="text-[9px] uppercase tracking-wider text-cyan-400/60 font-semibold">
                   {getOperationName()}
                 </span>
               </div>
               <motion.div 
                 key={target}
                 initial={{ scale: 1.3 }}
                 animate={{ scale: 1 }}
                 className="text-5xl font-black font-mono text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]"
               >
                  {target || "?"}
               </motion.div>
             </div>
          </div>

          {/* Score - Top Right */}
          <div className="text-right">
             <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">SCORE</div>
             <div className="text-2xl font-bold font-mono text-white">{score}</div>
          </div>
       </div>

       {/* Main Game Area - Maximum Space */}
       <div 
         ref={containerRef}
         className="absolute inset-0 top-24 bottom-20 z-10"
       >
          <AnimatePresence>
            {blocks.map((block) => {
              const isSelected = selectedBlockIds.includes(block.id);
              const leftPos = (block.col * COL_WIDTH_PERCENT); 

              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1, y: block.y }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0 }} 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: `${leftPos}%`,
                    width: `${COL_WIDTH_PERCENT}%`,
                    display: 'flex',
                    justifyContent: 'center',
                     // Remove 'y' here as it's invalid CSS property, managed by Framer Motion 'animate' prop
                  }}
                  className="cursor-pointer"
                  onClick={() => handleBlockClick(block)}
                >
                  <div 
                    className={`
                      w-16 h-16 flex items-center justify-center rounded-xl border-2 
                      backdrop-blur-md transition-all duration-150
                      ${block.color}
                      ${isSelected 
                        ? 'bg-white text-black scale-125 shadow-[0_0_40px_rgba(255,255,255,0.8)] border-white z-50' 
                        : 'bg-black/30 hover:bg-black/50 hover:scale-105'}
                    `}
                  >
                     <span className="text-3xl font-bold font-mono">{block.value}</span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Start Screen */}
          {!isPlaying && !isGameOver && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50">
                <div className="text-center px-6">
                   <h1 className="text-6xl font-black text-white mb-4 tracking-tight">SPEED CALC</h1>
                   <p className="text-gray-300 mb-10 max-w-md mx-auto text-lg">
                     Tap numbers to match the target sum.<br/>
                     <span className="text-cyan-400 font-semibold">Clear the wave before it hits bottom!</span>
                   </p>
                   <Button 
                     size="lg" 
                     className="w-56 h-16 text-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-full shadow-[0_0_30px_rgba(8,145,178,0.6)] font-bold"
                     onClick={startGame}
                   >
                      <Play className="mr-3 fill-current w-6 h-6" /> START
                   </Button>
                </div>
             </div>
          )}

          {/* Game Over Screen */}
          {isGameOver && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-lg z-50">
                <div className="text-center px-6">
                   <h2 className="text-5xl font-black text-red-500 mb-4">GAME OVER</h2>
                   <p className="text-white text-3xl mb-8 font-mono">Score: <span className="text-cyan-400">{score}</span></p>
                   <Button 
                     size="lg" 
                     variant="outline" 
                     className="w-56 h-16 text-xl border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-full font-bold"
                     onClick={startGame}
                   >
                      <RotateCcw className="mr-3 w-5 h-5" /> TRY AGAIN
                   </Button>
                </div>
             </div>
          )}
       </div>

       {/* Bottom Sum Display - Fixed at Bottom */}
       <div className="absolute bottom-0 left-0 right-0 z-20 pb-6 flex justify-center">
           <motion.div 
             animate={{ 
               scale: currentResult === target ? 1.1 : 1,
               borderColor: currentResult > target ? 'rgb(239, 68, 68)' : currentResult === target ? 'rgb(34, 197, 94)' : 'rgba(255,255,255,0.1)'
             }}
             className="bg-black/40 backdrop-blur-xl border-2 rounded-2xl px-10 py-4 inline-flex items-center gap-6 shadow-2xl"
           >
              <span className="text-white/60 uppercase text-sm font-bold tracking-wider">
                {operation === 'square' ? 'SQUARE' : 'RESULT'}
              </span>
              <span className={`text-4xl font-mono font-black transition-colors ${
                currentResult > target ? 'text-red-500' : 
                currentResult === target ? 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 
                'text-white'
              }`}>
                 {currentResult}
              </span>
           </motion.div>
       </div>
    </div>
  );
}
