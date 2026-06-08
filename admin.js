const ADMIN_ID = 7705124098;
let adminProducts = [];
let adminChats = {};
let adminUsers = {};
let currentChatUserId = null;

function initAdminPanel() {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        const user = tg.initDataUnsafe?.user;
        if (!user || user.id !== ADMIN_ID) {
            alert('У вас нет доступа к админ-панели');
            window.location.href = 'index.html';
            return;
        }
    }
    loadAdminData();
    switchAdminTab('products');
}

function loadAdminData() {
    loadAdminProducts();
    loadAdminChats();
    loadAdminUsers();
    renderProductsList();
}

function loadAdminProducts() {
    try {
        adminProducts = JSON.parse(localStorage.getItem('products') || '[]');
    } catch (e) {
        adminProducts = [];
    }
}

function loadAdminChats() {
    try {
        adminChats = JSON.parse(localStorage.getItem('chats') || '{}');
    } catch (e) {
        adminChats = {};
    }
}

function loadAdminUsers() {
    try {
        adminUsers = JSON.parse(localStorage.getItem('users') || '{}');
    } catch (e) {
        adminUsers = {};
    }
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item-admin').forEach(item => item.classList.remove('active'));
    switch (tab) {
        case 'products':
            document.getElementById('products-tab').classList.add('active');
            document.querySelectorAll('.nav-item-admin')[0].classList.add('active');
            renderProductsList();
            break;
        case 'chats':
            document.getElementById('chats-tab').classList.add('active');
            document.querySelectorAll('.nav-item-admin')[1].classList.add('active');
            renderChatsList();
            break;
        case 'users':
            document.getElementById('users-tab').classList.add('active');
            document.querySelectorAll('.nav-item-admin')[2].classList.add('active');
            renderUsersList();
            break;
    }
}

function renderProductsList() {
    const container = document.getElementById('products-list');
    container.innerHTML = '';
    if (adminProducts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">Товаров нет</p>';
        return;
    }
    adminProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'admin-product-card';
        card.innerHTML = `<h4>${product.name}</h4><p><strong>Цена:</strong> ${product.price} ₽</p><p><strong>Категория:</strong> ${product.category}</p><p><strong>Количество:</strong> ${product.stock}</p><p><strong>Описание:</strong> ${product.description || 'Нет'}</p><div class="admin-product-actions"><button class="btn-edit" onclick="editProduct(${product.id})">Редактировать</button><button class="btn-delete" onclick="deleteProduct(${product.id})">Удалить</button></div>`;
        container.appendChild(card);
    });
}

function openAddProductModal() {
    document.getElementById('modal-title').textContent = 'Добавить товар';
    document.getElementById('product-form').reset();
    document.getElementById('product-form').dataset.productId = '';
    openModal('product-modal');
}

function editProduct(productId) {
    const product = adminProducts.find(p => p.id === productId);
    if (!product) return;
    document.getElementById('modal-title').textContent = 'Редактировать товар';
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-image').value = product.image || '';
    document.getElementById('product-form').dataset.productId = productId;
    openModal('product-modal');
}

function deleteProduct(productId) {
    if (confirm('Вы уверены?')) {
        adminProducts = adminProducts.filter(p => p.id !== productId);
        saveAdminProducts();
        renderProductsList();
    }
}

function saveAdminProducts() {
    localStorage.setItem('products', JSON.stringify(adminProducts));
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('product-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProduct();
        });
    }
});

function saveProduct() {
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value;
    const stock = parseInt(document.getElementById('product-stock').value);
    const description = document.getElementById('product-description').value;
    const image = document.getElementById('product-image').value || '📦';
    const productId = document.getElementById('product-form').dataset.productId;

    if (!name || !price || !category || !stock) {
        alert('Заполните все обязательные поля');
        return;
    }

    if (productId) {
        const product = adminProducts.find(p => p.id == productId);
        if (product) {
            product.name = name;
            product.price = price;
            product.category = category;
            product.stock = stock;
            product.description = description;
            product.image = image;
        }
    } else {
        const newId = Math.max(...adminProducts.map(p => p.id), 0) + 1;
        adminProducts.push({ id: newId, name, price, category, stock, description, image });
    }

    saveAdminProducts();
    closeModal('product-modal');
    renderProductsList();
    alert('Товар сохранен!');
}

function closeProductModal() {
    closeModal('product-modal');
}

function renderChatsList() {
    loadAdminChats();
    const container = document.getElementById('chats-list');
    container.innerHTML = '';
    if (Object.keys(adminChats).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">Чатов нет</p>';
        return;
    }
    Object.entries(adminChats).forEach(([userId, chat]) => {
        const lastMessage = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : 'Нет сообщений';
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${currentChatUserId == userId ? 'active' : ''}`;
        chatItem.onclick = () => openChat(userId);
        chatItem.innerHTML = `<div class="chat-item-name">${chat.user_name}</div><div class="chat-item-preview">${lastMessage.substring(0, 50)}</div>`;
        container.appendChild(chatItem);
    });
}

function openChat(userId) {
    currentChatUserId = userId;
    renderChatsList();
    renderAdminChatMessages(userId);
    document.querySelector('.chat-window-empty').style.display = 'none';
    document.getElementById('admin-chat-messages').style.display = 'flex';
    document.getElementById('admin-chat-input-area').style.display = 'flex';
}

function renderAdminChatMessages(userId) {
    const chat = adminChats[userId];
    const container = document.getElementById('admin-chat-messages');
    container.innerHTML = '';
    if (!chat || !chat.messages) return;
    chat.messages.forEach(msg => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${msg.sender === 'user' ? 'user' : 'admin'}`;
        messageEl.innerHTML = `<div class="message-content">${msg.text}<div class="message-time">${new Date(msg.timestamp).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}</div></div>`;
        container.appendChild(messageEl);
    });
    container.scrollTop = container.scrollHeight;
}

function sendAdminChatMessage() {
    if (!currentChatUserId) return;
    const input = document.getElementById('admin-chat-input');
    const text = input.value.trim();
    if (!text) return;
    const chat = adminChats[currentChatUserId];
    if (!chat.messages) { chat.messages = []; }
    chat.messages.push({ sender: 'admin', text: text, timestamp: new Date().toISOString() });
    adminChats[currentChatUserId] = chat;
    localStorage.setItem('chats', JSON.stringify(adminChats));
    input.value = '';
    renderAdminChatMessages(currentChatUserId);
}

function renderUsersList() {
    loadAdminUsers();
    const container = document.getElementById('users-list');
    container.innerHTML = '';
    if (Object.keys(adminUsers).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">Пользователей нет</p>';
        return;
    }
    Object.entries(adminUsers).forEach(([userId, user]) => {
        const card = document.createElement('div');
        card.className = 'admin-user-card';
        card.innerHTML = `<div class="user-id">ID: ${user.id}</div><h4>${user.name}</h4><div class="user-title">${user.title}</div><div class="user-stats"><p><strong>Покупок:</strong> ${user.purchases}</p><p><strong>Потрачено:</strong> ${user.total_spent} ₽</p><p><strong>Присоединился:</strong> ${new Date(user.created_at).toLocaleDateString('ru-RU')}</p></div>`;
        container.appendChild(card);
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

window.addEventListener('load', initAdminPanel);