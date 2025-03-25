/**
 * Модуль аналитики для отслеживания активных пользователей веб-приложения
 */

// Хранилище активных пользователей
const activeUsers = new Map();

/**
 * Добавить пользователя в список активных
 * @param {Object} user Данные пользователя
 * @param {number} user.userId ID пользователя
 * @param {string} user.username Имя пользователя
 * @param {string} user.firstName Имя пользователя
 * @param {string} user.lastName Фамилия пользователя
 * @param {string} user.languageCode Код языка пользователя
 */
function trackUser(user) {
	const { userId } = user;

	// Если пользователь уже есть, просто обновляем время последней активности
	if (activeUsers.has(userId)) {
		const userData = activeUsers.get(userId);
		userData.lastActiveTime = new Date();
		activeUsers.set(userId, userData);
		return;
	}

	// Добавляем нового пользователя
	activeUsers.set(userId, {
		...user,
		startTime: new Date(),
		lastActiveTime: new Date(),
	});

	console.log(`Пользователь ${user.firstName} (${user.userId}) открыл веб-приложение`);
}

/**
 * Удалить пользователя из списка активных
 * @param {number} userId ID пользователя
 */
function removeUser(userId) {
	if (activeUsers.has(userId)) {
		const user = activeUsers.get(userId);
		console.log(`Пользователь ${user.firstName} (${userId}) закрыл веб-приложение`);
		activeUsers.delete(userId);
	}
}

/**
 * Получить список всех активных пользователей
 * @returns {Object} Информация об активных пользователях
 */
function getActiveUsers() {
	const users = Array.from(activeUsers.values());

	return {
		count: users.length,
		users: users.map((user) => ({
			userId: user.userId,
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			startTime: user.startTime,
			lastActiveTime: user.lastActiveTime,
			duration: Math.floor((new Date() - user.startTime) / 1000), // в секундах
		})),
	};
}

/**
 * Очистить неактивных пользователей (тех, кто не обновлял активность более 15 минут)
 */
function cleanupInactiveUsers() {
	const now = new Date();
	const inactiveTimeout = 15 * 60 * 1000; // 15 минут в миллисекундах

	for (const [userId, userData] of activeUsers.entries()) {
		const timeSinceLastActive = now - userData.lastActiveTime;
		if (timeSinceLastActive > inactiveTimeout) {
			console.log(
				`Автоматическое удаление неактивного пользователя ${userData.firstName} (${userId})`
			);
			activeUsers.delete(userId);
		}
	}
}

// Запускаем периодическую очистку неактивных пользователей
const cleanupInterval = 5 * 60 * 1000; // 5 минут
setInterval(cleanupInactiveUsers, cleanupInterval);

module.exports = {
	trackUser,
	removeUser,
	getActiveUsers,
};
