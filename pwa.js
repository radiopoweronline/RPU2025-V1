// pwa.js - Detecta si ya está instalado
console.log('PWA cargando...');

class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.isFirefox = navigator.userAgent.includes('Firefox');
        this.init();
    }

    init() {
        // 🔥 PRIMERO verificar si ya está instalado
        if (this.isAlreadyInstalled()) {
            console.log('✅ PWA ya está instalado, no mostrar banner');
            return;
        }

        this.bindEvents();
        
        if (this.isFirefox) {
            setTimeout(() => this.showPopup(), 10000);
        } else {
            setTimeout(() => {
                if (!this.deferredPrompt) this.showPopup();
            }, 10000);
        }
    }

    // 🔥 NUEVO: Detectar si ya está instalado
    isAlreadyInstalled() {
        // Método 1: display-mode standalone
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('📱 Detectado: PWA en modo standalone');
            return true;
        }
        
        // Método 2: navigator.standalone (iOS)
        if (window.navigator.standalone) {
            console.log('📱 Detectado: PWA en iOS standalone');
            return true;
        }
        
        // Método 3: localStorage flag
        if (localStorage.getItem('pwa_installed') === 'true') {
            console.log('📱 Detectado: PWA marcado como instalado');
            return true;
        }
        
        return false;
    }

    // 🔥 NUEVO: Marcar como instalado
    setAsInstalled() {
        localStorage.setItem('pwa_installed', 'true');
        console.log('✅ PWA marcado como instalado');
    }

    bindEvents() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showPopup();
        });

        // 🔥 NUEVO: Detectar cuando se instala
        window.addEventListener('appinstalled', () => {
            console.log('🎉 PWA instalado exitosamente');
            this.setAsInstalled();
            this.hidePopup();
        });

        document.addEventListener('click', (e) => {
            if (e.target.id === 'pwa-install-btn') this.installPWA();
            if (e.target.id === 'pwa-later-btn') this.hidePopup();
        });
    }

    showPopup() {
        // 🔥 VERIFICAR de nuevo antes de mostrar
        if (this.isAlreadyInstalled()) {
            console.log('❌ PWA ya instalado, cancelando banner');
            return;
        }

        const popup = document.getElementById('pwa-install-popup');
        if (popup) {
            if (this.isFirefox) {
                this.updateFirefoxMessage();
            }
            popup.classList.remove('hidden');
        }
    }

    updateFirefoxMessage() {
        const installBtn = document.getElementById('pwa-install-btn');
        const title = document.querySelector('#pwa-install-popup .text-white');
        
        if (installBtn && title) {
            title.textContent = "Radio Power PWA";
            installBtn.textContent = "Cómo instalar";
        }
    }

    hidePopup() {
        const popup = document.getElementById('pwa-install-popup');
        if (popup) popup.classList.add('hidden');
    }

    async installPWA() {
        if (this.isFirefox) {
            this.showFirefoxInstructions();
            this.hidePopup();
            return;
        }

        if (!this.deferredPrompt) {
            alert('Tu navegador no soporta instalación directa. Usa el menú de tu navegador.');
            return;
        }

        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            this.deferredPrompt = null;
            
            if (outcome === 'accepted') {
                this.setAsInstalled(); // 🔥 Marcar como instalado
                this.hidePopup();
            }
        } catch (error) {
            console.error('Error instalación:', error);
        }
    }

    showFirefoxInstructions() {
        const message = `📱 Para instalar Radio Power en Firefox:

1. Haz clic en el menú "⋯" (esquina superior derecha)
2. Selecciona "Instalar Radio Power"
3. O busca "Instalar" en el menú

¡Listo! La app se agregará a tu pantalla de inicio.`;

        alert(message);
    }
}

// Inicializar
new PWAInstallManager();
