import logging
import os
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters
from telegram.constants import ParseMode
import json
from datetime import datetime

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Ваш токен бота
BOT_TOKEN = 'ВАШ_ТОКЕН_БОТА_ЗДЕСЬ'

# URL веб-приложения
WEB_APP_URL = 'https://jejwicugy30-cmd.github.io/vape-shop/index.html'
ADMIN_WEB_APP_URL = 'https://jejwicugy30-cmd.github.io/vape-shop/admin.html'

# ID администратора
ADMIN_ID = 7705124098

# Файл для хранения пользователей
USERS_FILE = 'users.json'
ORDERS_FILE = 'orders.json'

def load_users():
    """Загрузить пользователей из файла"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_users(users):
    """Сохранить пользователей в файл"""
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def load_orders():
    """Загрузить заказы из файла"""
    if os.path.exists(ORDERS_FILE):
        try:
            with open(ORDERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []

def save_orders(orders):
    """Сохранить заказы в файл"""
    with open(ORDERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(orders, f, ensure_ascii=False, indent=2)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик команды /start"""
    
    user = update.effective_user
    users = load_users()
    
    # Регистрируем пользователя
    if str(user.id) not in users:
        users[str(user.id)] = {
            'id': user.id,
            'username': user.username or 'Нет',
            'first_name': user.first_name,
            'last_name': user.last_name or '',
            'registered_at': datetime.now().isoformat(),
            'purchases': 0
        }
        save_users(users)
    
    # Создаем кнопку для открытия веб-приложения
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            "🛍️ Открыть магазин",
            web_app=WebAppInfo(url=WEB_APP_URL)
        )]
    ])
    
    # Если это администратор, добавляем кнопку админ-панели
    if user.id == ADMIN_ID:
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(
                "🛍️ Открыть магазин",
                web_app=WebAppInfo(url=WEB_APP_URL)
            )],
            [InlineKeyboardButton(
                "⚙️ Админ-панель",
                web_app=WebAppInfo(url=ADMIN_WEB_APP_URL)
            )]
        ])
    
    welcome_text = f"""
🎉 Добро пожаловать в Vape Shop, {user.first_name}!

Здесь вы найдете:
✨ Огромный выбор вейпов и аксессуаров
💰 Лучшие цены на рынке
🚀 Быстрое оформление заказов
💬 Общение с менеджером в реальном времени

Нажмите на кнопку ниже, чтобы начать покупки!
    """
    
    await update.message.reply_text(
        welcome_text,
        reply_markup=keyboard,
        parse_mode=ParseMode.HTML
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик команды /help"""
    
    help_text = """
📖 <b>Справка по боту Vape Shop</b>

<b>Команды:</b>
/start - Начать работу с ботом
/help - Показать эту справку
/orders - Показать мои заказы (только для администратора)
/users - Показать статистику пользователей (только для администратора)

<b>Как использовать магазин:</b>
1. Нажмите на кнопку "🛍️ Открыть магазин"
2. Выберите нужные товары в каталоге
3. Добавьте их в корзину
4. Оформите заказ, указав свои данные
5. Свяжитесь с менеджером через чат для уточнения деталей

<b>Поддержка:</b>
Если у вас есть вопросы, используйте чат в приложении для связи с менеджером.
    """
    
    await update.message.reply_text(help_text, parse_mode=ParseMode.HTML)

async def orders_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Показать заказы (только для администратора)"""
    
    if update.effective_user.id != ADMIN_ID:
        await update.message.reply_text("❌ У вас нет прав для этой команды")
        return
    
    orders = load_orders()
    
    if not orders:
        await update.message.reply_text("📭 Заказов нет")
        return
    
    text = "<b>📦 Список заказов:</b>\n\n"
    
    for i, order in enumerate(orders, 1):
        items_text = "\n".join([f"  • {item['name']} × {item['quantity']}" for item in order['items']])
        text += f"""
<b>Заказ #{i}</b>
👤 Покупатель: {order['user_name']}
📞 Телефон: {order['phone']}
📍 Доставка: {order['delivery_method']}
💰 Сумма: {order['total']} ₽
📅 Дата: {order['created_at']}

<b>Товары:</b>
{items_text}

"""
    
    await update.message.reply_text(text, parse_mode=ParseMode.HTML)

async def users_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Показать статистику пользователей (только для администратора)"""
    
    if update.effective_user.id != ADMIN_ID:
        await update.message.reply_text("❌ У вас нет прав для этой команды")
        return
    
    users = load_users()
    orders = load_orders()
    
    total_purchases = sum(o.get('total', 0) for o in orders)
    
    text = f"""
<b>👥 Статистика пользователей:</b>

📊 <b>Общая статистика:</b>
• Всего пользователей: {len(users)}
• Всего заказов: {len(orders)}
• Общая сумма продаж: {total_purchases} ₽

<b>🏆 Частые покупатели:</b>
"""
    
    # Находим самых активных покупателей
    purchase_count = {}
    for order in orders:
        user_name = order.get('user_name', 'Неизвестно')
        purchase_count[user_name] = purchase_count.get(user_name, 0) + 1
    
    sorted_buyers = sorted(purchase_count.items(), key=lambda x: x[1], reverse=True)[:5]
    
    if sorted_buyers:
        for rank, (buyer, count) in enumerate(sorted_buyers, 1):
            text += f"\n{rank}. {buyer} - {count} заказов"
    else:
        text += "\nНет заказов"
    
    await update.message.reply_text(text, parse_mode=ParseMode.HTML)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик обычных сообщений"""
    
    await update.message.reply_text(
        "👋 Привет! Используйте команды /help для справки или откройте магазин кнопкой ниже.",
        reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton(
                "🛍️ Открыть магазин",
                web_app=WebAppInfo(url=WEB_APP_URL)
            )
        ]])
    )

def main() -> None:
    """Главная функция для запуска бота"""
    
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Добавляем обработчики команд
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("orders", orders_command))
    application.add_handler(CommandHandler("users", users_command))
    
    # Обработчик для остальных сообщений
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Запускаем бота
    logger.info("🚀 Бот запущен!")
    application.run_polling()

if __name__ == '__main__':
    main()
