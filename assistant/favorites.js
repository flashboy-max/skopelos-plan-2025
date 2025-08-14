// 🌟 Favorites System - Čuvanje i učitavanje omiljenih planova

// === FAVORITES MANAGEMENT ===
class FavoritesManager {
    constructor() {
        this.storageKey = 'aiPlanFavorites';
        this.setupEventListeners();
    }
    
    // Sačuvaj plan kao favorit
    saveFavorite(plan) {
        try {
            const favorites = this.getFavorites();
            const favorite = {
                id: Date.now(),
                name: this.generateFavoriteName(plan),
                plan: plan,
                saved: new Date().toLocaleDateString('sr-RS'),
                timestamp: new Date().toISOString()
            };
            
            favorites.push(favorite);
            localStorage.setItem(this.storageKey, JSON.stringify(favorites));
            
            this.showNotification(`💾 Plan "${favorite.name}" je sačuvan u favorite!`, 'success');
            this.updateFavoritesCount();
            
            return favorite;
        } catch (error) {
            console.error('Greška prilikom čuvanja favorita:', error);
            this.showNotification('❌ Greška prilikom čuvanja favorita', 'error');
            return null;
        }
    }
    
    // Učitaj sve favorite
    getFavorites() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (error) {
            console.error('Greška prilikom učitavanja favorita:', error);
            return [];
        }
    }
    
    // Obriši favorit
    deleteFavorite(favoriteId) {
        try {
            let favorites = this.getFavorites();
            favorites = favorites.filter(f => f.id !== favoriteId);
            localStorage.setItem(this.storageKey, JSON.stringify(favorites));
            
            this.showNotification('🗑️ Favorit je obrisan', 'info');
            this.updateFavoritesCount();
            
            return true;
        } catch (error) {
            console.error('Greška prilikom brisanja favorita:', error);
            this.showNotification('❌ Greška prilikom brisanja favorita', 'error');
            return false;
        }
    }
    
    // Generiši ime za favorit
    generateFavoriteName(plan) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('sr-RS', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        let baseName = plan.title || 'Nepoznat plan';
        
        // Skrati ime ako je predugo
        if (baseName.length > 30) {
            baseName = baseName.substring(0, 27) + '...';
        }
        
        return `${baseName} (${timeStr})`;
    }
    
    // Prikaži favorite u modal dijalogu
    showFavoritesModal() {
        const favorites = this.getFavorites();
        
        if (favorites.length === 0) {
            this.showNotification('📝 Nemate sačuvane favorite planove', 'info');
            return;
        }
        
        this.createFavoritesModal(favorites);
    }
    
    // Kreiraj modal sa favoritima
    createFavoritesModal(favorites) {
        // Ukloni postojeći modal ako postoji
        const existingModal = document.getElementById('favorites-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'favorites-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>⭐ Omiljeni Planovi</h3>
                        <button class="modal-close" onclick="document.getElementById('favorites-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        ${favorites.map(favorite => `
                            <div class="favorite-item" data-favorite-id="${favorite.id}">
                                <div class="favorite-info">
                                    <div class="favorite-name">${favorite.name}</div>
                                    <div class="favorite-date">Sačuvano: ${favorite.saved}</div>
                                    <div class="favorite-preview">
                                        ${favorite.plan.items ? favorite.plan.items.length : 0} aktivnosti
                                        ${favorite.plan.budgetNote ? ` | ${favorite.plan.budgetNote}` : ''}
                                    </div>
                                </div>
                                <div class="favorite-actions">
                                    <button class="btn-load" onclick="favoritesManager.loadFavorite(${favorite.id})">
                                        📋 Učitaj
                                    </button>
                                    <button class="btn-delete" onclick="favoritesManager.deleteFavoriteFromModal(${favorite.id})">
                                        🗑️ Obriši
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="document.getElementById('favorites-modal').remove()">
                            Zatvori
                        </button>
                        <button class="btn-danger" onclick="favoritesManager.clearAllFavorites()">
                            🗑️ Obriši sve
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animacija pojavljivanja
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
    
    // Učitaj favorit po ID-u
    loadFavorite(favoriteId) {
        const favorites = this.getFavorites();
        const favorite = favorites.find(f => f.id === favoriteId);
        
        if (!favorite) {
            this.showNotification('❌ Favorit nije pronađen', 'error');
            return;
        }
        
        // Učitaj plan
        if (window.renderPlan && typeof window.renderPlan === 'function') {
            window.renderPlan(favorite.plan);
            window.currentPlan = favorite.plan;
        } else {
            console.error('renderPlan funkcija nije dostupna');
            this.showNotification('❌ Greška prilikom učitavanja plana', 'error');
            return;
        }
        
        // Zatvori modal
        const modal = document.getElementById('favorites-modal');
        if (modal) {
            modal.remove();
        }
        
        this.showNotification(`📋 Učitan plan: ${favorite.name}`, 'success');
        
        // Skroluj do AI output sekcije
        const aiOutput = document.getElementById('ai-output');
        if (aiOutput) {
            aiOutput.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Obriši favorit iz modala
    deleteFavoriteFromModal(favoriteId) {
        if (confirm('Da li ste sigurni da želite da obrišete ovaj favorit?')) {
            this.deleteFavorite(favoriteId);
            
            // Ukloni element iz modala
            const favoriteElement = document.querySelector(`[data-favorite-id="${favoriteId}"]`);
            if (favoriteElement) {
                favoriteElement.remove();
            }
            
            // Proveri da li su ostali favoriti
            const remainingFavorites = document.querySelectorAll('.favorite-item');
            if (remainingFavorites.length === 0) {
                const modal = document.getElementById('favorites-modal');
                if (modal) {
                    modal.remove();
                }
                this.showNotification('📝 Nema više favorita', 'info');
            }
        }
    }
    
    // Obriši sve favorite
    clearAllFavorites() {
        if (confirm('Da li ste sigurni da želite da obrišete SVE favorite? Ova akcija se ne može poništiti.')) {
            localStorage.removeItem(this.storageKey);
            
            const modal = document.getElementById('favorites-modal');
            if (modal) {
                modal.remove();
            }
            
            this.showNotification('🗑️ Svi favoriti su obrisani', 'info');
            this.updateFavoritesCount();
        }
    }
    
    // Ažuriraj broj favorita na dugmetu
    updateFavoritesCount() {
        const favorites = this.getFavorites();
        const loadBtn = document.getElementById('loadFavorites');
        
        if (loadBtn) {
            const count = favorites.length;
            if (count > 0) {
                loadBtn.textContent = `📋 Učitaj favorit (${count})`;
            } else {
                loadBtn.textContent = '📋 Učitaj favorit';
            }
        }
    }
    
    // Prikaži notifikaciju
    showNotification(message, type = 'info') {
        // Ukloni postojeće notifikacije
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animacija pojavljivanja
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Automatsko uklanjanje
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
    
    // Export plana u različite formate
    exportPlan(plan, format = 'text') {
        if (!plan) {
            this.showNotification('❌ Nema plana za export', 'error');
            return;
        }
        
        switch(format) {
            case 'whatsapp':
                this.exportToWhatsApp(plan);
                break;
            case 'pdf':
                this.exportToPDF(plan);
                break;
            case 'clipboard':
                this.exportToClipboard(plan);
                break;
            default:
                this.exportToClipboard(plan);
        }
    }
    
    // Export u WhatsApp
    exportToWhatsApp(plan) {
        const text = this.formatPlanForExport(plan);
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        this.showNotification('📱 WhatsApp otvoren za slanje', 'success');
    }
    
    // Export u clipboard
    exportToClipboard(plan) {
        const text = this.formatPlanForExport(plan);
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('📋 Plan kopiran u clipboard!', 'success');
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }
    
    // Fallback za copy to clipboard
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showNotification('📋 Plan kopiran u clipboard!', 'success');
        } catch (err) {
            this.showNotification('❌ Greška prilikom kopiranja', 'error');
        } finally {
            document.body.removeChild(textArea);
        }
    }
    
    // Export u PDF (jednostavan print)
    exportToPDF(plan) {
        const printContent = `
            <html>
            <head>
                <title>${plan.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; border-bottom: 2px solid #667eea; }
                    .schedule { margin: 20px 0; }
                    .schedule-item { margin: 10px 0; padding: 10px; border-left: 4px solid #667eea; }
                    .time { font-weight: bold; color: #667eea; }
                    .tips { background: #f0f0f0; padding: 15px; margin: 20px 0; }
                    .budget { background: #fff3e0; padding: 15px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1>${plan.title}</h1>
                ${plan.budgetNote ? `<p><strong>${plan.budgetNote}</strong></p>` : ''}
                
                <div class="schedule">
                    <h2>Program dana:</h2>
                    ${plan.items.map(item => `
                        <div class="schedule-item">
                            <span class="time">${item.time}</span> - ${item.what}
                            ${item.details ? `<br><small>${item.details}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
                
                ${plan.tips ? `
                    <div class="tips">
                        <h3>Saveti:</h3>
                        ${plan.tips.map(tip => `<p>• ${tip}</p>`).join('')}
                    </div>
                ` : ''}
                
                ${plan.budget ? `
                    <div class="budget">
                        <h3>Budžet:</h3>
                        ${plan.budget.breakdown.map(item => `<p>• ${item}</p>`).join('')}
                        <p><strong>Ukupno: €${plan.budget.total} (€${plan.budget.perPerson} po osobi)</strong></p>
                    </div>
                ` : ''}
            </body>
            </html>
        `;
        
        const newWindow = window.open('', '_blank');
        newWindow.document.write(printContent);
        newWindow.document.close();
        newWindow.print();
        
        this.showNotification('🖨️ Pokrenuto štampanje PDF-a', 'success');
    }
    
    // Formatiraj plan za text export
    formatPlanForExport(plan) {
        let text = `${plan.title}\n`;
        text += '='.repeat(plan.title.length) + '\n\n';
        
        if (plan.budgetNote) {
            text += `${plan.budgetNote}\n\n`;
        }
        
        text += 'PROGRAM DANA:\n';
        plan.items.forEach(item => {
            text += `${item.time} - ${item.what}\n`;
            if (item.details) {
                text += `    ${item.details}\n`;
            }
        });
        
        if (plan.tips && plan.tips.length > 0) {
            text += '\nSAVETI:\n';
            plan.tips.forEach(tip => {
                text += `• ${tip}\n`;
            });
        }
        
        if (plan.budget) {
            text += '\nBUDŽET:\n';
            plan.budget.breakdown.forEach(item => {
                text += `• ${item}\n`;
            });
            text += `\nUkupno: €${plan.budget.total} (€${plan.budget.perPerson} po osobi)\n`;
        }
        
        text += '\n---\nGenerirano od strane Skopelos AI Asistenta';
        
        return text;
    }
    
    // Setup event listenera
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Save favorite dugme
            const saveBtn = document.getElementById('saveFavorite');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    if (window.currentPlan) {
                        this.saveFavorite(window.currentPlan);
                    } else {
                        this.showNotification('❌ Nema plana za čuvanje', 'error');
                    }
                });
            }
            
            // Load favorites dugme
            const loadBtn = document.getElementById('loadFavorites');
            if (loadBtn) {
                loadBtn.addEventListener('click', () => {
                    this.showFavoritesModal();
                });
            }
            
            // Export dugme
            const exportBtn = document.getElementById('exportPlan');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    this.showExportModal();
                });
            }
            
            // Ažuriraj broj favorita na početku
            this.updateFavoritesCount();
        });
    }
    
    // Prikaži export modal
    showExportModal() {
        if (!window.currentPlan) {
            this.showNotification('❌ Nema plana za export', 'error');
            return;
        }
        
        // Ukloni postojeći modal
        const existingModal = document.getElementById('export-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'export-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📤 Export Plana</h3>
                        <button class="modal-close" onclick="document.getElementById('export-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <p>Izaberite format za export vašeg plana:</p>
                        <div class="export-options">
                            <button class="export-option" onclick="favoritesManager.exportPlan(window.currentPlan, 'whatsapp')">
                                📱 WhatsApp
                            </button>
                            <button class="export-option" onclick="favoritesManager.exportPlan(window.currentPlan, 'clipboard')">
                                📋 Kopiraj tekst
                            </button>
                            <button class="export-option" onclick="favoritesManager.exportPlan(window.currentPlan, 'pdf')">
                                🖨️ Štampaj/PDF
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="document.getElementById('export-modal').remove()">
                            Zatvori
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animacija pojavljivanja
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

// === INICIJALIZACIJA ===
const favoritesManager = new FavoritesManager();
