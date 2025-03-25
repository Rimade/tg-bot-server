const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { trackUser, removeUser, getActiveUsers } = require('./analytics');

// Создаем router для API
const apiRouter = express.Router();

// Промежуточное ПО для CORS
apiRouter.use(cors());
apiRouter.use(express.json());

// Константы
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '')
	.split(',')
	.map((id) => parseInt(id.trim()));

/**
 * Проверка данных инициализации Telegram WebApp
 * @param {Object} initData Данные инициализации
 * @returns {boolean} Валидны ли данные
 */
function validateTelegramWebAppData(initData) {
	// Простая валидация
	if (!initData || !initData.user || !initData.hash) {
		return false;
	}

	try {
		// Полная валидация на основе документации Telegram
		const data = initData.raw || '';
		const hash = initData.hash || '';

		// Создаем строку данных для проверки
		const dataCheckString = Object.keys(initData)
			.filter((key) => key !== 'hash')
			.sort()
			.map((key) => `${key}=${initData[key]}`)
			.join('\n');

		// Создаем секретный ключ на основе токена бота
		const secretKey = crypto
			.createHmac('sha256', 'WebAppData')
			.update(BOT_TOKEN)
			.digest();

		// Проверяем подпись
		const calculatedHash = crypto
			.createHmac('sha256', secretKey)
			.update(dataCheckString)
			.digest('hex');

		return calculatedHash === hash;
	} catch (error) {
		console.error('Ошибка при валидации данных Telegram WebApp:', error);
		return false;
	}
}

/**
 * Проверка, является ли пользователь администратором
 * @param {number} userId ID пользователя
 * @returns {boolean} Является ли пользователь администратором
 */
function isAdmin(userId) {
	return ADMIN_USER_IDS.includes(userId);
}

// Middleware для валидации Telegram WebApp данных
function validateTelegramData(req, res, next) {
	// Для внешнего сайта делаем упрощенную валидацию
	const { userId, username, firstName, lastName, languageCode } = req.body;

	if (!userId) {
		return res.status(400).json({ error: 'Недействительные данные пользователя' });
	}

	req.telegramUser = {
		id: userId,
		username,
		first_name: firstName,
		last_name: lastName,
		language_code: languageCode || 'ru',
	};

	next();
}

// Middleware для проверки прав администратора
function adminOnly(req, res, next) {
	const userId = parseInt(req.params.userId || req.body.userId || 0);

	if (!isAdmin(userId)) {
		return res
			.status(403)
			.json({ error: 'Доступ запрещен. Требуются права администратора.' });
	}

	next();
}

// API эндпоинты

// Трекинг активного пользователя
apiRouter.post('/track-user', validateTelegramData, (req, res) => {
	const { id, username, first_name, last_name, language_code } = req.telegramUser;

	trackUser({
		userId: id,
		username: username || '',
		firstName: first_name || '',
		lastName: last_name || '',
		languageCode: language_code || 'ru',
	});

	res.json({ success: true });
});

// Удаление пользователя при выходе
apiRouter.post('/user-exit', (req, res) => {
	const { userId } = req.body;

	if (!userId) {
		return res.status(400).json({ error: 'Не указан userId' });
	}

	removeUser(userId);
	res.json({ success: true });
});

// Ping для обновления статуса активности
apiRouter.post('/ping', (req, res) => {
	const { userId } = req.body;

	if (!userId) {
		return res.status(400).json({ error: 'Не указан userId' });
	}

	// Просто вызываем trackUser с тем же пользователем
	if (userId) {
		const user = {
			userId: userId,
		};
		trackUser(user);
	}

	res.json({ success: true });
});

// Получение статистики (только для админов)
apiRouter.get('/active-users/:userId', adminOnly, (req, res) => {
	res.json(getActiveUsers());
});

module.exports = apiRouter;
