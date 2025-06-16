class AnfrageManager {
    constructor() {
        this.productId = null;
        this.product = null;
        this.blockedDates = [];
        this.init();
    }

    async init() {
        // Get product ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.productId = urlParams.get('product');
        
        if (!this.productId) {
            this.showError('Kein Produkt ausgewählt. Bitte gehen Sie zurück und wählen Sie ein Produkt aus.');
            return;
        }

        await this.loadProduct();
        await this.loadBlockedDates();
        this.setupEventListeners();
        this.setMinDate();
    }

    async loadProduct() {
        try {
            const response = await fetch(`/api/articles/${this.productId}`);
            if (!response.ok) {
                throw new Error('Produkt nicht gefunden');
            }
            
            this.product = await response.json();
            this.displayProductInfo();
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Fehler beim Laden des Produkts. Bitte versuchen Sie es später erneut.');
        }
    }

    async loadBlockedDates() {
        try {
            const response = await fetch('/mietdaten.json');
            if (response.ok) {
                const data = await response.json();
                this.blockedDates = data.filter(booking => 
                    booking.productId === this.productId && 
                    booking.status === 'confirmed'
                );
                this.displayBlockedDates();
            }
        } catch (error) {
            console.error('Error loading blocked dates:', error);
            // Continue without blocked dates - not critical
        }
    }

    displayProductInfo() {
        const productInfoDiv = document.getElementById('productInfo');
        productInfoDiv.innerHTML = `
            <h3>${this.product.title}</h3>
            <p><strong>Kategorie:</strong> ${this.product.category}</p>
            <p><strong>Beschreibung:</strong> ${this.product.description}</p>
            <p><strong>Preis:</strong> ${this.product.price.toFixed(2)} € pro Tag</p>
            ${this.product.features && this.product.features.length > 0 ? 
                `<p><strong>Features:</strong> ${this.product.features.join(', ')}</p>` : ''}
        `;
    }

    displayBlockedDates() {
        const blockedDatesDiv = document.getElementById('blockedDates');
        const blockedDatesListDiv = document.getElementById('blockedDatesList');
        
        if (this.blockedDates.length === 0) {
            blockedDatesDiv.style.display = 'none';
            return;
        }

        blockedDatesDiv.style.display = 'block';
        blockedDatesListDiv.innerHTML = this.blockedDates.map(booking => {
            const startDate = new Date(booking.startDate).toLocaleDateString('de-DE');
            const endDate = new Date(booking.endDate).toLocaleDateString('de-DE');
            return `<div class="blocked-date-item">${startDate} - ${endDate}</div>`;
        }).join('');
    }

    setupEventListeners() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const form = document.getElementById('anfrageForm');

        startDateInput.addEventListener('change', () => {
            this.validateDateSelection();
            this.calculatePrice();
        });

        endDateInput.addEventListener('change', () => {
            this.validateDateSelection();
            this.calculatePrice();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitRequest();
        });
    }

    setMinDate() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const minDate = tomorrow.toISOString().split('T')[0];
        document.getElementById('startDate').min = minDate;
        document.getElementById('endDate').min = minDate;
    }

    validateDateSelection() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        const submitBtn = document.getElementById('submitBtn');
        
        // Clear previous error messages
        this.hideError();

        if (!startDate || !endDate) {
            return;
        }

        // Check if end date is after start date
        if (endDate <= startDate) {
            this.showError('Das Enddatum muss nach dem Startdatum liegen.');
            submitBtn.disabled = true;
            return;
        }

        // Check for conflicts with blocked dates
        const hasConflict = this.blockedDates.some(booking => {
            const bookingStart = new Date(booking.startDate);
            const bookingEnd = new Date(booking.endDate);
            
            return (startDate <= bookingEnd && endDate >= bookingStart);
        });

        if (hasConflict) {
            this.showError('Der gewählte Zeitraum überschneidet sich mit bereits gebuchten Terminen. Bitte wählen Sie andere Daten.');
            submitBtn.disabled = true;
            return;
        }

        submitBtn.disabled = false;
    }

    calculatePrice() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        const priceInfoDiv = document.getElementById('priceInfo');

        if (!startDate || !endDate || endDate <= startDate || !this.product) {
            priceInfoDiv.style.display = 'none';
            return;
        }

        const timeDiff = endDate.getTime() - startDate.getTime();
        const dayCount = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const totalPrice = dayCount * this.product.price;

        document.getElementById('dayCount').textContent = dayCount;
        document.getElementById('dailyPrice').textContent = `${this.product.price.toFixed(2)} €`;
        document.getElementById('totalPrice').textContent = `${totalPrice.toFixed(2)} €`;
        
        priceInfoDiv.style.display = 'block';
    }

    async submitRequest() {
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Wird gesendet...';

            const formData = {
                productId: this.productId,
                productTitle: this.product.title,
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value,
                customerName: document.getElementById('customerName').value,
                customerEmail: document.getElementById('customerEmail').value,
                customerPhone: document.getElementById('customerPhone').value,
                message: document.getElementById('message').value,
                totalPrice: this.calculateTotalPrice()
            };

            const response = await fetch('/api/rental-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess('Ihre Anfrage wurde erfolgreich gesendet! Sie erhalten eine Bestätigung per E-Mail, sobald Ihre Anfrage bearbeitet wurde.');
                document.getElementById('anfrageForm').reset();
                document.getElementById('priceInfo').style.display = 'none';
            } else {
                throw new Error(result.error || 'Unbekannter Fehler');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            this.showError('Fehler beim Senden der Anfrage: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    calculateTotalPrice() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        
        if (!startDate || !endDate || !this.product) return 0;
        
        const timeDiff = endDate.getTime() - startDate.getTime();
        const dayCount = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return dayCount * this.product.price;
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Hide success message if visible
        document.getElementById('successMessage').style.display = 'none';
        
        // Scroll to error message
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        // Hide error message if visible
        document.getElementById('errorMessage').style.display = 'none';
        
        // Scroll to success message
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AnfrageManager();
});