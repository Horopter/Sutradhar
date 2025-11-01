<template>
  <div class="fixed bottom-6 right-6 z-50">
    <button
      @click="handleClick"
      :disabled="loading || speaking"
      :class="[
        'w-16 h-16 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center',
        listening ? 'bg-red-500 hover:bg-red-600 animate-pulse' :
        speaking ? 'bg-green-500 hover:bg-green-600 animate-pulse' : 
        loading ? 'bg-blue-500 hover:bg-blue-600 cursor-wait' :
        'bg-halloween-orange hover:bg-halloween-pumpkin hover:scale-110 shadow-halloween-orange/50',
        'focus:outline-none focus:ring-4 focus:ring-halloween-orange/50'
      ]"
      :title="listening ? `Listening... (${countdown}s)` : speaking ? 'Speaking...' : loading ? 'Processing...' : 'Ask a question (10s)'"
    >
      <!-- Microphone Icon -->
      <svg 
        v-if="!loading && !speaking && !listening" 
        class="w-8 h-8 text-white" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
      
      <!-- Listening Indicator (red pulse) -->
      <svg 
        v-if="listening" 
        class="w-8 h-8 text-white" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="8" />
      </svg>
      
      <!-- Loading Spinner -->
      <svg 
        v-if="loading" 
        class="w-8 h-8 text-white animate-spin" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      
      <!-- Speaking Indicator -->
      <svg 
        v-if="speaking" 
        class="w-8 h-8 text-white" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6.343 6.343L4.93 4.93A12 12 0 000 12a12 12 0 004.93 9.757l1.414-1.414A9.969 9.969 0 012 12c0-2.485.944-4.75 2.49-6.464z" />
      </svg>
    </button>
    
    <!-- User Question Bubble (shown while listening or until answer starts speaking) -->
    <div 
      v-if="userQuestion && (listening || (!answerTranscript && !speaking))"
      class="absolute bottom-24 right-0 bg-halloween-card border border-halloween-orange/50 text-halloween-ghost px-4 py-3 rounded-lg shadow-xl shadow-halloween-orange/30 max-w-md mb-2"
    >
      <div class="text-xs text-halloween-ghost/60 mb-1" v-if="listening">Listening... ({{ countdown }}s)</div>
      <div class="text-xs text-halloween-ghost/60 mb-1" v-else>Your question:</div>
      <div class="text-sm font-mono min-h-[2rem] text-halloween-ghost">
        {{ listening ? (liveTranscript || interimTranscript || '...') : userQuestion }}
      </div>
      <div v-if="interimTranscript && listening && interimTranscript !== liveTranscript" class="text-xs text-halloween-ghost/50 italic mt-1">
        {{ interimTranscript }}
      </div>
    </div>
    
    <!-- Answer Bubble (shown while speaking or until cleared) -->
    <div 
      v-if="answerTranscript && speaking"
      class="absolute bottom-24 right-0 bg-green-900/30 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg shadow-xl shadow-green-500/30 max-w-md mb-2"
    >
      <div class="text-xs text-green-300/60 mb-1">Answering:</div>
      <div class="text-sm font-mono min-h-[2rem] text-green-200">
        {{ answerTranscript }}
      </div>
    </div>
    
    <!-- Status Toast -->
    <div 
      v-if="statusMessage && !listening"
      class="absolute bottom-20 right-0 bg-halloween-card border border-halloween-orange/50 text-halloween-ghost px-4 py-2 rounded-lg shadow-lg shadow-halloween-orange/30 max-w-xs text-sm mb-2"
    >
      {{ statusMessage }}
    </div>
    
    <!-- Error Toast -->
    <div 
      v-if="error"
      class="absolute bottom-20 right-0 bg-red-900/80 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg shadow-lg max-w-xs text-sm mb-2"
    >
      {{ error }}
      <button @click="error = ''" class="ml-2 font-bold hover:text-red-100">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  lessonId: string
  courseSlug: string
  lessonUrl?: string
}>()

const { sessionId } = useAuth()
const api = useApi()
const loading = ref(false)
const speaking = ref(false)
const listening = ref(false)
const countdown = ref(10)
const error = ref('')
const statusMessage = ref('')
const liveTranscript = ref('')
const interimTranscript = ref('')
const userQuestion = ref('') // Store the user's question
const answerTranscript = ref('') // Store the answer being spoken
const synth = ref<SpeechSynthesis | null>(null)
const recognition = ref<SpeechRecognition | null>(null)
let countdownInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (typeof window !== 'undefined') {
    if ('speechSynthesis' in window) {
      synth.value = window.speechSynthesis
    }
    
    // Initialize Web Speech Recognition API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      recognition.value = new SpeechRecognition()
      recognition.value.continuous = true
      recognition.value.interimResults = true
      recognition.value.lang = 'en-US'
      
      recognition.value.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ''
        let final = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            final += transcript + ' '
          } else {
            interim += transcript
          }
        }
        
        if (final) {
          liveTranscript.value = (liveTranscript.value + final).trim()
        }
        interimTranscript.value = interim
      }
      
      recognition.value.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'no-speech') {
          // No speech detected, that's okay
          return
        }
        stopListening()
        error.value = `Speech recognition error: ${event.error}`
      }
      
      recognition.value.onend = () => {
        if (listening.value && countdown.value > 0) {
          // Restart if we're still supposed to be listening
          if (recognition.value) {
            try {
              recognition.value.start()
            } catch (e) {
              // Already started, ignore
            }
          }
        }
      }
    }
  }
})

const stopListening = () => {
  listening.value = false
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  if (recognition.value) {
    recognition.value.stop()
  }
  // Get final transcript and store as user question
  const finalText = (liveTranscript.value + ' ' + interimTranscript.value).trim()
  if (finalText) {
    userQuestion.value = finalText
  }
  liveTranscript.value = ''
  interimTranscript.value = ''
  return finalText
}

const startListening = () => {
  if (!recognition.value) {
    error.value = 'Speech recognition not supported in this browser'
    return
  }
  
  listening.value = true
  liveTranscript.value = ''
  interimTranscript.value = ''
  userQuestion.value = '' // Clear previous question
  answerTranscript.value = '' // Clear previous answer
  countdown.value = 10
  statusMessage.value = ''
  
  // Start countdown
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      const finalText = stopListening()
      statusMessage.value = 'Processing your question...'
      if (finalText) {
        handleTranscript(finalText)
      } else {
        error.value = 'No speech detected. Please try again.'
        statusMessage.value = ''
      }
    }
  }, 1000)
  
  try {
    recognition.value.start()
  } catch (e) {
    console.error('Failed to start recognition:', e)
    stopListening()
    error.value = 'Failed to start listening'
  }
}

const handleTranscript = async (transcript: string) => {
  if (!transcript || transcript.trim().length === 0) {
    error.value = 'No speech detected. Please try again.'
    statusMessage.value = ''
    return
  }
  
  loading.value = true
  
  try {
    // Get current page URL if not provided
    const currentUrl = props.lessonUrl || (typeof window !== 'undefined' ? window.location.href : '')
    
    // Process query - can be regular question or action request
    const response = await api.catalog.processLessonQuery(
      props.lessonId,
      props.courseSlug,
      transcript,
      sessionId.value || undefined,
      currentUrl
    )
    
    if (!response.ok) {
      throw new Error(response.error || 'Failed to process query')
    }
    
    loading.value = false
    
    // Determine the answer text to speak and display
    let answerText = ''
    if (response.action) {
      // Action was executed
      answerText = response.message || `${response.action} completed successfully`
    } else if (response.answer) {
      // Regular answer
      answerText = response.answer
    } else if (response.summary) {
      // Summary response
      answerText = response.summary
    }
    
    // Display answer in bubble and speak it
    if (answerText && synth.value) {
      answerTranscript.value = answerText
      speaking.value = true
      synth.value.cancel()
      
      const utterance = new SpeechSynthesisUtterance(answerText)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onend = () => {
        speaking.value = false
        // Clear both bubbles after answer is spoken
        setTimeout(() => {
          userQuestion.value = ''
          answerTranscript.value = ''
          statusMessage.value = ''
        }, 500) // Small delay for smooth transition
      }
      
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e)
        speaking.value = false
        error.value = 'Failed to play audio. Answer: ' + answerText
        // Clear bubbles on error too
        setTimeout(() => {
          userQuestion.value = ''
          answerTranscript.value = ''
        }, 2000)
      }
      
      synth.value.speak(utterance)
    } else if (answerText) {
      // No audio available, show in status message
      statusMessage.value = answerText
      answerTranscript.value = answerText
      setTimeout(() => {
        userQuestion.value = ''
        answerTranscript.value = ''
        statusMessage.value = ''
      }, 5000)
    }
  } catch (err: any) {
    loading.value = false
    error.value = err.message || 'Failed to process question'
    statusMessage.value = ''
  }
}

const handleClick = () => {
  if (loading.value || speaking.value) {
    // Stop if already processing
    if (synth.value) {
      synth.value.cancel()
      speaking.value = false
    }
    // Clear bubbles when stopped
    setTimeout(() => {
      userQuestion.value = ''
      answerTranscript.value = ''
      statusMessage.value = ''
    }, 500)
    return
  }
  
  if (listening.value) {
    // Stop listening early if clicked again
    const finalText = stopListening()
    statusMessage.value = ''
    if (finalText) {
      statusMessage.value = 'Processing your question...'
      handleTranscript(finalText)
    }
  } else {
    // Start listening
    error.value = ''
    statusMessage.value = ''
    answerTranscript.value = '' // Clear previous answer
    startListening()
  }
}

// Cleanup on unmount
onUnmounted(() => {
  stopListening()
  if (synth.value) {
    synth.value.cancel()
  }
})
</script>
