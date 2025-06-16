require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const ARTICLES_FILE = path.join(__dirname, 'articles.json');
const RENTAL_REQUESTS_FILE = path.join(__dirname, 'rental-requests.json');
const CONFIRMED_RENTALS_FILE = path.join(__dirname, 'mietdaten.json');

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // Sie können dies später ändern
    auth: {
        user: process.env.EMAIL_USER || 'vermietung@simon-trapp.de', // Ihre E-Mail
        pass: process.env.EMAIL_PASS || 'your-app-password'          // Ihr App-Passwort
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// Initialize files if they don't exist
async function initializeFiles() {
    try {
        await fs.access(ARTICLES_FILE);
    } catch (error) {
        await fs.writeFile(ARTICLES_FILE, JSON.stringify([], null, 2));
        console.log('Articles file created');
    }
    
    try {
        await fs.access(RENTAL_REQUESTS_FILE);
    } catch (error) {
        await fs.writeFile(RENTAL_REQUESTS_FILE, JSON.stringify([], null, 2));
        console.log('Rental requests file created');
    }
    
    try {
        await fs.access(CONFIRMED_RENTALS_FILE);
    } catch (error) {
        await fs.writeFile(CONFIRMED_RENTALS_FILE, JSON.stringify([], null, 2));
        console.log('Confirmed rentals file created');
    }
}

// Helper function to read articles
async function readArticles() {
    try {
        const data = await fs.readFile(ARTICLES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading articles:', error);
        return [];
    }
}

// Helper function to write articles
async function writeArticles(articles) {
    try {
        await fs.writeFile(ARTICLES_FILE, JSON.stringify(articles, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing articles:', error);
        return false;
    }
}

// Helper functions for rental requests
async function readRentalRequests() {
    try {
        const data = await fs.readFile(RENTAL_REQUESTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading rental requests:', error);
        return [];
    }
}

async function writeRentalRequests(requests) {
    try {
        await fs.writeFile(RENTAL_REQUESTS_FILE, JSON.stringify(requests, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing rental requests:', error);
        return false;
    }
}

// Helper functions for confirmed rentals
async function readConfirmedRentals() {
    try {
        const data = await fs.readFile(CONFIRMED_RENTALS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading confirmed rentals:', error);
        return [];
    }
}

async function writeConfirmedRentals(rentals) {
    try {
        await fs.writeFile(CONFIRMED_RENTALS_FILE, JSON.stringify(rentals, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing confirmed rentals:', error);
        return false;
    }
}

// Routes

// Get all articles
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await readArticles();
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read articles' });
    }
});

// Get articles by category
app.get('/api/articles/category/:category', async (req, res) => {
    try {
        const articles = await readArticles();
        const categoryArticles = articles.filter(article => article.category === req.params.category);
        res.json(categoryArticles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read articles' });
    }
});

// Get single article
app.get('/api/articles/:id', async (req, res) => {
    try {
        const articles = await readArticles();
        const article = articles.find(a => a.id === req.params.id);
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        res.json(article);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read article' });
    }
});

// Create new article
app.post('/api/articles', async (req, res) => {
    try {
        const { title, category, description, price, imageUrl, features, available } = req.body;
        
        // Validation
        if (!title || !category || !description || price === undefined) {
            return res.status(400).json({ error: 'Missing required fields: title, category, description, price' });
        }

        const articles = await readArticles();
        
        const newArticle = {
            id: uuidv4(),
            title: title.trim(),
            category: category.trim(),
            description: description.trim(),
            price: parseFloat(price),
            imageUrl: imageUrl ? imageUrl.trim() : null,
            features: features || [],
            available: available !== undefined ? available : true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        articles.push(newArticle);
        
        const success = await writeArticles(articles);
        if (success) {
            res.status(201).json(newArticle);
        } else {
            res.status(500).json({ error: 'Failed to save article' });
        }
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update article
app.put('/api/articles/:id', async (req, res) => {
    try {
        const { title, category, description, price, imageUrl, features, available } = req.body;
        
        // Validation
        if (!title || !category || !description || price === undefined) {
            return res.status(400).json({ error: 'Missing required fields: title, category, description, price' });
        }

        const articles = await readArticles();
        const articleIndex = articles.findIndex(a => a.id === req.params.id);
        
        if (articleIndex === -1) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // Update article
        articles[articleIndex] = {
            ...articles[articleIndex],
            title: title.trim(),
            category: category.trim(),
            description: description.trim(),
            price: parseFloat(price),
            imageUrl: imageUrl ? imageUrl.trim() : null,
            features: features || [],
            available: available !== undefined ? available : true,
            updatedAt: new Date().toISOString()
        };

        const success = await writeArticles(articles);
        if (success) {
            res.json(articles[articleIndex]);
        } else {
            res.status(500).json({ error: 'Failed to update article' });
        }
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete article
app.delete('/api/articles/:id', async (req, res) => {
    try {
        const articles = await readArticles();
        const articleIndex = articles.findIndex(a => a.id === req.params.id);
        
        if (articleIndex === -1) {
            return res.status(404).json({ error: 'Article not found' });
        }

        articles.splice(articleIndex, 1);
        
        const success = await writeArticles(articles);
        if (success) {
            res.json({ message: 'Article deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete article' });
        }
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Rental request endpoints

// Create new rental request
app.post('/api/rental-requests', async (req, res) => {
    try {
        const { 
            productId, 
            productTitle, 
            startDate, 
            endDate, 
            customerName, 
            customerEmail, 
            customerPhone, 
            message, 
            totalPrice 
        } = req.body;
        
        // Validation
        if (!productId || !startDate || !endDate || !customerName || !customerEmail) {
            return res.status(400).json({ 
                error: 'Pflichtfelder: Produkt, Startdatum, Enddatum, Name und E-Mail' 
            });
        }

        // Check if dates are valid
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end <= start) {
            return res.status(400).json({ 
                error: 'Enddatum muss nach dem Startdatum liegen' 
            });
        }

        // Check for conflicts with confirmed rentals
        const confirmedRentals = await readConfirmedRentals();
        const hasConflict = confirmedRentals.some(rental => {
            if (rental.productId !== productId) return false;
            const rentalStart = new Date(rental.startDate);
            const rentalEnd = new Date(rental.endDate);
            return (start <= rentalEnd && end >= rentalStart);
        });

        if (hasConflict) {
            return res.status(400).json({ 
                error: 'Der gewählte Zeitraum ist bereits gebucht' 
            });
        }

        const requests = await readRentalRequests();
        
        const newRequest = {
            id: uuidv4(),
            productId,
            productTitle,
            startDate,
            endDate,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim(),
            customerPhone: customerPhone ? customerPhone.trim() : null,
            message: message ? message.trim() : null,
            totalPrice: parseFloat(totalPrice) || 0,
            status: 'pending', // pending, approved, rejected
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        requests.push(newRequest);
        
        const success = await writeRentalRequests(requests);
        if (success) {
            // Send notification email to admin
            try {
                const mailOptions = {
                    from: process.env.EMAIL_USER || 'your-email@gmail.com',
                    to: 'vermietung@simon-trapp.de',
                    subject: `Neue Mietanfrage: ${productTitle}`,
                    html: `
                        <h2>Neue Mietanfrage</h2>
                        <p><strong>Produkt:</strong> ${productTitle}</p>
                        <p><strong>Zeitraum:</strong> ${new Date(startDate).toLocaleDateString('de-DE')} - ${new Date(endDate).toLocaleDateString('de-DE')}</p>
                        <p><strong>Kunde:</strong> ${customerName}</p>
                        <p><strong>E-Mail:</strong> ${customerEmail}</p>
                        ${customerPhone ? `<p><strong>Telefon:</strong> ${customerPhone}</p>` : ''}
                        <p><strong>Gesamtpreis:</strong> ${totalPrice.toFixed(2)} €</p>
                        ${message ? `<p><strong>Nachricht:</strong><br>${message.replace(/\n/g, '<br>')}</p>` : ''}
                        <hr>
                        <p>Bitte bearbeiten Sie die Anfrage im Admin-Panel: <a href="http://localhost:${PORT}/admin">Admin-Panel öffnen</a></p>
                        <p><small>Anfrage-ID: ${newRequest.id}</small></p>
                    `
                };

                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error('Error sending notification email:', emailError);
                // Continue even if email fails
            }

            res.status(201).json({ 
                success: true, 
                message: 'Anfrage erfolgreich gesendet',
                requestId: newRequest.id 
            });
        } else {
            res.status(500).json({ error: 'Fehler beim Speichern der Anfrage' });
        }
    } catch (error) {
        console.error('Error creating rental request:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// Get all rental requests (admin only)
app.get('/api/rental-requests', async (req, res) => {
    try {
        const requests = await readRentalRequests();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Laden der Anfragen' });
    }
});

// Update rental request status (admin only)
app.put('/api/rental-requests/:id', async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Ungültiger Status' });
        }

        const requests = await readRentalRequests();
        const requestIndex = requests.findIndex(r => r.id === req.params.id);
        
        if (requestIndex === -1) {
            return res.status(404).json({ error: 'Anfrage nicht gefunden' });
        }

        const request = requests[requestIndex];
        request.status = status;
        request.adminNote = adminNote || null;
        request.updatedAt = new Date().toISOString();

        // If approved, add to confirmed rentals
        if (status === 'approved') {
            const confirmedRentals = await readConfirmedRentals();
            const confirmedRental = {
                id: uuidv4(),
                requestId: request.id,
                productId: request.productId,
                productTitle: request.productTitle,
                startDate: request.startDate,
                endDate: request.endDate,
                customerName: request.customerName,
                customerEmail: request.customerEmail,
                totalPrice: request.totalPrice,
                status: 'confirmed',
                createdAt: new Date().toISOString()
            };
            
            confirmedRentals.push(confirmedRental);
            await writeConfirmedRentals(confirmedRentals);
        }

        const success = await writeRentalRequests(requests);
        if (success) {
            // Send confirmation email to customer
            try {
                const statusText = status === 'approved' ? 'genehmigt' : 
                                 status === 'rejected' ? 'abgelehnt' : 'in Bearbeitung';
                
                const mailOptions = {
                    from: process.env.EMAIL_USER || 'your-email@gmail.com',
                    to: request.customerEmail,
                    subject: `Ihre Mietanfrage wurde ${statusText}`,
                    html: `
                        <h2>Status Ihrer Mietanfrage</h2>
                        <p>Liebe/r ${request.customerName},</p>
                        <p>Ihre Anfrage für <strong>${request.productTitle}</strong> wurde <strong>${statusText}</strong>.</p>
                        <p><strong>Zeitraum:</strong> ${new Date(request.startDate).toLocaleDateString('de-DE')} - ${new Date(request.endDate).toLocaleDateString('de-DE')}</p>
                        ${status === 'approved' ? `
                            <p style="color: green;"><strong>✅ Ihre Buchung ist bestätigt!</strong></p>
                            <p>Wir werden uns in Kürze mit Ihnen in Verbindung setzen, um die Details zu besprechen.</p>
                        ` : status === 'rejected' ? `
                            <p style="color: red;"><strong>❌ Leider konnten wir Ihre Anfrage nicht genehmigen.</strong></p>
                            ${adminNote ? `<p><strong>Grund:</strong> ${adminNote}</p>` : ''}
                        ` : ''}
                        <hr>
                        <p>Bei Fragen kontaktieren Sie uns unter vermietung@simon-trapp.de</p>
                        <p>Mit freundlichen Grüßen,<br>Ihr Mietservice Trapp Team</p>
                    `
                };

                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error('Error sending confirmation email:', emailError);
            }

            res.json(request);
        } else {
            res.status(500).json({ error: 'Fehler beim Aktualisieren der Anfrage' });
        }
    } catch (error) {
        console.error('Error updating rental request:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// Get confirmed rentals (public endpoint for calendar blocking)
app.get('/mietdaten.json', async (req, res) => {
    try {
        const confirmedRentals = await readConfirmedRentals();
        res.json(confirmedRentals);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Laden der Mietdaten' });
    }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        
        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, E-Mail und Nachricht sind Pflichtfelder' });
        }

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: 'vermietung@simon-trapp.de',
            subject: `Neue Kontaktanfrage: ${subject || 'Allgemeine Anfrage'}`,
            html: `
                <h2>Neue Kontaktanfrage von der Website</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>E-Mail:</strong> ${email}</p>
                ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
                <p><strong>Betreff:</strong> ${subject || 'Nicht angegeben'}</p>
                <p><strong>Nachricht:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <hr>
                <p><small>Gesendet am: ${new Date().toLocaleString('de-DE')}</small></p>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);
        
        res.json({ success: true, message: 'Nachricht erfolgreich gesendet' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Fehler beim Senden der E-Mail' });
    }
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
    try {
        await initializeFiles();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Admin panel available at http://localhost:${PORT}/admin`);
            console.log(`API endpoints available at http://localhost:${PORT}/api/articles`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();