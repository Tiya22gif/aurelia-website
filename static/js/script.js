// Global Cart logic
let cart = JSON.parse(localStorage.getItem('aurelia_cart')) || [];

function saveCart() {
    localStorage.setItem('aurelia_cart', JSON.stringify(cart));
    updateCartCount();
    renderCartDrawer();
    if (window.location.pathname.includes('checkout')) {
        renderCheckout();
    }
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    document.getElementById('cart-overlay').classList.add('active');
    document.getElementById('cart-drawer').classList.add('active');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

function updateCartCount() {
    const counts = document.querySelectorAll('.cart-count');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    counts.forEach(c => c.textContent = total);
}

function renderCartDrawer() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-price');
    if (!container) return;

    container.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity}</div>
            </div>
            <button class="btn-remove-item" onclick="removeFromCart(${item.id})">Remove</button>
        `;
        container.appendChild(div);
    });

    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

// Fetch Products
async function loadProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    try {
        const response = await fetch('/products');
        const products = await response.json();
        
        grid.innerHTML = '';
        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-card fade-in';
            div.innerHTML = `
                <div style="width:100%; height:300px; background:#f5f5f5; display:flex; align-items:center; justify-content:center; margin-bottom:1rem; color:#888;">
                    <img src="${p.imageURL}" alt="${p.name}" style="object-fit:cover; width:100%; height:100%;" onerror="this.style.display='none'">
                </div>
                <h3 class="product-title">${p.name}</h3>
                <div class="product-price">$${p.price.toFixed(2)}</div>
                <button class="btn-add-cart" onclick='addToCart(${JSON.stringify(p)})'>Add to Cart</button>
            `;
            grid.appendChild(div);
        });

        // Re-observe new elements
        observeFadeIns();
    } catch (e) {
        console.error('Error fetching products:', e);
    }
}

// Checkout Logic
function renderCheckout() {
    const container = document.getElementById('checkout-items');
    const totalEl = document.getElementById('checkout-total');
    if (!container) return;

    container.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.marginBottom = '1rem';
        div.innerHTML = `<span>${item.name} (x${item.quantity})</span><span>$${(item.price * item.quantity).toFixed(2)}</span>`;
        container.appendChild(div);
    });

    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

// Animations - Intersection Observer
function observeFadeIns() {
    const faders = document.querySelectorAll('.fade-in');
    const appearOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });
}

// Initialize global event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Header Scroll Effect
    const header = document.querySelector('.site-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    updateCartCount();
    renderCartDrawer();
    observeFadeIns();

    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        loadProducts();
    }
    
    if (window.location.pathname.includes('checkout')) {
        renderCheckout();
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
                
                const btn = checkoutForm.querySelector('button');
                btn.disabled = true;
                btn.textContent = 'Processing...';

                try {
                    const res = await fetch('/process-payment', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ cart, total, email })
                    });
                    const data = await res.json();
                    
                    const msgDiv = document.getElementById('checkout-messages');
                    msgDiv.textContent = data.status;
                    msgDiv.className = 'success';
                    
                    cart = [];
                    saveCart();
                } catch(err) {
                    console.error(err);
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Complete Order';
                }
            });
        }
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const inquiry = document.getElementById('inquiry').value;
            
            try {
                const res = await fetch('/contact-submit', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ name, email, inquiry })
                });
                const data = await res.json();
                alert(data.message);
                contactForm.reset();
            } catch(err) {
                console.error(err);
            }
        });
    }

    // Cart Drawer Toggle
    const cartToggles = document.querySelectorAll('.cart-toggle');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCart = document.getElementById('close-cart');

    if (cartToggles && cartDrawer && cartOverlay && closeCart) {
        cartToggles.forEach(t => t.addEventListener('click', (e) => {
            e.preventDefault();
            cartOverlay.classList.add('active');
            cartDrawer.classList.add('active');
        }));

        closeCart.addEventListener('click', () => {
            cartOverlay.classList.remove('active');
            cartDrawer.classList.remove('active');
        });

        cartOverlay.addEventListener('click', () => {
            cartOverlay.classList.remove('active');
            cartDrawer.classList.remove('active');
        });
    }

    // Chat UI Toggle and Logic
    const chatFab = document.getElementById('chat-fab');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages-container');

    if (chatFab && chatWindow) {
        chatFab.addEventListener('click', () => {
            chatWindow.classList.add('active');
        });
        
        closeChat.addEventListener('click', () => {
            chatWindow.classList.remove('active');
        });

        const appendMessage = (text, sender) => {
            const div = document.createElement('div');
            div.className = `message ${sender}`;
            div.textContent = text;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };

        const sendMessage = async () => {
            const text = chatInput.value.trim();
            if (!text) return;
            
            appendMessage(text, 'user');
            chatInput.value = '';

            try {
                const res = await fetch('/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ message: text })
                });
                const data = await res.json();
                appendMessage(data.response, 'bot');
            } catch (err) {
                appendMessage('Sorry, I am currently unavailable.', 'bot');
            }
        };

        chatSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});
