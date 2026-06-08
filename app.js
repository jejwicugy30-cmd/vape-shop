// ====== ИНИЦИАЛИЗАЦИЯ И КОНФИГУРАЦИЯ ======

const ADMIN_ID = 7705124098;
const API_URL = 'https://jejwicugy30-cmd.github.io/vape-shop';

let currentUser = null;
let currentChat = null;
let cart = [];
let products = [];
let chats = {};
let users = {};

// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;

function initTelegramApp() {
    if (tg) {
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation();
        
        // Получаем данные пользователя
        const user = tg.initDataUnsafe?.user;
        if (user) {
            currentUser = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name || '',
                username: user.username || '',
                is_admin: user.id === ADMIN_ID
            };

            console.log('User:', currentUser);

            // Если администратор, открываем админ-панель
            if (currentUser.is_admin) {
                window.location.href = 'admin.html';
                return;
            }

            // Загружаем данные для обычного пользователя
            loadAppData();
            registerUser();
        }
    } else {
        // Для локального тестирования
        currentUser = {
            id: 123456789,
            first_name: 'Test',
            is_admin: false
        };
        loadAppData();
    }
}

// ====== ЗАГРУЗКА ДАННЫХ ======

function loadAppData() {
    loadProducts();
    loadCart();
    loadChats();
    renderCatalog();
}

function loadProducts() {
    const defaultProducts = [
        {
            id: 1,
            name: 'Pod System Pro',
            price: 1500,
            category: 'pod',
            stock: 50,
            description: 'Профессиональная pod система',
            image: '🎯'
        },
        {
            id: 2,
            name: 'Жидкость Mango',
            price: 350,
            category: 'liquid',
            stock: 100,
            description: 'Вкусная манго жидкость',
            image: '🥭'
        },
        {
            id: 3,
            name: 'Одноразовый Vape',
            price: 800,
            category: 'disposable',
            stock: 75,
            description: 'Удобный одноразовый вейп',
            image: '💨'
        },
        {
            id: 4,
            name: 'Батарея 21700',
            price: 450,
            category: 'accessories',
            stock: 200,
            description: 'Мощная аккумуляторная батарея',
            image: '🔋'
        },
        {
            id: 5,
            name: 'Жидкость Strawberry',
            price: 350,
            category: 'liquid',
            stock: 120,
            description: 'Клубничная жидкость',
            image: '🍓'
        },
        {
            id: 6,
            name: 'Coils Pack',
            price: 280,
            category: 'accessories',
            stock: 150,
            description: 'Набор спиралей',
            image: '🔌'
        }
    ];

    try {
        const stored = localStorage.getItem('products');
        products = stored ? JSON.parse(stored) : defaultProducts;
    } catch (e) {
        products = defaultProducts;
    }

    localStorage.setItem('products', JSON.stringify(products));
}

function loadCart() {
    try {
        cart = JSON.parse(localStorage.getItem(`cart_${currentUser.id}`) || '[]');
    } catch (e) {
        cart = [];
    }
    updateCartBadge();
}

function loadChats() {
    try {
        chats = JSON.parse(localStorage.getItem('chats') || '{}');
        if (!chats[currentUser.id]) {
            chats[currentUser.id] = {
                user_id: currentUser.id,
                user_name: currentUser.first_name,
                messages: []
            };
        }
    } catch (e) {
        chats[currentUser.id] = {
            user_id: currentUser.id,
            user_name: currentUser.first_name,
            messages: []
        };
    }
    localStorage.setItem('chats', JSON.stringify(chats));
}

function registerUser() {
    try {
        users = JSON.parse(localStorage.getItem('users') || '{}');
    } catch (e) {
        users = {};
    }

    if (!users[currentUser.id]) {
        users[currentUser.id] = {
            id: currentUser.id,
            name: currentUser.first_name,
            title: 'Простой пользователь',
            created_at: new Date().toISOString(),
            purchases: 0,
            total_spent: 0
        };
    }

    localStorage.setItem('users', JSON.stringify(users));
}

// ====== НАВИГАЦИЯ ======

function goToTab(tab) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    let pageId;
    switch (tab) {
        case 'catalog':
            pageId = 'catalog-page';
            navItems[0].classList.add('active');
            break;
        case 'chat':
            pageId = 'chat-page';
            navItems[1].classList.add('active');
            renderChatMessages();
            break;
        case 'cart':
            pageId = 'cart-page';
            navItems[2].classList.add('active');
            renderCart();
            break;
    }

    if (pageId) {
        document.getElementById(pageId).classList.add('active');
    }

    window.scrollTo(0, 0);
}

function goToCheckout() {
    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }

    document.getElementById('home-page').classList.remove('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('checkout-page').classList.add('active');
    renderCheckout();
}

// ====== КАТАЛОГ И ТОВАРЫ ======

function renderCatalog() {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">${product.image}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">${product.price} ₽</div>
            <div class="product-stock">Осталось: ${product.stock}</div>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                Добавить
            </button>
        `;
        container.appendChild(card);
    });
}

function filterByCategory(category) {
    // Обновляем активную кнопку категории
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    const container = document.getElementById('products-container');
    container.innerHTML = '';

    const filtered = category === 'all' 
        ? products 
        : products.filter(p => p.category === category);

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">${product.image}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">${product.price} ₽</div>
            <div class="product-stock">Осталось: ${product.stock}</div>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                Добавить
            </button>
        `;
        container.appendChild(card);
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart();
    updateCartBadge();
    showNotification('Товар добавлен в корзину!');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
    renderCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(p => p.id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        renderCart();
    }
}

function saveCart() {
    localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (total > 0) {
        badge.textContent = total;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// ====== КОРЗИНА ======

function renderCart() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">Корзина пуста</p>';
    } else {
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price * item.quantity} ₽</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                    <div class="qty-display">${item.quantity}</div>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">Удалить</button>
                </div>
            `;
            container.appendChild(cartItem);
        });
    }

    updateCartSummary();
}

function updateCartSummary() {
    const totalSum = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    document.getElementById('total-sum').textContent = `${totalSum} ₽`;
    document.getElementById('total-items').textContent = totalItems;
}

// ====== ОФОРМЛЕНИЕ ЗАКАЗА ======

function renderCheckout() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderList = document.getElementById('order-items-list');
    orderList.innerHTML = '';
    cart.forEach(item => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <span>${item.name} × ${item.quantity}</span>
            <span>${item.price * item.quantity} ₽</span>
        `;
        orderList.appendChild(orderItem);
    });

    document.getElementById('checkout-subtotal').textContent = `${subtotal} ₽`;
    document.getElementById('checkout-total').textContent = `${subtotal} ₽`;

    // Очищаем форму
    document.getElementById('checkout-form').reset();
}

function updateDeliveryPrice() {
    const method = document.getElementById('delivery-method').value;
    const deliveryRow = document.getElementById('delivery-cost-row');

    if (method === 'delivery') {
        deliveryRow.style.display = 'flex';
    } else {
        deliveryRow.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitOrder();
        });
    }
});

function submitOrder() {
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const method = document.getElementById('delivery-method').value;

    if (!name || !phone) {
        alert('Заполните все поля!');
        return;
    }

    const order = {
        user_id: currentUser.id,
        user_name: name,
        phone: phone,
        delivery_method: method,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        created_at: new Date().toISOString()
    };

    try {
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));

        // Обновляем статистику пользователя
        users[currentUser.id].purchases += 1;
        users[currentUser.id].total_spent += order.total;
        if (users[currentUser.id].purchases >= 5) {
            users[currentUser.id].title = 'Частый покупатель';
        }
        localStorage.setItem('users', JSON.stringify(users));

        // Очищаем корзину
        cart = [];
        saveCart();
        updateCartBadge();

        alert('Заказ успешно оформлен! Менеджер свяжется с вами в ближайшее время.');
        goToTab('catalog');
    } catch (e) {
        alert('Ошибка при оформлении заказа');
        console.error(e);
    }
}

// ====== ЧАТ ======

function renderChatMessages() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';

    const userChat = chats[currentUser.id];
    if (!userChat || !userChat.messages) {
        userChat.messages = [];
    }

    userChat.messages.forEach(msg => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${msg.sender === 'user' ? 'user' : 'admin'}`;
        messageEl.innerHTML = `
            <div class="message-content">
                ${msg.text}
                <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}</div>
            </div>
        `;
        container.appendChild(messageEl);
    });

    container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();

    if (!text) return;

    const userChat = chats[currentUser.id];
    if (!userChat.messages) {
        userChat.messages = [];
    }

    userChat.messages.push({
        sender: 'user',
        text: text,
        timestamp: new Date().toISOString()
    });

    chats[currentUser.id] = userChat;
    localStorage.setItem('chats', JSON.stringify(chats));

    input.value = '';
    renderChatMessages();
    showNotification('Сообщение отправлено!');
}

// ====== УТИЛИТЫ ======

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #8B5CF6, #06B6D4);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 5000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ====== ИНИЦИАЛИЗАЦИЯ ======

window.addEventListener('load', initTelegramApp);
