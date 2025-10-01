// ========================================
// CONFIGURACIÓN DE GOOGLE SHEETS
// ========================================

// IMPORTANTE: Reemplaza 'TU_SHEET_ID_AQUI' con el ID real de tu Google Sheet
const SHEET_ID = '1yuB2GkW9399OAyjpxDBCUQM2YmNzDHRMDSIw4XfV4hQ';

// URLs de las pestañas de Google Sheets (formato CSV público)
const SHEET_URLS = {
    slider: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Slider`,
    djs: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=DJs`,
    galeria: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Galeria`,
    videos: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Videos`
};

// ========================================
// VARIABLES GLOBALES
// ========================================

let sheetsData = {};
let currentSlideIndex = 1;
let slideInterval = null;
let isPlaying = false;
let currentVolume = 70;
let radioAudio = null;

// ========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ========================================

async function initApp() {
    console.log('🚀 Iniciando Urban Radio...');
    
    try {
        await loadAllSheetsData();
        renderAllContent();
        initRadioPlayer();
        console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error inicializando la aplicación:', error);
        loadDefaultContent();
    }
}

// ========================================
// CARGA DE DATOS DESDE GOOGLE SHEETS
// ========================================

async function loadAllSheetsData() {
    console.log('📊 Cargando datos desde Google Sheets...');
    
    const promises = Object.entries(SHEET_URLS).map(async ([key, url]) => {
        try {
            console.log(`📥 Cargando ${key}...`);
            const data = await fetchSheetData(url);
            sheetsData[key] = data;
            console.log(`✅ ${key} cargado:`, data.length, 'elementos');
        } catch (error) {
            console.warn(`⚠️ Error cargando ${key}:`, error);
            sheetsData[key] = [];
        }
    });
    
    await Promise.all(promises);
    console.log('📊 Datos cargados:', sheetsData);
}

async function fetchSheetData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    return parseCSV(csvText);
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            // Parseo simple de CSV (maneja comillas básicas)
            const row = line.split(',').map(cell => 
                cell.replace(/^"|"$/g, '').replace(/""/g, '"')
            );
            result.push(row);
        }
    }
    
    return result;
}

// ========================================
// RENDERIZADO DE CONTENIDO
// ========================================

function renderAllContent() {
    console.log('🎨 Renderizando contenido...');
    renderSlider();
    renderDJs();
    renderGallery();
    renderVideos();
}

// ========================================
// SLIDER
// ========================================

function renderSlider() {
    const slides = sheetsData.slider || [];
    const slidesContainer = document.getElementById('slidesWrapper');
    const navContainer = document.getElementById('sliderNav');
    
    console.log('🖼️ Renderizando slider:', slides.length, 'slides');
    
    if (slides.length <= 1) {
        slidesContainer.innerHTML = '<div class="loading">No hay slides configurados</div>';
        return;
    }

    // Filtrar slides activos (omitir header)
    const activeSlides = slides.slice(1).filter(slide => 
        slide.length >= 5 && slide[4] && slide[4].toLowerCase() === 'activo'
    );

    if (activeSlides.length === 0) {
        slidesContainer.innerHTML = '<div class="loading">No hay slides activos</div>';
        return;
    }

    // Generar HTML de slides
    const slidesHTML = activeSlides.map((slide, index) => {
        const [titulo, descripcion, imagen, enlace, estado] = slide;
        
        return `
            <div class="hero-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${imagen || ''}')">
                <div class="slide-overlay"></div>
                <div class="slide-content">
                    <h2 class="slide-title">${titulo || 'Título del Slide'}</h2>
                    <p class="slide-description">${descripcion || 'Descripción del slide'}</p>
                    ${enlace ? `<a href="${enlace}" class="slide-btn" target="_blank" rel="noopener noreferrer">Ver Más</a>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Generar puntos de navegación
    const dotsHTML = activeSlides.map((_, index) => 
        `<div class="slider-dot ${index === 0 ? 'active' : ''}" onclick="currentSlide(${index + 1})"></div>`
    ).join('');

    slidesContainer.innerHTML = slidesHTML;
    navContainer.innerHTML = dotsHTML;

    // Inicializar slider si hay slides
    if (activeSlides.length > 1) {
        initSlider();
    }
}

function initSlider() {
    // Limpiar intervalo anterior
    if (slideInterval) {
        clearInterval(slideInterval);
    }
    
    // Iniciar auto-avance cada 5 segundos
    slideInterval = setInterval(nextSlide, 5000);
}

function showSlide(n) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.slider-dot');
    
    if (slides.length === 0) return;
    
    if (n > slides.length) currentSlideIndex = 1;
    if (n < 1) currentSlideIndex = slides.length;
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    if (slides[currentSlideIndex - 1]) {
        slides[currentSlideIndex - 1].classList.add('active');
    }
    if (dots[currentSlideIndex - 1]) {
        dots[currentSlideIndex - 1].classList.add('active');
    }
}

function currentSlide(n) {
    currentSlideIndex = n;
    showSlide(currentSlideIndex);
    
    // Reiniciar auto-avance
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    }
}

function nextSlide() {
    currentSlideIndex++;
    showSlide(currentSlideIndex);
}

function prevSlide() {
    currentSlideIndex--;
    showSlide(currentSlideIndex);
    
    // Reiniciar auto-avance
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    }
}

// ========================================
// DJS
// ========================================

function renderDJs() {
    const djs = sheetsData.djs || [];
    const container = document.getElementById('djsContainer');
    
    console.log('🎧 Renderizando DJs:', djs.length, 'DJs');
    
    if (djs.length <= 1) {
        container.innerHTML = '<div class="loading">No hay DJs configurados</div>';
        return;
    }

    // Filtrar DJs activos (omitir header)
    const activeDJs = djs.slice(1).filter(dj => 
        dj.length >= 6 && dj[5] && dj[5].toLowerCase() === 'activo'
    );

    if (activeDJs.length === 0) {
        container.innerHTML = '<div class="loading">No hay DJs activos</div>';
        return;
    }

    const djsHTML = activeDJs.map(dj => {
        const [nombre, especialidad, descripcion, imagen, enlace, estado] = dj;
        
        return `
            <div class="dj-card">
                <div class="dj-image" style="background-image: url('${imagen || ''}')">
                    <div class="dj-overlay"></div>
                </div>
                <div class="dj-info">
                    <h3>${nombre || 'DJ Sin Nombre'}</h3>
                    <p class="dj-specialty">${especialidad || 'Especialidad'}</p>
                    <p class="dj-description">${descripcion || ''}</p>
                    ${enlace ? `
                        <a href="${enlace}" class="dj-link" target="_blank" rel="noopener noreferrer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                            </svg>
                            Ver Perfil
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = djsHTML;
}

// ========================================
// GALERÍA
// ========================================

function renderGallery() {
    const gallery = sheetsData.galeria || [];
    const container = document.getElementById('galleryContainer');
    
    console.log('🖼️ Renderizando galería:', gallery.length, 'imágenes');
    
    if (gallery.length <= 1) {
        container.innerHTML = '<div class="loading">No hay imágenes configuradas</div>';
        return;
    }

    // Filtrar imágenes activas (omitir header)
    const activeImages = gallery.slice(1).filter(item => 
        item.length >= 4 && item[3] && item[3].toLowerCase() === 'activo'
    );

    if (activeImages.length === 0) {
        container.innerHTML = '<div class="loading">No hay imágenes activas</div>';
        return;
    }

    const galleryHTML = activeImages.map((item, index) => {
        const [titulo, descripcion, imagen, estado] = item;
        
        return `
            <div class="gallery-item" onclick="openModal('${imagen}', '${titulo}', '${descripcion}')">
                <div class="gallery-image" style="background-image: url('${imagen || ''}')"></div>
                <div class="gallery-overlay">
                    <div class="gallery-info">
                        <h3>${titulo || 'Sin título'}</h3>
                        <p>${descripcion || 'Sin descripción'}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = galleryHTML;
}

function openModal(imagen, titulo, descripcion) {
    const modal = document.getElementById('galleryModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    
    modalImage.src = imagen;
    modalTitle.textContent = titulo;
    modalDescription.textContent = descripcion;
    modal.style.display = 'block';
    
    // Cerrar modal al hacer clic fuera de la imagen
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

function closeModal() {
    document.getElementById('galleryModal').style.display = 'none';
}

// ========================================
// VIDEOS
// ========================================

function renderVideos() {
    const videos = sheetsData.videos || [];
    const container = document.getElementById('videosContainer');
    
    console.log('📹 Renderizando videos:', videos.length, 'videos');
    
    if (videos.length <= 1) {
        container.innerHTML = '<div class="loading">No hay videos configurados</div>';
        return;
    }

    // Filtrar videos activos (omitir header)
    const activeVideos = videos.slice(1).filter(video => 
        video.length >= 4 && video[3] && video[3].toLowerCase() === 'activo'
    );

    if (activeVideos.length === 0) {
        container.innerHTML = '<div class="loading">No hay videos activos</div>';
        return;
    }

    const videosHTML = activeVideos.map(video => {
        const [titulo, youtubeId, descripcion, estado] = video;
        
        return `
            <div class="video-container">
                <div class="video-wrapper">
                    <iframe 
                        src="https://www.youtube.com/embed/${youtubeId || 'dQw4w9WgXcQ'}" 
                        title="${titulo || 'Video Sin Título'}" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${titulo || 'Video Sin Título'}</h3>
                    <p class="video-description">${descripcion || 'Descripción del video'}</p>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = videosHTML;
}

// ========================================
// CONTENIDO POR DEFECTO
// ========================================

function loadDefaultContent() {
    console.log('🔄 Cargando contenido por defecto...');
    
    // Slider por defecto
    document.getElementById('slidesWrapper').innerHTML = `
        <div class="hero-slide active" style="background-image: url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')">
            <div class="slide-overlay"></div>
            <div class="slide-content">
                <h2 class="slide-title">Urban Radio en Vivo</h2>
                <p class="slide-description">La mejor música urbana las 24 horas del día</p>
            </div>
        </div>
    `;
    
    document.getElementById('sliderNav').innerHTML = `
        <div class="slider-dot active" onclick="currentSlide(1)"></div>
    `;

    // DJs por defecto
    document.getElementById('djsContainer').innerHTML = `
        <div class="dj-card">
            <div class="dj-image" style="background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2));">
                <div class="dj-overlay"></div>
            </div>
            <div class="dj-info">
                <h3>DJ Urbano</h3>
                <p class="dj-specialty">Reggaeton & Trap</p>
                <p class="dj-description">Especialista en los hits más calientes del momento</p>
            </div>
        </div>
    `;

    // Galería por defecto
    document.getElementById('galleryContainer').innerHTML = `
        <div class="gallery-item">
            <div class="gallery-image" style="background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2));"></div>
            <div class="gallery-overlay">
                <div class="gallery-info">
                    <h3>Próximos Eventos</h3>
                    <p>Mantente atento a nuestras redes sociales</p>
                </div>
            </div>
        </div>
    `;

    // Videos por defecto
    document.getElementById('videosContainer').innerHTML = `
        <div class="video-container">
            <div class="video-wrapper">
                <iframe src="https://www.youtube.com/embed/kJQP7kiw5Fk" title="Despacito" allowfullscreen></iframe>
            </div>
            <div class="video-info">
                <h3 class="video-title">Despacito - Luis Fonsi ft. Daddy Yankee</h3>
                <p class="video-description">El hit que conquistó el mundo</p>
            </div>
        </div>
    `;
}

// ========================================
// REPRODUCTOR DE RADIO
// ========================================

function initRadioPlayer() {
    console.log('📻 Inicializando reproductor de radio...');
    document.getElementById('songTitle').textContent = 'Radio Power';
    document.getElementById('songArtist').textContent = 'Música Urbana 24/7';
}

function togglePlay() {
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    
    if (isPlaying) {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        if (radioAudio) {
            radioAudio.pause();
            radioAudio.src = '';
        }
        isPlaying = false;
        document.getElementById('songTitle').textContent = 'Radio pausada';
        document.getElementById('songArtist').textContent = 'Presiona play para continuar';
    } else {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        
        document.getElementById('songTitle').textContent = 'Conectando...';
        document.getElementById('songArtist').textContent = 'Cargando stream en vivo';
        
        radioAudio = new Audio();
        radioAudio.src = 'https://stream.zeno.fm/cxf1r8zukyhuv?' + new Date().getTime();
        radioAudio.volume = currentVolume / 100;
        
        radioAudio.play().then(() => {
            document.getElementById('songTitle').textContent = 'Urban Radio';
            document.getElementById('songArtist').textContent = 'En vivo ahora';
        }).catch(e => {
            console.log('Error playing audio:', e);
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            isPlaying = false;
            document.getElementById('songTitle').textContent = 'Error de conexión';
            document.getElementById('songArtist').textContent = 'Intenta de nuevo';
        });
        isPlaying = true;
    }
}

function changeVolume(value) {
    currentVolume = value;
    if (radioAudio) {
        radioAudio.volume = value / 100;
    }
}

// ========================================
// MENÚ MÓVIL
// ========================================

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('active');
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.remove('active');
}

// ========================================
// NAVEGACIÓN SUAVE
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========================================
// CERRAR MODAL CON ESC
// ========================================

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// ========================================
// INICIALIZAR APLICACIÓN
// ========================================

window.addEventListener('load', initApp);
