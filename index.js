// --- WanderAI Travel Guide Engine ---

// Voice mappings for Murf Falcon API
const VOICES = {
  English: { Male: "Matthew", Female: "Alicia", code: "en-US" },
  Hindi: { Male: "Aman", Female: "Namrita", code: "hi-IN" },
  Tamil: { Male: "Murali", Female: "Iniya", code: "ta-IN" },
  Telugu: { Male: "Zion", Female: "Josie", code: "te-IN" }
};

const LOCALES = {
  English: "en-US",
  Hindi: "hi-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN"
};

// Fallback high-res imagery for custom global searches
const FALLBACK_SEARCH_IMAGES = {
  "eiffel tower": "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1000&q=80",
  "colosseum": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1000&q=80",
  "kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=80",
  "pyramids": "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1000&q=80",
  "machu picchu": "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1000&q=80",
  "varanasi": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1000&q=80",
  "grand canyon": "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=1000&q=80",
  "default": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80"
};

// --- State ---
const state = {
  place: '',
  image: '',
  city: '',
  length: 'Summary',
  voice: 'Male',
  language: 'English',
  activeFilter: 'all',
  playbackRate: 1.0,
  audioBlobUrl: null
};

// --- DOM Elements ---
const cardsContainer = document.querySelector('.cards');
const heroSection = document.getElementById('heroSection');
const experiencePanel = document.getElementById('experience');
const previewTitle = document.getElementById('previewTitle');
const guideTagline = document.getElementById('guideTagline');
const audioSection = document.getElementById('audioSection');
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const audioTimer = document.getElementById('audioTimer');
const progressBar = document.getElementById('progressBar');
const progressBarContainer = document.getElementById('progressBarContainer');
const visualizer = document.getElementById('visualizer');
const speedBtn = document.getElementById('speedBtn');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const downloadAudioBtn = document.getElementById('downloadAudioBtn');

const transcriptText = document.getElementById('scriptText');
const generateButton = document.getElementById('generateBtn');
const generatingStatus = document.getElementById('generatingStatus');
const languageSelect = document.getElementById('selectLanguage');
const closeButton = document.getElementById('closeExperience');
const mapsDirectBtn = document.getElementById('mapsDirectBtn');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchPreviewCard = document.getElementById('searchPreviewCard');
const searchPreviewImage = document.getElementById('searchPreviewImage');
const searchPreviewTitle = document.getElementById('searchPreviewTitle');
const searchPreviewCity = document.getElementById('searchPreviewCity');
const searchPreviewDesc = document.getElementById('searchPreviewDesc');
const searchMapsLink = document.getElementById('searchMapsLink');

const destinationInsights = document.getElementById('destinationInsights');
const bestTimeVal = document.getElementById('bestTimeVal');
const insiderTipVal = document.getElementById('insiderTipVal');
const highlightsContainer = document.getElementById('highlightsContainer');
const highlightsList = document.getElementById('highlightsList');

const transcriptToggle = document.getElementById('transcriptToggle');
const transcriptContent = document.getElementById('transcriptContent');
const transcriptArrow = document.getElementById('transcriptArrow');
const copyTranscriptBtn = document.getElementById('copyTranscriptBtn');

const guideQuestionInput = document.getElementById('guideQuestionInput');
const askGuideBtn = document.getElementById('askGuideBtn');
const guideAnswerBox = document.getElementById('guideAnswerBox');
const guideAnswerText = document.getElementById('guideAnswerText');

const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://127.0.0.1:5000"
  : "https://ai-tarvel-guide.onrender.com";

// --- Toast Helper ---
function showToast(msg, icon = "✨") {
  toastMessage.textContent = msg;
  toastIcon.textContent = icon;
  toastNotification.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toastNotification.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 3200);
}

// --- Destination Selection ---
function selectDestination(place, image, city = '', clickedCard = null) {
  state.place = place;
  state.image = image;
  state.city = city || place;

  // Stop any active audio
  stopAudioPlayback();

  // Update header and links
  previewTitle.textContent = place;
  guideTagline.textContent = '';
  guideTagline.classList.add('hidden');
  
  if (mapsDirectBtn) {
    mapsDirectBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
  }

  // Smooth layout transition to focused view
  cardsContainer.classList.add('faded');
  heroSection.classList.add('opacity-40', 'scale-95');

  // Clear previous active states
  document.querySelectorAll('.place-card').forEach(card => card.classList.remove('active'));

  if (clickedCard) {
    clickedCard.classList.add('active');
    searchPreviewCard.classList.add('hidden');
  } else {
    // Custom search destination
    searchPreviewImage.src = image;
    searchPreviewTitle.textContent = place;
    searchPreviewCity.textContent = city || "Featured Landmark";
    searchPreviewDesc.textContent = `Explore ${place} with your AI voice guide.`;
    if (searchMapsLink) {
      searchMapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
    }
    searchPreviewCard.classList.remove('hidden');
    searchPreviewCard.classList.add('active');
  }

  // Reset audio & insights state
  audioSection.classList.add('hidden');
  destinationInsights.classList.add('hidden');
  highlightsContainer.classList.add('hidden');
  guideAnswerBox.classList.add('hidden');
  guideQuestionInput.value = '';
  transcriptText.textContent = '';

  generateButton.disabled = false;
  generateButton.innerHTML = `
    <svg class="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path>
    </svg>
    <span>Generate AI Audio Guide</span>
  `;

  // Show studio panel with smooth slide-up
  experiencePanel.classList.remove('hidden');
  setTimeout(() => {
    experiencePanel.classList.add('visible');
    experiencePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 30);
}

function deselectDestination() {
  stopAudioPlayback();
  experiencePanel.classList.remove('visible');

  setTimeout(() => {
    experiencePanel.classList.add('hidden');
    cardsContainer.classList.remove('faded');
    heroSection.classList.remove('opacity-40', 'scale-95');
    searchPreviewCard.classList.add('hidden');
    document.querySelectorAll('.place-card').forEach(card => {
      card.classList.remove('active');
      card.style.display = '';
    });
    applyCategoryFilter(state.activeFilter);
  }, 300);
}

// --- Audio Player Controller ---
function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function stopAudioPlayback() {
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }
  window.speechSynthesis.cancel();
  visualizer.classList.remove('visualizer-playing');
  playIcon.classList.remove('hidden');
  pauseIcon.classList.add('hidden');
  progressBar.style.width = '0%';
}

function toggleAudio() {
  if (audioPlayer.paused) {
    audioPlayer.play().then(() => {
      visualizer.classList.add('visualizer-playing');
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    }).catch(err => {
      console.warn("Audio playback issue:", err);
      speakFallback(transcriptText.textContent);
    });
  } else {
    audioPlayer.pause();
    visualizer.classList.remove('visualizer-playing');
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
  }
}

// Fallback TTS using browser speech synthesis
function speakFallback(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  const langConfig = VOICES[state.language] || VOICES.English;
  utterance.lang = langConfig.code;
  utterance.rate = state.playbackRate;
  
  utterance.onstart = () => {
    visualizer.classList.add('visualizer-playing');
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
  };
  utterance.onend = () => {
    visualizer.classList.remove('visualizer-playing');
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    progressBar.style.width = '100%';
  };

  window.speechSynthesis.speak(utterance);
}

// Audio Player Events
playBtn.addEventListener('click', toggleAudio);

audioPlayer.addEventListener('timeupdate', () => {
  const current = audioPlayer.currentTime;
  const duration = audioPlayer.duration || 1;
  const pct = (current / duration) * 100;
  progressBar.style.width = `${pct}%`;
  audioTimer.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
});

audioPlayer.addEventListener('ended', () => {
  visualizer.classList.remove('visualizer-playing');
  playIcon.classList.remove('hidden');
  pauseIcon.classList.add('hidden');
  progressBar.style.width = '100%';
});

// Click on progress bar to seek
progressBarContainer.addEventListener('click', (e) => {
  if (!audioPlayer.duration) return;
  const rect = progressBarContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const pct = clickX / rect.width;
  audioPlayer.currentTime = pct * audioPlayer.duration;
});

// Speed Toggle
const SPEEDS = [1.0, 1.25, 1.5];
speedBtn.addEventListener('click', () => {
  let idx = SPEEDS.indexOf(state.playbackRate);
  idx = (idx + 1) % SPEEDS.length;
  state.playbackRate = SPEEDS[idx];
  audioPlayer.playbackRate = state.playbackRate;
  speedBtn.textContent = `${state.playbackRate}x`;
  showToast(`Speed set to ${state.playbackRate}x`, "⚡");
});

// Rewind / Forward 10s
rewindBtn.addEventListener('click', () => {
  audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10);
});
forwardBtn.addEventListener('click', () => {
  audioPlayer.currentTime = Math.min(audioPlayer.duration || 999, audioPlayer.currentTime + 10);
});

// Copy Transcript
copyTranscriptBtn.addEventListener('click', () => {
  if (transcriptText.textContent) {
    navigator.clipboard.writeText(transcriptText.textContent).then(() => {
      showToast("Transcript copied to clipboard!", "📋");
    });
  }
});

// --- Search Functionality ---
function getDestinationImage(query) {
  const clean = query.toLowerCase().trim();
  for (const [key, url] of Object.entries(FALLBACK_SEARCH_IMAGES)) {
    if (clean.includes(key)) return url;
  }
  return FALLBACK_SEARCH_IMAGES.default;
}

function handleSearch() {
  const query = searchInput.value.trim();
  
  if (!query) {
    // If empty, surprise the user with a featured destination!
    const cards = Array.from(document.querySelectorAll('.place-card:not(.search-preview-card)'));
    if (cards.length > 0) {
      const randomCard = cards[Math.floor(Math.random() * cards.length)];
      searchInput.value = randomCard.dataset.place;
      clearSearchBtn.classList.remove('hidden');
      selectDestination(randomCard.dataset.place, randomCard.dataset.image, randomCard.dataset.city, randomCard);
      showToast(`Surprise Destination: ${randomCard.dataset.place}!`, "🎲");
      return;
    }
    showToast("Type a destination (e.g. Kyoto, Taj Mahal, Rome) to explore!", "💡");
    searchInput.focus();
    return;
  }

  const lowerQuery = query.toLowerCase();
  const cards = Array.from(document.querySelectorAll('.place-card:not(.search-preview-card)'));
  
  // Check if an existing place matches
  const match = cards.find(card => card.dataset.place.toLowerCase().includes(lowerQuery) || (card.dataset.city && card.dataset.city.toLowerCase().includes(lowerQuery)));

  if (match) {
    selectDestination(match.dataset.place, match.dataset.image, match.dataset.city, match);
    showToast(`Found ${match.dataset.place}`, "📍");
  } else {
    // Global destination search: dynamically generate card preview
    const customImage = getDestinationImage(query);
    selectDestination(query, customImage, `${query}`, null);
    showToast(`Exploring "${query}" with AI`, "🌍");
  }
}

searchInput.addEventListener('input', () => {
  const val = searchInput.value.trim();
  if (val.length > 0) {
    clearSearchBtn.classList.remove('hidden');
    // Live filter existing cards if not in focused mode
    if (!cardsContainer.classList.contains('faded')) {
      const lower = val.toLowerCase();
      document.querySelectorAll('.place-card:not(.search-preview-card)').forEach(card => {
        const title = card.dataset.place.toLowerCase();
        const city = (card.dataset.city || '').toLowerCase();
        if (title.includes(lower) || city.includes(lower)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    }
  } else {
    clearSearchBtn.classList.add('hidden');
    if (!cardsContainer.classList.contains('faded')) {
      applyCategoryFilter(state.activeFilter);
    }
  }
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});
searchBtn.addEventListener('click', handleSearch);

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  if (!cardsContainer.classList.contains('faded')) {
    applyCategoryFilter(state.activeFilter);
  }
  searchInput.focus();
});

// Quick suggestion chips
document.querySelectorAll('.quick-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    searchInput.value = chip.textContent.trim();
    clearSearchBtn.classList.remove('hidden');
    handleSearch();
  });
});

// --- Category Filters ---
function applyCategoryFilter(cat) {
  state.activeFilter = cat;
  document.querySelectorAll('.liquid-pill, .filter-pill').forEach(btn => {
    if (btn.dataset.filter === cat) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.place-card:not(.search-preview-card)').forEach(card => {
    if (cat === 'all' || card.dataset.category === cat) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

document.querySelectorAll('.liquid-pill, .filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    applyCategoryFilter(btn.dataset.filter);
  });
});

// Close button
closeButton.addEventListener('click', deselectDestination);

// Brand logo resets to home
document.getElementById('brandLogo').addEventListener('click', (e) => {
  e.preventDefault();
  deselectDestination();
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  applyCategoryFilter('all');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Card click handlers
document.querySelectorAll('.place-card:not(.search-preview-card)').forEach(card => {
  card.addEventListener('click', () => {
    selectDestination(card.dataset.place, card.dataset.image, card.dataset.city, card);
  });
});

// Length / Detail option toggle
document.querySelectorAll('[data-group="length"] button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-group="length"] button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.length = btn.dataset.value;
  });
});

// Voice gender toggle
document.querySelectorAll('[data-group="voice"] button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-group="voice"] button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.voice = btn.dataset.value;
  });
});

// Language selection change
languageSelect.addEventListener('change', () => {
  state.language = languageSelect.value;
});

// --- AI Guide Generation Core ---
generateButton.addEventListener('click', async () => {
  if (!state.place) return;

  generateButton.disabled = true;
  generateButton.innerHTML = `
    <span class="inline-block animate-spin mr-2">⏳</span>
    <span>Crafting AI Voice Guide...</span>
  `;
  generatingStatus.classList.remove('hidden');

  try {
    const selectedLanguage = languageSelect.value;
    const selectedVoice = state.voice;
    const voiceConfig = VOICES[selectedLanguage] || VOICES.English;
    const voiceId = voiceConfig[selectedVoice] || "Matthew";
    const locale = LOCALES[selectedLanguage] || "en-US";

    const response = await fetch(`${API_BASE}/generate-audio-guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place: state.place,
        answerType: state.length,
        language: selectedLanguage,
        voiceId: voiceId,
        locale: locale
      })
    });

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    generatingStatus.classList.add('hidden');

    // Update Story Transcript
    transcriptText.textContent = data.description || "Guide generated.";
    
    // Update Tagline
    if (data.tagline) {
      guideTagline.textContent = `"${data.tagline}"`;
      guideTagline.classList.remove('hidden');
    }

    // Update Insights & Highlights
    if (data.bestTime || data.insiderTip) {
      bestTimeVal.textContent = data.bestTime || "Morning to afternoon";
      insiderTipVal.textContent = data.insiderTip || "Arrive early for scenic views.";
      destinationInsights.classList.remove('hidden');
    }

    if (data.highlights && data.highlights.length > 0) {
      highlightsList.innerHTML = data.highlights.map(h => `
        <span class="px-3 py-1 rounded-full bg-white/[0.08] text-slate-200 text-xs font-medium border border-white/15 backdrop-blur-md shadow-xs">
          ✓ ${h}
        </span>
      `).join('');
      highlightsContainer.classList.remove('hidden');
    }

    // Audio handling: Murf studio stream or fallback
    audioSection.classList.remove('hidden');
    
    if (data.audioBase64) {
      const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
      audioPlayer.src = audioSrc;
      audioPlayer.load();
      downloadAudioBtn.href = audioSrc;
      downloadAudioBtn.download = `${state.place.toLowerCase().replace(/\s+/g, '-')}-audio-guide.mp3`;
      downloadAudioBtn.classList.remove('hidden');
      document.getElementById('voiceBadge').textContent = 'Studio Murf AI';

      // Auto play
      audioPlayer.play().then(() => {
        visualizer.classList.add('visualizer-playing');
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
      }).catch(() => {
        // Autoplay may need user gesture
      });

      showToast("Narration ready! Playing audio...", "🎙️");
    } else {
      // Browser Speech Synthesis Fallback
      document.getElementById('voiceBadge').textContent = 'Voice Synthesis';
      downloadAudioBtn.classList.add('hidden');
      speakFallback(data.description);
      showToast("Generated with speech engine!", "🔊");
    }

    generateButton.innerHTML = `
      <svg class="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      <span>Regenerate Guide</span>
    `;
    generateButton.disabled = false;

  } catch (err) {
    console.error("Audio guide error:", err);
    generatingStatus.classList.add('hidden');
    generateButton.disabled = false;
    generateButton.textContent = 'Retry Audio Guide';
    showToast("Server connection error. Please ensure backend is running.", "⚠️");
  }
});

// Transcript accordion toggle
transcriptToggle.addEventListener('click', () => {
  transcriptContent.classList.toggle('hidden');
  transcriptArrow.classList.toggle('rotate-180');
});

// --- Ask the AI Guide Q&A ---
async function askGuideQuestion(questionText) {
  const query = questionText || guideQuestionInput.value.trim();
  if (!query || !state.place) return;

  guideAnswerBox.classList.remove('hidden');
  guideAnswerText.textContent = "Thinking...";
  askGuideBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/ask-guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place: state.place,
        question: query,
        language: languageSelect.value
      })
    });

    const data = await res.json();
    if (data.answer) {
      guideAnswerText.textContent = data.answer;
    } else {
      guideAnswerText.textContent = "I don't have that detail right now, but feel free to ask another question!";
    }
  } catch (err) {
    console.warn("Ask guide error:", err);
    guideAnswerText.textContent = "Could not contact your AI guide at this moment. Please check backend connection.";
  } finally {
    askGuideBtn.disabled = false;
  }
}

askGuideBtn.addEventListener('click', () => askGuideQuestion());
guideQuestionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') askGuideQuestion();
});

// Quick QA chip clicks
document.querySelectorAll('.qa-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    guideQuestionInput.value = chip.textContent.replace(/^[^\w\s]+/, '').trim();
    askGuideQuestion(guideQuestionInput.value);
  });
});
