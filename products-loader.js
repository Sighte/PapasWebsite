// Products Loader for Category Pages
class ProductsLoader {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.categories = {
            'anhaenger': 'Anhänger',
            'party-events': 'Party & Event Artikel',
            'bauarbeiten': 'Baugeräte & Werkzeuge'
        };
        this.init();
    }

    init() {
        // Check if we're on a category page
        const categorySection = document.querySelector('.products-section');
        if (categorySection) {
            this.loadCategoryProducts();
        }
        
        // Update homepage category counts if we're on homepage
        this.updateHomepageCategoryCounts();
    }

    async loadCategoryProducts() {
        const category = this.getCurrentCategory();
        if (!category) return;

        const productsContainer = document.querySelector('.products-placeholder');
        if (!productsContainer) return;

        try {
            // Show loading state
            productsContainer.innerHTML = `
                <div class="loading-products">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Lade Artikel...</p>
                </div>
            `;

            const response = await fetch(`${this.apiUrl}/articles/category/${category}`);
            if (response.ok) {
                const articles = await response.json();
                this.displayProducts(articles, productsContainer);
            } else {
                this.showNoProducts(productsContainer);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNoProducts(productsContainer);
        }
    }

    getCurrentCategory() {
        const path = window.location.pathname;
        if (path.includes('anhaenger')) return 'anhaenger';
        if (path.includes('party-events')) return 'party-events';
        if (path.includes('bauarbeiten')) return 'bauarbeiten';
        return null;
    }

    displayProducts(articles, container) {
        if (articles.length === 0) {
            this.showNoProducts(container);
            return;
        }

        const category = this.getCurrentCategory();
        const counts = this.calculateSingleCategoryCounts(articles);

        // Update section title with counts
        const sectionTitle = document.querySelector('.products-section h2');
        if (sectionTitle) {
            const categoryName = this.getCategoryName(category);
            let titleText = `Unsere ${categoryName}`;
            
            if (counts.total > 0) {
                if (counts.available === counts.total) {
                    titleText += ` (${counts.total} verfügbar)`;
                } else {
                    titleText += ` (${counts.available} von ${counts.total} verfügbar)`;
                }
            } else {
                titleText += ' (keine verfügbar)';
            }
            
            sectionTitle.textContent = titleText;
        }

        // Update category page stats
        this.updateCategoryPageStats(category, counts);

        // Create products grid
        container.innerHTML = `
            <div class="products-grid">
                ${articles.map(article => this.createProductCard(article)).join('')}
            </div>
        `;

        // Add event listeners to request buttons
        this.addRequestButtonListeners();
    }

    createProductCard(article) {
        const featuresHTML = article.features && article.features.length > 0 
            ? `<div class="product-features">
                ${article.features.slice(0, 3).map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
               </div>`
            : '';

        const imageHTML = article.imageUrl 
            ? `<div class="product-image">
                <img src="${article.imageUrl}" alt="${article.title}" onerror="this.parentElement.style.display='none'">
               </div>`
            : `<div class="product-image product-image-placeholder">
                <i class="fas fa-image"></i>
               </div>`;

        const availabilityClass = article.available ? 'available' : 'unavailable';
        const availabilityText = article.available ? 'Verfügbar' : 'Nicht verfügbar';

        return `
            <div class="product-card ${availabilityClass}">
                ${imageHTML}
                <div class="product-info">
                    <h3 class="product-title">${article.title}</h3>
                    <p class="product-description">${article.description}</p>
                    ${featuresHTML}
                    <div class="product-footer">
                        <div class="product-price">
                            <span class="price-amount">${article.price}€</span>
                            <span class="price-period">pro Tag</span>
                        </div>
                        <div class="product-availability ${availabilityClass}">
                            <i class="fas ${article.available ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            ${availabilityText}
                        </div>
                    </div>
                    <button class="btn-primary product-btn ${!article.available ? 'disabled' : ''}" 
                            ${!article.available ? 'disabled' : ''}
                            data-product-id="${article.id}">
                        <i class="fas fa-envelope"></i>
                        ${article.available ? 'Anfrage senden' : 'Nicht verfügbar'}
                    </button>
                </div>
            </div>
        `;
    }

    showNoProducts(container) {
        container.innerHTML = `
            <div class="placeholder-content">
                <i class="fas fa-box-open placeholder-icon"></i>
                <h3>Artikel werden bald hinzugefügt</h3>
                <p>Unsere Artikel werden in Kürze hier verfügbar sein. Kontaktieren Sie uns gerne für aktuelle Verfügbarkeiten.</p>
                <button class="btn-primary">Projekt besprechen</button>
            </div>
        `;
    }

    getCategoryName(category) {
        const categories = {
            'anhaenger': 'Anhänger',
            'party-events': 'Party & Event Artikel',
            'bauarbeiten': 'Baugeräte & Werkzeuge'
        };
        return categories[category] || 'Artikel';
    }

    addRequestButtonListeners() {
        const requestButtons = document.querySelectorAll('.product-btn:not(.disabled)');
        requestButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.product-btn').getAttribute('data-product-id');
                if (productId) {
                    // Redirect to request page with product ID
                    window.location.href = `anfrage.html?product=${productId}`;
                }
            });
        });
    }

    // Article counting functionality
    async updateHomepageCategoryCounts() {
        // Check if we're on the homepage
        if (!document.querySelector('.categories-grid')) return;

        try {
            const response = await fetch(`${this.apiUrl}/articles`);
            if (!response.ok) return;

            const articles = await response.json();
            const categoryCounts = this.calculateCategoryCounts(articles);

            // Update each category card
            Object.keys(this.categories).forEach(categoryKey => {
                this.updateCategoryCard(categoryKey, categoryCounts[categoryKey] || { available: 0, total: 0 });
            });
        } catch (error) {
            console.error('Error updating homepage category counts:', error);
        }
    }

    calculateCategoryCounts(articles) {
        const counts = {};
        
        Object.keys(this.categories).forEach(category => {
            const categoryArticles = articles.filter(article => article.category === category);
            const availableArticles = categoryArticles.filter(article => article.available);
            
            counts[category] = {
                available: availableArticles.length,
                total: categoryArticles.length
            };
        });

        return counts;
    }

    calculateSingleCategoryCounts(articles) {
        const availableArticles = articles.filter(article => article.available);
        return {
            available: availableArticles.length,
            total: articles.length
        };
    }

    updateCategoryCard(categoryKey, counts) {
        const categoryCard = document.querySelector(`a[href="${categoryKey}.html"] .category-card`);
        if (!categoryCard) return;

        const itemCountElement = categoryCard.querySelector('.item-count');
        if (!itemCountElement) return;

        let displayText;
        if (counts.total === 0) {
            displayText = 'Keine Artikel verfügbar';
        } else if (counts.available === counts.total) {
            displayText = `${counts.total} Artikel verfügbar`;
        } else {
            displayText = `${counts.available} von ${counts.total} Artikeln verfügbar`;
        }

        itemCountElement.textContent = displayText;

        // Add visual indicator for availability
        itemCountElement.className = 'item-count';
        if (counts.available === 0) {
            itemCountElement.classList.add('no-availability');
        } else if (counts.available < counts.total) {
            itemCountElement.classList.add('partial-availability');
        } else {
            itemCountElement.classList.add('full-availability');
        }
    }

    updateCategoryPageStats(category, counts) {
        const statElement = document.querySelector('.category-stats .stat:first-child');
        if (!statElement) return;

        const statNumber = statElement.querySelector('.stat-number');
        const statLabel = statElement.querySelector('.stat-label');
        
        if (!statNumber || !statLabel) return;

        if (counts.total === 0) {
            statNumber.textContent = '0';
            statLabel.textContent = 'Artikel verfügbar';
        } else if (counts.available === counts.total) {
            statNumber.textContent = counts.total.toString();
            statLabel.textContent = 'Artikel verfügbar';
        } else {
            statNumber.textContent = `${counts.available}/${counts.total}`;
            statLabel.textContent = 'Artikel verfügbar';
        }

        // Add availability class for styling
        statElement.className = 'stat';
        if (counts.available === 0) {
            statElement.classList.add('no-availability');
        } else if (counts.available < counts.total) {
            statElement.classList.add('partial-availability');
        } else {
            statElement.classList.add('full-availability');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProductsLoader();
});