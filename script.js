// Inserta el año actual automáticamente
document.getElementById("year").textContent = new Date().getFullYear();

const SHEET_ID = '1u1sShoI0VTd6jZILC9HvQMDKnZRadwYFi8W9Br7Cp0k';

function fetchGSheet(sheet) {
  return fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheet}`)
    .then(r => r.text())
    .then(txt => {
      const json = JSON.parse(txt.substr(47).slice(0, -2));
      return json.table.rows.map(row => row.c.map(cell => cell ? cell.v : ''));
    });
}

// --- Top 5 Videos ---
let top5VideosData = [];
async function renderTop5Videos() {
  const videos = await fetchGSheet('VideosTop5');
  if (!videos.length) return;
  top5VideosData = videos;
  
  document.getElementById('top5Videos').innerHTML = videos.map((row, index) => `
    <div class="bg-gray-900 border border-cyan-400/30 hover:border-cyan-400/60 transition-all duration-200 rounded-xl p-4">
      <div class="flex items-center gap-4">
        <!-- Número y Imagen del video -->
        <div class="flex items-center gap-3 flex-shrink-0">
          <div class="bg-cyan-500 text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center">
            ${index + 1}
          </div>
          <div class="w-20 h-14 bg-gray-800 rounded-lg overflow-hidden">
            <img src="https://img.youtube.com/vi/${row[2]}/mqdefault.jpg" alt="${row[0]}" class="w-full h-full object-cover">
          </div>
        </div>
        
        <!-- Título y subtítulo -->
        <div class="flex-1 min-w-0">
          <h3 class="text-white font-bold text-sm truncate mb-1">${row[0]}</h3>
          <p class="text-cyan-400 text-xs truncate">${row[1]}</p>
        </div>
        
        <!-- Botón de reproducción -->
        <button onclick="openVideoModal(${index})" class="flex-shrink-0 w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-102">
          <svg class="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// Función para abrir modal de video
function openVideoModal(index) {
  const video = top5VideosData[index];
  document.getElementById('videoPlayer').innerHTML = `
    <iframe 
      src="https://www.youtube.com/embed/${video[2]}?autoplay=1" 
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen
      class="w-full h-full rounded-2xl"
    ></iframe>
  `;
  document.getElementById('videoModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// Función para cerrar modal de video
function closeVideoModal() {
  document.getElementById('videoModal').classList.remove('open');
  document.getElementById('videoPlayer').innerHTML = '';
  document.body.style.overflow = '';
}

// --- Slider ---
async function renderSlider() {
  const slides = await fetchGSheet('Slider');
  if (!slides.length) return;
  const sliderDiv = document.getElementById('sliderSlides');
  sliderDiv.innerHTML = slides.map((row,i) => `
    <div class="slide absolute inset-0 ${i==0?'active':'inactive'}" style="z-index:1;">
      <img src="${row[2]}" alt="${row[0]}" loading="lazy" class="w-full h-full object-cover" onerror="this.style.display='none';">
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 md:p-8 lg:p-12">
        <div class="max-w-2xl">
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-1" style="color: #c1ff00">${row[0]}</h1>
          <p class="text-lg sm:text-xl md:text-2xl text-white">${row[1]}</p>
        </div>
      </div>
      </div>
  `).join('');
  document.getElementById('sliderNav').innerHTML = `
    <button id="prevSlide" class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full z-10 hover:bg-black/70 transition-colors">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>
    <button id="nextSlide" class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full z-10 hover:bg-black/70 transition-colors">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  `;
  document.getElementById('sliderDots').innerHTML =
    slides.map((_,i)=>`<button class="slider-dot w-4 h-4 rounded-full bg-white/30 ${i==0?'active':''}" data-slide="${i}"></button>`).join('');
  let currentSlide = 0;
  const allSlides = sliderDiv.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slider-dot');
  function updateSlider() {
    allSlides.forEach((slide,idx) => slide.classList.toggle('active', idx===currentSlide));
    allSlides.forEach((slide,idx) => slide.classList.toggle('inactive', idx!==currentSlide));
    dots.forEach((dot,idx) => dot.classList.toggle('active', idx===currentSlide));
  }
  function nextSlide() { currentSlide = (currentSlide+1)%slides.length; updateSlider(); }
  function prevSlide() { currentSlide = (currentSlide-1+slides.length)%slides.length; updateSlider(); }
  document.getElementById('nextSlide').onclick = nextSlide;
  document.getElementById('prevSlide').onclick = prevSlide;
  dots.forEach((dot, idx) => dot.onclick = ()=>{currentSlide=idx;updateSlider();});
  let autoPlay = setInterval(nextSlide, 5000);
  sliderDiv.onmouseenter = ()=>clearInterval(autoPlay);
  sliderDiv.onmouseleave = ()=>autoPlay=setInterval(nextSlide, 5000);
}

// --- DJs ---
async function renderDJs() {
  const djs = await fetchGSheet('DJs');
  if (!djs.length) return;
  document.getElementById('djsGrid').innerHTML = djs.map(row => `
    <div class="group relative bg-gray-900 border border-cyan-400/30 hover:border-cyan-400/60 transition-all duration-200 rounded-xl p-3 dj-card">
      <div class="absolute inset-0 bg-cyan-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      <div class="relative z-10">
        <div class="w-full h-44 mx-auto mb-3 rounded-lg overflow-hidden border-2 border-cyan-400/50 relative">
          <img src="${row[2]}" alt="${row[0]}" loading="lazy" class="w-full h-full object-cover hover:scale-105 transition-transform duration-200">
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
            <h3 class="text-base font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">${row[0]}</h3>
            <p class="text-cyan-400 font-medium text-xs">${row[1]}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-1.5 mb-2">
          <div class="bg-black/30 rounded-md p-1.5 text-center border border-cyan-400/20">
            <div class="text-cyan-400 font-bold text-xs">${row[3]}</div>
          </div>
          <div class="bg-black/30 rounded-md p-1.5 text-center border border-cyan-400/20">
            <a href="${row[4]}" target="_blank" rel="noopener" class="text-red-500 font-bold text-xs underline hover:text-red-400 flex items-center justify-center gap-1">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
              YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// --- Gallery + Modal con navegación ---
let galleryModalData = [];
let currentModalIndex = 0;
async function renderGallery() {
  const gallery = await fetchGSheet('Galería');
  if (!gallery.length) return;
  galleryModalData = gallery;
  document.getElementById('galleryGrid').innerHTML = gallery.map((row, idx) => `
    <div class="gallery-item aspect-square rounded-2xl overflow-hidden relative group cursor-pointer" data-index="${idx}">
      <img src="${row[2]}" alt="${row[0]}" loading="lazy" class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105">
      <div class="absolute bottom-0 left-0 right-0 p-4">
        <h4 class="text-white font-bold">${row[0]}</h4>
      </div>
      <div class="absolute inset-0 flex items-center justify-center bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div class="bg-white/20 backdrop-blur-sm w-16 h-16 flex items-center justify-center border-radius:50%">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.onclick = () => openModal(+item.dataset.index);
  });
}

// --- Modal logic con navegación ---
function updateModalContent() {
  const row = galleryModalData[currentModalIndex];
  document.getElementById('modalImg').src = row[2];
  document.getElementById('modalTitle').textContent = row[0];
  document.getElementById('modalSubtitle').textContent = row[1];
  document.getElementById('modalDesc').textContent = row[3]||'';
  document.getElementById('modalCounter').textContent = `${currentModalIndex+1} / ${galleryModalData.length}`;
}
function openModal(idx) {
  currentModalIndex = idx;
  updateModalContent();
  document.getElementById('imageModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('imageModal').classList.remove('open');
  document.body.style.overflow = '';
}
function prevModal() {
  currentModalIndex = (currentModalIndex-1+galleryModalData.length)%galleryModalData.length;
  updateModalContent();
}
function nextModal() {
  currentModalIndex = (currentModalIndex+1)%galleryModalData.length;
  updateModalContent();
}
document.getElementById('closeModal').onclick = closeModal;
document.getElementById('prevModal').onclick = prevModal;
document.getElementById('nextModal').onclick = nextModal;
document.getElementById('imageModal').onclick = e => {
  if (e.target === document.getElementById('imageModal')) closeModal();
};
document.addEventListener('keydown', e => {
  if (document.getElementById('imageModal').classList.contains('open')) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') prevModal();
    if (e.key === 'ArrowRight') nextModal();
  }
});


// Smooth scroll for menu
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        window.scrollTo({top: target.offsetTop - 80, behavior:'smooth'});
      }
    });
  });
  // Mobile menu logic
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeMobileMenuBtn = document.getElementById('closeMobileMenu');
  const mobileMenu = document.getElementById('mobileMenu');
  function openMobileMenu() {
    mobileMenu.classList.remove('closed');
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    mobileMenu.classList.add('closed');
    document.body.style.overflow = '';
  }
  mobileMenuBtn.addEventListener('click', openMobileMenu);
  closeMobileMenuBtn.addEventListener('click', closeMobileMenu);
  mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMobileMenu();
  });
});

// Event listeners para modal de video
document.getElementById('closeVideoModal').onclick = closeVideoModal;
document.getElementById('videoModal').onclick = e => {
  if (e.target === document.getElementById('videoModal')) closeVideoModal();
};
document.addEventListener('keydown', e => {
  if (document.getElementById('videoModal').classList.contains('open')) {
    if (e.key === 'Escape') closeVideoModal();
  }
});

// --- Iniciar todo ---
window.addEventListener('DOMContentLoaded',()=>{
  renderSlider();
  renderTop5Videos();
  renderDJs();
  renderGallery();
});

// Radio Player Functionality
class RadioPlayer {
    constructor() {
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = 70;
        this.currentTime = 0;
        this.progressInterval = null;
        this.audio = null;
        this.streamUrl = 'https://stream.zeno.fm/cxf1r8zukyhuv';
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.playIcon = document.getElementById('playIcon');
        this.pauseIcon = document.getElementById('pauseIcon');
        this.loadingIcon = document.getElementById('loadingIcon');
        this.muteBtn = document.getElementById('muteBtn');
        this.volumeIcon = document.getElementById('volumeIcon');
        this.muteIcon = document.getElementById('muteIcon');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');

        this.currentTrack = document.getElementById('currentTrack');
        this.currentArtist = document.getElementById('currentArtist');
    }

    bindEvents() {
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
    }

    initializeAudio() {
        // Always create a fresh audio instance to avoid buffering
        this.audio = new Audio();
        this.audio.src = this.streamUrl + '?t=' + Date.now(); // Add timestamp to prevent caching
        this.audio.volume = this.volume / 100;
        this.audio.preload = 'none';
        
        this.audio.addEventListener('loadstart', () => {
            this.showLoadingState();
        });
        
        this.audio.addEventListener('canplay', () => {
            this.hideLoadingState();
        });
        
        this.audio.addEventListener('error', (e) => {
            this.isPlaying = false;
            this.hideLoadingState();
            this.updatePlayButton();
        });
        
        this.audio.addEventListener('waiting', () => {
            this.showLoadingState();
        });
        
        this.audio.addEventListener('playing', () => {
            this.hideLoadingState();
        });
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        
        if (this.isPlaying) {
            // Always create fresh audio instance when playing
            this.initializeAudio();
            this.audio.play().catch(e => {
                console.error('Error playing audio:', e);
                this.isPlaying = false;
                this.updatePlayButton();
            });
        } else {
            // Stop and destroy audio instance when pausing
            if (this.audio) {
                this.audio.pause();
                this.audio.src = '';
                this.audio = null;
            }
        }
        
        this.updatePlayButton();
    }

    // Auto-start the radio when page loads
    autoStart() {
        setTimeout(() => {
            this.togglePlayPause();
        }, 1000);
    }

    showLoadingState() {
        // No loading animation
    }

    hideLoadingState() {
        // No loading animation
    }

    updatePlayButton() {
        if (this.isPlaying) {
            this.playIcon.classList.add('hidden');
            this.pauseIcon.classList.remove('hidden');
            this.playPauseBtn.classList.add('pulse-animation');
        } else {
            this.playIcon.classList.remove('hidden');
            this.pauseIcon.classList.add('hidden');
            this.playPauseBtn.classList.remove('pulse-animation');
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.audio) {
            this.audio.muted = this.isMuted;
        }
        
        if (this.isMuted) {
            this.volumeIcon.classList.add('hidden');
            this.muteIcon.classList.remove('hidden');
            this.volumeSlider.style.opacity = '0.5';
        } else {
            this.volumeIcon.classList.remove('hidden');
            this.muteIcon.classList.add('hidden');
            this.volumeSlider.style.opacity = '1';
        }
        
        // Volume toggled
    }

    setVolume(value) {
        this.volume = value;
        this.volumeValue.textContent = `${value}%`;
        
        if (this.audio) {
            this.audio.volume = value / 100;
        }
        
        // Update slider background
        const percentage = (value / 100) * 100;
        this.volumeSlider.style.background = 
            `linear-gradient(to right, #00ffff 0%, #00ffff ${percentage}%, #374151 ${percentage}%, #374151 100%)`;
        
        // Auto-unmute if volume is increased
        if (value > 0 && this.isMuted) {
            this.toggleMute();
        }
    }

    updateTrackInfo(title, artist) {
        this.currentTrack.textContent = title;
        this.currentArtist.textContent = artist;
        
        // Reset progress for new track
        this.currentTime = 0;
        this.progressBar.style.width = '0%';
    }
}

// Initialize Radio Player
const radioPlayer = new RadioPlayer();

// Auto-start radio after page loads
radioPlayer.autoStart();
