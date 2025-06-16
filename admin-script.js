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
        this.uploadedImageUrl = null;
        this.editUploadedImageUrl = null;
        
        // Initialize image input toggles
        this.toggleImageInputs('url', false);
        this.toggleImageInputs('url', true);
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

        // Cleanup rentals button
        document.getElementById('cleanupRentalsBtn').addEventListener('click', () => {
            this.cleanupRentals();
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

        // Image option radio buttons
        document.querySelectorAll('input[name="imageOption"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleImageInputs(e.target.value, false);
            });
        });

        document.querySelectorAll('input[name="editImageOption"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleImageInputs(e.target.value, true);
            });
        });

        // Upload button click events
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('imageUpload').click();
        });

        document.getElementById('editUploadBtn').addEventListener('click', () => {
            document.getElementById('editImageUpload').click();
        });

        // File input change events
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.handleFileSelect(e, false);
        });

        document.getElementById('editImageUpload').addEventListener('change', (e) => {
            this.handleFileSelect(e, true);
        });
    }

    async addArticle() {
        const formData = new FormData(document.getElementById('articleForm'));
        const articleData = this.formDataToObject(formData);
        
        // Check which image option is selected
        const imageOption = document.querySelector('input[name="imageOption"]:checked').value;
        if (imageOption === 'upload' && this.uploadedImageUrl) {
            articleData.imageUrl = this.uploadedImageUrl;
        }
        
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
                this.resetImageInputs(false);
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

        // Check which image option is selected for edit
        const editImageOption = document.querySelector('input[name="editImageOption"]:checked').value;
        if (editImageOption === 'upload' && this.editUploadedImageUrl) {
            articleData.imageUrl = this.editUploadedImageUrl;
        }

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

    // Image upload methods
    toggleImageInputs(selectedOption, isEdit) {
        const prefix = isEdit ? 'edit' : '';
        const urlInput = document.getElementById(`${prefix}${prefix ? 'I' : 'i'}mageUrl`);
        const uploadBtn = document.getElementById(`${prefix}${prefix ? 'U' : 'u'}ploadBtn`);
        const uploadInput = document.getElementById(`${prefix}${prefix ? 'I' : 'i'}mageUpload`);
        const uploadPreview = document.getElementById(`${prefix}${prefix ? 'U' : 'u'}ploadPreview`);

        if (selectedOption === 'url') {
            urlInput.style.display = 'block';
            uploadBtn.style.display = 'none';
            uploadInput.style.display = 'none';
            uploadPreview.style.display = 'none';
            uploadPreview.innerHTML = '';
        } else {
            urlInput.style.display = 'none';
            uploadBtn.style.display = 'block';
            uploadInput.style.display = 'none';
            uploadPreview.style.display = 'none';
        }
    }

    async handleFileSelect(event, isEdit) {
        const file = event.target.files[0];
        if (!file) return;

        const prefix = isEdit ? 'edit' : '';
        const previewDiv = document.getElementById(`${prefix}${prefix ? 'U' : 'u'}ploadPreview`);
        
        // Validate file type
        if (!file.type.match('image/(png|jpeg|jpg)')) {
            this.showMessage('Nur PNG, JPG und JPEG Dateien sind erlaubt!', 'error');
            event.target.value = '';
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showMessage('Die Datei ist zu groß! Maximum 5MB erlaubt.', 'error');
            event.target.value = '';
            return;
        }

        try {
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewDiv.innerHTML = `
                    <img src="${e.target.result}" alt="Vorschau">
                    <div class="file-info">
                        <strong>${file.name}</strong><br>
                        Größe: ${(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <button type="button" class="remove-btn" onclick="adminPanel.removeUploadedFile('${prefix}')">
                        <i class="fas fa-times"></i> Entfernen
                    </button>
                `;
                previewDiv.style.display = 'block';
            };
            reader.readAsDataURL(file);

            // Upload file to server
            const formData = new FormData();
            formData.append('image', file);

            const uploadBtn = document.getElementById(`${prefix}${prefix ? 'U' : 'u'}ploadBtn`);
            const originalText = uploadBtn.innerHTML;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Hochladen...';
            uploadBtn.disabled = true;

            const response = await fetch(`${this.apiUrl}/upload-image`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload fehlgeschlagen');
            }

            const result = await response.json();
            
            // Store the uploaded image URL
            if (isEdit) {
                this.editUploadedImageUrl = result.imageUrl;
            } else {
                this.uploadedImageUrl = result.imageUrl;
            }

            this.showMessage('Bild erfolgreich hochgeladen!', 'success');

        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage(`Upload fehlgeschlagen: ${error.message}`, 'error');
            event.target.value = '';
            previewDiv.style.display = 'none';
        } finally {
            const uploadBtn = document.getElementById(`${prefix}${prefix ? 'U' : 'u'}ploadBtn`);
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> PNG/JPG auswählen';
            uploadBtn.disabled = false;
        }
    }

    removeUploadedFile(prefix) {
        const uploadInput = document.getElementById(`${prefix}${prefix ? 'I' : 'i'}mageUpload`);
        const previewDiv = document.getElementById(`${prefix}${prefix ? 'U' : 'u'}ploadPreview`);
        
        uploadInput.value = '';
        previewDiv.innerHTML = '';
        previewDiv.style.display = 'none';
        
        if (prefix === 'edit') {
            this.editUploadedImageUrl = null;
        } else {
            this.uploadedImageUrl = null;
        }
    }

    resetImageInputs(isEdit) {
        const prefix = isEdit ? 'edit' : '';
        
        // Reset radio buttons to URL option
        document.getElementById(`${prefix}${prefix ? 'I' : 'i'}mageUrlOption`).checked = true;
        
        // Clear and hide upload elements
        document.getElementById(`${prefix}${prefix ? 'I' : 'i'}mageUpload`).value = '';
        document.getElementById(`${prefix}${prefix ? 'U' : 'u'}ploadPreview`).innerHTML = '';
        document.getElementById(`${prefix}${prefix ? 'U' : 'u'}ploadPreview`).style.display = 'none';
        
        // Show URL input, hide upload elements
        this.toggleImageInputs('url', isEdit);
        
        // Clear stored URLs
        if (isEdit) {
            this.editUploadedImageUrl = null;
        } else {
            this.uploadedImageUrl = null;
        }
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
                    <button class="btn btn-danger" onclick="adminPanel.deleteRequest('${request.id}')" style="background-color: #dc3545;">
                        <i class="fas fa-trash"></i> Löschen
                    </button>
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

    async deleteRequest(requestId) {
        console.log('deleteRequest called with ID:', requestId);
        console.log('currentRequestId:', this.currentRequestId);
        
        // Use current request ID if not provided (for modal delete button)
        const idToDelete = requestId || this.currentRequestId;
        
        console.log('ID to delete:', idToDelete);
        
        if (!idToDelete) {
            this.showMessage('Keine Anfrage zum Löschen ausgewählt', 'error');
            return;
        }

        // Find the request to show details in confirmation
        const request = this.allRequests.find(r => r.id === idToDelete);
        const requestInfo = request ? `"${request.productTitle}" von ${request.customerName}` : 'diese Anfrage';

        console.log('Request to delete:', request);

        if (!confirm(`Sind Sie sicher, dass Sie ${requestInfo} komplett löschen möchten?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`)) {
            return;
        }

        try {
            console.log('Sending DELETE request to:', `${this.apiUrl}/rental-requests/${idToDelete}`);
            
            const response = await fetch(`${this.apiUrl}/rental-requests/${idToDelete}`, {
                method: 'DELETE'
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('Delete result:', result);

            // Remove from local data
            this.allRequests = this.allRequests.filter(r => r.id !== idToDelete);
            
            // Refresh display
            this.displayRequests(this.allRequests);
            this.showMessage('Anfrage wurde erfolgreich gelöscht', 'success');
            
            // Close modal if it was open
            if (document.getElementById('requestModal').style.display === 'block') {
                this.closeRequestModal();
            }
        } catch (error) {
            console.error('Error deleting request:', error);
            this.showMessage(`Fehler beim Löschen der Anfrage: ${error.message}`, 'error');
        }
    }

    // Cleanup rentals function
    async cleanupRentals() {
        if (!confirm('Möchten Sie die Mietdaten bereinigen?\n\nDies entfernt Duplikate und verwaiste Einträge aus den bestätigten Buchungen. Diese Aktion kann nicht rückgängig gemacht werden.')) {
            return;
        }

        try {
            const cleanupBtn = document.getElementById('cleanupRentalsBtn');
            const originalText = cleanupBtn.innerHTML;
            cleanupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Bereinige...';
            cleanupBtn.disabled = true;

            const response = await fetch(`${this.apiUrl}/cleanup-rentals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to cleanup rentals');
            }

            const result = await response.json();
            
            this.showMessage(
                `Mietdaten erfolgreich bereinigt!\n\nUrsprünglich: ${result.details.original} Einträge\nBereinigt: ${result.details.cleaned} Einträge\nEntfernt: ${result.details.removed} Duplikate/verwaiste Einträge`, 
                'success'
            );
            
            // Refresh the requests list to show updated data
            this.loadRentalRequests();
            
        } catch (error) {
            console.error('Error cleaning up rentals:', error);
            this.showMessage('Fehler beim Bereinigen der Mietdaten: ' + error.message, 'error');
        } finally {
            const cleanupBtn = document.getElementById('cleanupRentalsBtn');
            cleanupBtn.innerHTML = '<i class="fas fa-broom"></i> Mietdaten bereinigen';
            cleanupBtn.disabled = false;
        }
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

function deleteRequest() {
    adminPanel.deleteRequest();
}

function showSection(sectionName) {
    adminPanel.showSection(sectionName);
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});