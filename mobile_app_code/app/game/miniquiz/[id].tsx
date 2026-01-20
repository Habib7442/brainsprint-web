import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Dimensions, Animated as RNAnimated, Image as RNImage, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/useAuthStore';
import { useMiniQuizStore } from '../../../store/useMiniQuizStore';

const { width } = Dimensions.get('window');

export default function MiniQuizGameScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  usePreventScreenCapture();
  
  const { 
    fetchQuestions, 
    currentQuestions, 
    loading, 
    submitScore, 
    checkParticipation, 
    userAttempt, 
    fetchLeaderboard, 
    leaderboard,
    quizzes,
    fetchQuizzes 
  } = useMiniQuizStore();

  const currentQuiz = quizzes.find(q => q.id === id);
  const maxTimeSeconds = (currentQuiz?.total_time_minutes || 5) * 60;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'review' | 'leaderboard'>('loading');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<{questionId: string, isCorrect: boolean, selected: string}[]>([]);

  // Initialization
  useEffect(() => {
    if (id) {
        init();
    }
  }, [id]);

  const init = async () => {
      await Promise.all([
          fetchQuestions(id as string),
          checkParticipation(id as string),
          fetchLeaderboard(id as string),
          quizzes.length === 0 ? fetchQuizzes() : Promise.resolve()
      ]);
      setGameState(userAttempt ? 'leaderboard' : 'start');
  };

  // Timer
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      if (gameState === 'playing') {
          interval = setInterval(() => {
              setTimeElapsed(t => t + 1);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [gameState]);

  // Auto-finish when time runs out
  useEffect(() => {
      if (gameState === 'playing' && timeElapsed >= maxTimeSeconds) {
          finishGame();
      }
  }, [timeElapsed, gameState, maxTimeSeconds]);

  // Back Handler prevention during game
  useEffect(() => {
      const backAction = () => {
          if (gameState === 'playing') {
              Alert.alert('Quit Quiz?', 'Your progress will be lost.', [
                  { text: 'Cancel', onPress: () => null, style: 'cancel' },
                  { text: 'Quit', onPress: () => router.back() }
              ]);
              return true;
          }
          return false;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
  }, [gameState]);

  const handleStart = () => {
      setGameState('playing');
  };

  const handleAnswer = (option: string) => {
      if (selectedOption) return; // Prevent double tap

      setSelectedOption(option);
      const currentQ = currentQuestions[currentIndex];
      const correct = option === currentQ.correct_answer;
      
      setIsCorrect(correct);
      if (correct) setScore(s => s + 10); // 10 points per question

      // Save answer
      setAnswers([...answers, { questionId: currentQ.id, isCorrect: correct, selected: option }]);

      // Delay next
      setTimeout(() => {
          if (currentIndex < currentQuestions.length - 1) {
              setCurrentIndex(currentIndex + 1);
              setSelectedOption(null);
              setIsCorrect(null);
          } else {
              finishGame();
          }
      }, 1500); 
  };

  const finishGame = async () => {
      // Use the current score state which is always up-to-date
      let calcScore = score;
      
      // Add pending answer score if user just answered but hasn't advanced yet
      if (selectedOption && isCorrect) {
          calcScore += 10;
      }
      
      await submitScore(id as string, calcScore, timeElapsed);
      await fetchLeaderboard(id as string);
      await checkParticipation(id as string);
      setGameState('leaderboard');
  };

  /* ------------------- RENDER HELPERS ------------------- */

  const progressAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
      const target = ((currentIndex + 1) / (currentQuestions.length || 1)) * 100;
      RNAnimated.timing(progressAnim, {
          toValue: target,
          duration: 500,
          useNativeDriver: false
      }).start();
  }, [currentIndex, currentQuestions.length]);

  if (loading || gameState === 'loading') {
      return (
          <View className="flex-1 bg-gray-900 justify-center items-center">
              <ActivityIndicator size="large" color="#FF6B58" />
              <Text className="text-white mt-4 font-rubik">Loading Quiz...</Text>
          </View>
      );
  }

  // --- START SCREEN ---
  if (gameState === 'start' && !userAttempt) {
      return (
          <View className="flex-1 bg-gray-900 justify-center items-center px-6">
               <View className="mb-8 items-center">
                    <Text className="text-4xl text-white font-rubik-bold mb-2">Ready?</Text>
                    <Text className="text-gray-400 font-rubik text-center">
                        You have {currentQuestions.length} questions. {'\n'}
                        Complete them as fast as possible!
                    </Text>
               </View>
               <TouchableOpacity 
                    onPress={handleStart}
                    className="bg-coral px-8 py-4 rounded-full w-full items-center shadow-lg shadow-coral/30"
                >
                    <Text className="text-white text-xl font-rubik-bold">Start Quiz</Text>
               </TouchableOpacity>
          </View>
      );
  }

  // --- LEADERBOARD / RESULTS SCREEN ---
  if (gameState === 'leaderboard') {
      const myRank = leaderboard.findIndex(l => l.user_id === user?.id) + 1;
      
      return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1">
                {/* Header with Review Button */}
                 <View className="px-6 py-4 flex-row justify-between items-center bg-gray-900">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white font-rubik-bold text-lg">Results</Text>
                    <TouchableOpacity onPress={() => setGameState('review')}>
                        <Text className="text-coral font-rubik-bold">Review</Text>
                    </TouchableOpacity>
                 </View>

                 {/* My Score Card */}
                 {userAttempt && (
                     <View className="bg-gray-900 pb-8 px-6 rounded-b-[30px] shadow-sm mb-6">
                        <View className="flex-row justify-center items-end mb-2">
                             <Text className="text-6xl text-white font-rubik-bold">{userAttempt.score}</Text>
                             <Text className="text-gray-400 text-xl font-rubik mb-2 ml-2">pts</Text>
                        </View>
                        <View className="flex-row justify-center space-x-6">
                             <View className="bg-white/10 px-4 py-2 rounded-xl items-center">
                                 <Text className="text-gray-400 text-xs uppercase">Time</Text>
                                 <Text className="text-white font-rubik-bold">{Math.floor(userAttempt.time_taken_seconds / 60)}m {userAttempt.time_taken_seconds % 60}s</Text>
                             </View>
                             <View className="bg-white/10 px-4 py-2 rounded-xl items-center">
                                 <Text className="text-gray-400 text-xs uppercase">Rank</Text>
                                 <Text className="text-white font-rubik-bold">#{myRank > 0 ? myRank : '-'}</Text>
                             </View>
                        </View>
                     </View>
                 )}

                 {/* Leaderboard */}
                 <View className="flex-1 px-6">
                     <Text className="text-lg font-rubik-bold text-gray-900 dark:text-white mb-4">Top 10 Leaderboard</Text>
                     <ScrollView showsVerticalScrollIndicator={false}>
                         {leaderboard.map((entry, index) => (
                             <View 
                                key={entry.user_id} 
                                className={`flex-row items-center p-4 rounded-xl mb-3 border ${entry.user_id === user?.id ? 'bg-coral/10 border-coral' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`} 
                             >
                                 <Text className={`font-rubik-bold text-lg w-8 ${index < 3 ? 'text-coral' : 'text-gray-500'}`}>#{index + 1}</Text>
                                 <Image 
                                    source={{ uri: entry.avatar_url || 'https://api.dicebear.com/9.x/micah/png' }}
                                    className="w-10 h-10 rounded-full bg-gray-200 mr-3"
                                 />
                                 <View className="flex-1">
                                     <Text className="font-rubik-medium text-gray-900 dark:text-white">{entry.name || 'User'}</Text>
                                     <Text className="text-xs text-gray-500">{Math.floor(entry.time_taken_seconds / 60)}m {entry.time_taken_seconds % 60}s</Text>
                                 </View>
                                 <View className="bg-teal/10 px-3 py-1 rounded-full">
                                     <Text className="text-teal font-rubik-bold">{entry.score}</Text>
                                 </View>
                             </View>
                         ))}
                     </ScrollView>
                 </View>
            </SafeAreaView>
        </View>
      );
  }

  // --- REVIEW MODE ---
  if (gameState === 'review') {
      return (
          <View className="flex-1 bg-gray-50 dark:bg-gray-900">
             <SafeAreaView className="flex-1">
                <View className="px-6 py-4 flex-row justify-between items-center bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <TouchableOpacity onPress={() => setGameState('leaderboard')}>
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="font-rubik-bold text-lg dark:text-white">Review Answers</Text>
                    <View className="w-6" />
                </View>

                <ScrollView className="p-6">
                    {currentQuestions.map((q, idx) => (
                        <View key={q.id} className="mb-6 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                             <Text className="text-gray-500 font-rubik-bold mb-2">Q{idx + 1}.</Text>
                             <Text className="text-gray-900 dark:text-white text-lg font-rubik mb-4">{q.question_text}</Text>
                             
                             <View className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl mb-2">
                                 <Text className="text-green-800 dark:text-green-400 font-rubik-medium">Correct: {q.correct_answer}</Text>
                             </View>

                             {q.explanation && (
                                 <View className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex-row gap-2 mt-2">
                                     <Ionicons name="information-circle" size={20} color="#3B82F6" />
                                     <Text className="text-blue-700 dark:text-blue-300 flex-1 text-sm font-rubik leading-5">{q.explanation}</Text>
                                 </View>
                             )}
                        </View>
                    ))}
                    <View className="h-10" />
                </ScrollView>
             </SafeAreaView>
          </View>
      );
  }

  // --- PLAYING SCREEN (Default Fallback) ---
  const currentQ = currentQuestions[currentIndex];
  if (!currentQ) return null;

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1">
        
        {/* Header: Progress & Timer */}
        <View className="px-6 py-4">
             <View className="flex-row justify-between items-end mb-4">
                 <Text className="text-gray-400 font-rubik">
                    Question <Text className="text-white font-rubik-bold">{currentIndex + 1}</Text>/{currentQuestions.length}
                 </Text>
                 
                 <View className="bg-white/10 px-3 py-1 rounded-full flex-row items-center border border-white/10">
                    <Ionicons name="timer-outline" size={16} color="white" />
                    <Text className={`text-white ml-2 font-mono font-bold ${maxTimeSeconds - timeElapsed < 60 ? 'text-red-500' : ''}`}>
                        {Math.floor((maxTimeSeconds - timeElapsed) / 60)}:{((maxTimeSeconds - timeElapsed) % 60).toString().padStart(2, '0')}
                    </Text>
                 </View>
             </View>

             {/* Progress Bar */}
             <View className="h-2 bg-gray-800 rounded-full overflow-hidden w-full">
                 <RNAnimated.View 
                    style={{ 
                        width: progressAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%']
                        }), 
                        height: '100%', 
                        backgroundColor: '#FF6B58' 
                    }} 
                 />
             </View>
        </View>

        {/* Question Area */}
        <View className="flex-1 px-6 justify-center">
             {currentQ.image_url ? (
                 <View className="mb-8 w-full">
                     <RNImage 
                        source={{ uri: currentQ.image_url }}
                        className="w-full h-56 rounded-2xl bg-gray-800 border border-white/20 mb-6"
                        resizeMode="contain"
                     />
                     <Text className="text-white text-2xl font-rubik-bold text-center leading-8 tracking-wide">
                         {currentIndex + 1}. {currentQ.question_text}
                     </Text>
                 </View>
             ) : (
                 <Text className="text-white text-2xl font-rubik-bold text-center mb-8 leading-8 tracking-wide">
                     {currentIndex + 1}. {currentQ.question_text}
                 </Text>
             )}

             <View className="gap-3">
                 {currentQ.options.map((option, idx) => {
                     const isSelected = selectedOption === option;
                     const showResult = isSelected && isCorrect !== null;
                     
                     let bgClass = "bg-white/10 border-white/10";
                     if (showResult) {
                         bgClass = isCorrect ? "bg-green-500 border-green-500" : "bg-red-500 border-red-500";
                     } else if (isSelected) {
                         bgClass = "bg-white/20 border-white/30";
                     }

                     return (
                         <View key={idx}>
                             <TouchableOpacity
                                onPress={() => handleAnswer(option)}
                                disabled={selectedOption !== null}
                                className={`py-4 px-6 rounded-2xl border ${bgClass} flex-row items-center justify-between active:bg-white/20 transition-all`}
                             >
                                 <Text className="text-white font-rubik-medium text-lg flex-1">{option}</Text>
                                 {showResult && (
                                     <Ionicons 
                                        name={isCorrect ? "checkmark-circle" : "close-circle"} 
                                        size={24} 
                                        color="white" 
                                     />
                                 )}
                             </TouchableOpacity>
                         </View>
                     );
                 })}
             </View>
        </View>

      </SafeAreaView>
      
      {/* Background Ambience */}
      <View className="absolute top-0 left-0 right-0 h-full -z-10 opacity-30">
          <LinearGradient
            colors={['#1F293700', '#111827']}
            style={{ flex: 1 }}
          />
      </View>

    </View>
  );
}
