// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadArticles();
        this.currentRequestId = null;
        this.allRequests = [];
    }

    bindEvents() {
        // Form submission
        document.getElementById('articleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addArticle();
        });

        // Edit form submission
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateArticle();
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadArticles();
        });

        // Category filter
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterArticles(e.target.value);
        });

        // Requests refresh button
        document.getElementById('refreshRequestsBtn').addEventListener('click', () => {
            this.loadRentalRequests();
        });

        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filterRequests(e.target.value);
        });

        // Modal close events
        document.querySelector('.close').addEventListener('click', () => {
            this.closeEditModal();
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                this.closeEditModal();
            }
        });
    }

    async addArticle() {
        const formData = new FormData(document.getElementById('articleForm'));
        const articleData = this.formDataToObject(formData);
        
        // Process features
        if (articleData.features) {
            articleData.features = articleData.features.split('\n').filter(f => f.trim());
        }

        try {
            const response = await fetch(`${this.apiUrl}/articles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(articleData)
            });

            if (response.ok) {
                this.showMessage('Artikel erfolgreich hinzugefügt!', 'success');
                document.getElementById('articleForm').reset();
                this.loadArticles();
            } else {
                const error = await response.text();
                this.showMessage(`Fehler beim Hinzufügen: ${error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`Netzwerkfehler: ${error.message}`, 'error');
        }
    }

    async loadArticles() {
        const articlesList = document.getElementById('articlesList');
        articlesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Lade Artikel...</div>';

        try {
            const response = await fetch(`${this.apiUrl}/articles`);
            if (response.ok) {
                const articles = await response.json();
                this.displayArticles(articles);
            } else {
                articlesList.innerHTML = '<div class="loading">Fehler beim Laden der Artikel</div>';
            }
        } catch (error) {
            articlesList.innerHTML = '<div class="loading">Netzwerkfehler beim Laden der Artikel</div>';
        }
    }

    displayArticles(articles) {
        const articlesList = document.getElementById('articlesList');
        
        if (articles.length === 0) {
            articlesList.innerHTML = '<div class="loading">Keine Artikel vorhanden</div>';
            return;
        }

        articlesList.innerHTML = articles.map(article => this.createArticleHTML(article)).join('');
    }

    createArticleHTML(article) {
        const featuresHTML = article.features && article.features.length > 0 
            ? `<div class="article-features">
                <h4>Eigenschaften:</h4>
                <div class="features-list">
                    ${article.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                </div>
               </div>`
            : '';

        const imageHTML = article.imageUrl 
            ? `<img src="${article.imageUrl}" alt="${article.title}" class="article-image" onerror="this.style.display='none'">`
            : '';

        return `
            <div class="article-item" data-category="${article.category}">
                <div class="article-header">
                    <div class="article-info">
                        <h3>${article.title}</h3>
                        <div class="article-meta">
                            <span class="category-badge">${this.getCategoryName(article.category)}</span>
                            <span class="price-tag">${article.price}€/Tag</span>
                            <span class="status-badge ${article.available ? 'status-available' : 'status-unavailable'}">
                                ${article.available ? 'Verfügbar' : 'Nicht verfügbar'}
                            </span>
                        </div>
                        <div class="article-actions">
                            <button class="btn-secondary" onclick="adminPanel.editArticle('${article.id}')">
                                <i class="fas fa-edit"></i> Bearbeiten
                            </button>
                            <button class="btn-danger" onclick="adminPanel.deleteArticle('${article.id}')">
                                <i class="fas fa-trash"></i> Löschen
                            </button>
                        </div>
                    </div>
                    ${imageHTML}
                </div>
                <div class="article-description">${article.description}</div>
                ${featuresHTML}
                <div class="article-meta">
                    <small>Erstellt: ${new Date(article.createdAt).toLocaleDateString('de-DE')}</small>
                </div>
            </div>
        `;
    }

    getCategoryName(category) {
        const categories = {
            'anhaenger': 'Anhänger',
            'party-events': 'Party & Events',
            'bauarbeiten': 'Bauarbeiten'
        };
        return categories[category] || category;
    }

    filterArticles(category) {
        const articles = document.querySelectorAll('.article-item');
        articles.forEach(article => {
            if (!category || article.dataset.category === category) {
                article.style.display = 'block';
            } else {
                article.style.display = 'none';
            }
        });
    }

    async editArticle(id) {
        try {
            const response = await fetch(`${this.apiUrl}/articles/${id}`);
            if (response.ok) {
                const article = await response.json();
                this.populateEditForm(article);
                this.openEditModal();
            } else {
                this.showMessage('Fehler beim Laden des Artikels', 'error');
            }
        } catch (error) {
            this.showMessage(`Netzwerkfehler: ${error.message}`, 'error');
        }
    }

    populateEditForm(article) {
        document.getElementById('editId').value = article.id;
        document.getElementById('editTitle').value = article.title;
        document.getElementById('editCategory').value = article.category;
        document.getElementById('editDescription').value = article.description;
        document.getElementById('editPrice').value = article.price;
        document.getElementById('editImageUrl').value = article.imageUrl || '';
        document.getElementById('editFeatures').value = article.features ? article.features.join('\n') : '';
        document.getElementById('editAvailable').checked = article.available;
    }

    async updateArticle() {
        const formData = new FormData(document.getElementById('editForm'));
        const articleData = this.formDataToObject(formData);
        const id = articleData.id;
        delete articleData.id;

        // Process features
        if (articleData.features) {
            articleData.features = articleData.features.split('\n').filter(f => f.trim());
        }

        try {
            const response = await fetch(`${this.apiUrl}/articles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(articleData)
            });

            if (response.ok) {
                this.showMessage('Artikel erfolgreich aktualisiert!', 'success');
                this.closeEditModal();
                this.loadArticles();
            } else {
                const error = await response.text();
                this.showMessage(`Fehler beim Aktualisieren: ${error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`Netzwerkfehler: ${error.message}`, 'error');
        }
    }

    async deleteArticle(id) {
        if (!confirm('Sind Sie sicher, dass Sie diesen Artikel löschen möchten?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/articles/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showMessage('Artikel erfolgreich gelöscht!', 'success');
                this.loadArticles();
            } else {
                const error = await response.text();
                this.showMessage(`Fehler beim Löschen: ${error}`, 'error');
            }
        } catch (error) {
            this.showMessage(`Netzwerkfehler: ${error.message}`, 'error');
        }
    }

    openEditModal() {
        document.getElementById('editModal').style.display = 'block';
    }

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    formDataToObject(formData) {
        const object = {};
        formData.forEach((value, key) => {
            if (key === 'available') {
                object[key] = true; // checkbox is checked if present
            } else if (key === 'price') {
                object[key] = parseFloat(value);
            } else {
                object[key] = value;
            }
        });
        
        // Handle unchecked checkbox
        if (!object.hasOwnProperty('available')) {
            object.available = false;
        }
        
        return object;
    }

    showMessage(message, type) {
        const messageContainer = document.getElementById('messageContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        messageContainer.appendChild(messageDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    // Rental Requests Management
    async loadRentalRequests() {
        try {
            const response = await fetch(`${this.apiUrl}/rental-requests`);
            if (!response.ok) {
                throw new Error('Failed to load requests');
            }
            
            this.allRequests = await response.json();
            this.displayRequests(this.allRequests);
        } catch (error) {
            console.error('Error loading requests:', error);
            this.showMessage('Fehler beim Laden der Anfragen', 'error');
        }
    }

    displayRequests(requests) {
        const requestsList = document.getElementById('requestsList');
        
        if (requests.length === 0) {
            requestsList.innerHTML = '<div class="no-data">Keine Anfragen vorhanden</div>';
            return;
        }

        requestsList.innerHTML = requests.map(request => `
            <div class="request-item">
                <div class="request-header">
                    <h3 class="request-title">${request.productTitle}</h3>
                    <span class="request-status ${request.status}">${this.getStatusText(request.status)}</span>
                </div>
                
                <div class="request-info">
                    <div class="request-info-item">
                        <span class="request-info-label">Kunde</span>
                        <span class="request-info-value">${request.customerName}</span>
                    </div>
                    <div class="request-info-item">
                        <span class="request-info-label">E-Mail</span>
                        <span class="request-info-value">${request.customerEmail}</span>
                    </div>
                    <div class="request-info-item">
                        <span class="request-info-label">Telefon</span>
                        <span class="request-info-value">${request.customerPhone || 'Nicht angegeben'}</span>
                    </div>
                    <div class="request-info-item">
                        <span class="request-info-label">Gesamtpreis</span>
                        <span class="request-info-value request-price">${request.totalPrice.toFixed(2)} €</span>
                    </div>
                </div>

                <div class="request-dates">
                    <div class="request-dates-title">Mietdauer</div>
                    <div class="request-date-range">
                        ${new Date(request.startDate).toLocaleDateString('de-DE')} - 
                        ${new Date(request.endDate).toLocaleDateString('de-DE')}
                    </div>
                </div>

                ${request.message ? `
                    <div class="request-message">
                        <strong>Nachricht:</strong> ${request.message}
                    </div>
                ` : ''}

                <div class="request-actions">
                    <button class="btn btn-primary" onclick="adminPanel.showRequestDetails('${request.id}')">
                        <i class="fas fa-eye"></i> Details
                    </button>
                    ${request.status === 'pending' ? `
                        <button class="btn btn-success" onclick="adminPanel.quickUpdateStatus('${request.id}', 'approved')">
                            <i class="fas fa-check"></i> Genehmigen
                        </button>
                        <button class="btn btn-danger" onclick="adminPanel.quickUpdateStatus('${request.id}', 'rejected')">
                            <i class="fas fa-times"></i> Ablehnen
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Ausstehend',
            'approved': 'Genehmigt',
            'rejected': 'Abgelehnt'
        };
        return statusMap[status] || status;
    }

    filterRequests(status) {
        if (!status) {
            this.displayRequests(this.allRequests);
        } else {
            const filtered = this.allRequests.filter(request => request.status === status);
            this.displayRequests(filtered);
        }
    }

    showRequestDetails(requestId) {
        const request = this.allRequests.find(r => r.id === requestId);
        if (!request) return;

        this.currentRequestId = requestId;
        
        const requestDetails = document.getElementById('requestDetails');
        requestDetails.innerHTML = `
            <div class="request-details-grid">
                <div class="request-details-section">
                    <h4>Produktinformationen</h4>
                    <p><strong>Produkt:</strong> ${request.productTitle}</p>
                    <p><strong>Produkt-ID:</strong> ${request.productId}</p>
                </div>
                
                <div class="request-details-section">
                    <h4>Kundendaten</h4>
                    <p><strong>Name:</strong> ${request.customerName}</p>
                    <p><strong>E-Mail:</strong> ${request.customerEmail}</p>
                    <p><strong>Telefon:</strong> ${request.customerPhone || 'Nicht angegeben'}</p>
                </div>
                
                <div class="request-details-section">
                    <h4>Mietdauer</h4>
                    <p><strong>Von:</strong> ${new Date(request.startDate).toLocaleDateString('de-DE')}</p>
                    <p><strong>Bis:</strong> ${new Date(request.endDate).toLocaleDateString('de-DE')}</p>
                    <p><strong>Tage:</strong> ${this.calculateDays(request.startDate, request.endDate)}</p>
                </div>
                
                <div class="request-details-section">
                    <h4>Preisdetails</h4>
                    <p><strong>Gesamtpreis:</strong> ${request.totalPrice.toFixed(2)} €</p>
                    <p><strong>Status:</strong> ${this.getStatusText(request.status)}</p>
                </div>
            </div>
            
            ${request.message ? `
                <div class="request-details-section">
                    <h4>Kundennachricht</h4>
                    <p>${request.message}</p>
                </div>
            ` : ''}
            
            ${request.adminNote ? `
                <div class="request-details-section">
                    <h4>Admin-Notiz</h4>
                    <p>${request.adminNote}</p>
                </div>
            ` : ''}
            
            <div class="request-details-section">
                <h4>Zeitstempel</h4>
                <p><strong>Erstellt:</strong> ${new Date(request.createdAt).toLocaleString('de-DE')}</p>
                <p><strong>Aktualisiert:</strong> ${new Date(request.updatedAt).toLocaleString('de-DE')}</p>
            </div>
        `;

        // Set current admin note
        document.getElementById('adminNote').value = request.adminNote || '';
        
        document.getElementById('requestModal').style.display = 'block';
    }

    calculateDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const timeDiff = end.getTime() - start.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    async quickUpdateStatus(requestId, status) {
        if (confirm(`Möchten Sie diese Anfrage wirklich ${status === 'approved' ? 'genehmigen' : 'ablehnen'}?`)) {
            await this.updateRequestStatus(requestId, status, '');
        }
    }

    async updateRequestStatus(requestId, status, adminNote) {
        try {
            const response = await fetch(`${this.apiUrl}/rental-requests/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, adminNote })
            });

            if (!response.ok) {
                throw new Error('Failed to update request');
            }

            const updatedRequest = await response.json();
            
            // Update local data
            const index = this.allRequests.findIndex(r => r.id === requestId);
            if (index !== -1) {
                this.allRequests[index] = updatedRequest;
            }

            this.displayRequests(this.allRequests);
            this.showMessage(`Anfrage wurde ${this.getStatusText(status).toLowerCase()}`, 'success');
            
            if (document.getElementById('requestModal').style.display === 'block') {
                this.closeRequestModal();
            }
        } catch (error) {
            console.error('Error updating request:', error);
            this.showMessage('Fehler beim Aktualisieren der Anfrage', 'error');
        }
    }

    closeRequestModal() {
        document.getElementById('requestModal').style.display = 'none';
        this.currentRequestId = null;
    }

    // Section Management
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected section
        document.getElementById(`${sectionName}-section`).style.display = 'block';
        
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Load data for the section
        if (sectionName === 'requests') {
            this.loadRentalRequests();
        } else if (sectionName === 'articles') {
            this.loadArticles();
        }
    }
}

// Global functions for onclick handlers
function closeEditModal() {
    adminPanel.closeEditModal();
}

function closeRequestModal() {
    adminPanel.closeRequestModal();
}

function updateRequestStatus(status) {
    const adminNote = document.getElementById('adminNote').value;
    if (adminPanel.currentRequestId) {
        adminPanel.updateRequestStatus(adminPanel.currentRequestId, status, adminNote);
    }
}

function showSection(sectionName) {
    adminPanel.showSection(sectionName);
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});