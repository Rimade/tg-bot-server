require('dotenv').config();
const { Telegraf, Scenes, session } = require('telegraf');
const BOT_TOKEN = process.env.BOT_TOKEN;
const express = require('express');
const apiRouter = require('./api');
const { getActiveUsers } = require('./analytics');
const formScene = require('./scenes/form');
const quizScene = require('./scenes/quiz');
const notificationsScene = require('./scenes/notifications');
const languageScene = require('./scenes/language');
const modeScene = require('./scenes/mode');
const helpScene = require('./scenes/help');
const statsScene = require('./scenes/stats');
const ru = require('./locales/ru');
const en = require('./locales/en');

const webAppUrl = process.env.WEBAPP_URL;
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '')
	.split(',')
	.map((id) => parseInt(id.trim()));
const bot = new Telegraf(BOT_TOKEN);

// Регистрация сцен
const stage = new Scenes.Stage([
	formScene,
	quizScene,
	notificationsScene,
	languageScene,
	modeScene,
	helpScene,
	statsScene,
]);

// Middleware
bot.use(session());
bot.use(stage.middleware());

// Функция для выхода из сцены
async function leaveSceneIfActive(ctx, reason) {
	// Проверяем, находимся ли мы в сцене
	if (ctx.session && ctx.session.__scenes && ctx.session.__scenes.current) {
		const currentScene = ctx.session.__scenes.current;
		console.log(`⚠️ Автоматический выход из сцены "${currentScene}" из-за: ${reason}`);

		try {
			await ctx.scene.leave();

			// Уведомляем пользователя о прерывании операции
			const locale = ctx.session?.language || ctx.from.language_code || 'ru';
			await ctx.reply(t('system.operationCancelled', locale));

			return true;
		} catch (error) {
			console.error('❌ Ошибка при выходе из сцены:', error);
		}
	}

	return false;
}

// Middleware для автоматического выхода из сцены при вызове новой команды
bot.use(async (ctx, next) => {
	// Проверяем, что это сообщение с командой
	if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
		await leaveSceneIfActive(ctx, 'новая команда');
	}

	return next();
});

// Middleware для логирования
bot.use(async (ctx, next) => {
	const start = Date.now();
	console.log(`📝 Получено обновление: ${ctx.updateType}`);
	if (ctx.message?.text) {
		console.log(`📨 Сообщение: ${ctx.message.text}`);
	}
	await next();
	console.log(`⏱ Обработка заняла: ${Date.now() - start}ms`);
});

// Функция для локализации сообщений
function t(key, locale = 'ru', params = {}) {
	// Определение объекта локализации
	const locales = {
		ru,
		en,
	};

	// Получение выбранной локализации или дефолтной (русской)
	const selectedLocale = locales[locale] || locales.ru;

	// Получение сообщения по ключу
	let message = getNestedProperty(selectedLocale, key) || key;

	// Замена параметров в сообщении
	if (params && typeof params === 'object') {
		Object.keys(params).forEach((param) => {
			message = message.replace(new RegExp(`{${param}}`, 'g'), params[param]);
		});
	}

	return message;
}

/**
 * Получение вложенного свойства объекта по строке пути
 * @param {Object} obj Объект
 * @param {string} path Путь к свойству (например, 'user.name')
 * @returns {*} Значение свойства или undefined
 */
function getNestedProperty(obj, path) {
	return path.split('.').reduce((prev, curr) => {
		return prev && prev[curr] !== undefined ? prev[curr] : undefined;
	}, obj);
}

// Команды бота
bot.telegram.setMyCommands([
	{ command: 'start', description: t('commands.start', 'ru') },
	{ command: 'help', description: t('commands.help', 'ru') },
	{ command: 'form', description: t('commands.form', 'ru') },
	{ command: 'location', description: t('commands.location', 'ru') },
	{ command: 'quiz', description: t('commands.quiz', 'ru') },
	{ command: 'settings', description: t('commands.settings', 'ru') },
	{ command: 'stats', description: t('commands.stats', 'ru') },
	{ command: 'faq', description: t('commands.faq', 'ru') },
	{ command: 'test', description: 'Тест работы бота' },
]);

// Обработка команд
bot.command('start', async (ctx) => {
	const userName = ctx.from.first_name;
	const locale = ctx.session?.language || ctx.from.language_code || 'ru';
	await ctx.reply(
		t('welcome', locale, { name: userName }) + '\n\n' + t('chooseAction', locale),
		{
			reply_markup: {
				inline_keyboard: [
					[
						{ text: t('buttons.form', locale), callback_data: 'form' },
						{ text: t('buttons.quiz', locale), web_app: { url: webAppUrl } },
					],
					[
						{ text: t('buttons.settings', locale), callback_data: 'settings' },
						{ text: t('buttons.stats', locale), callback_data: 'stats' },
					],
					[{ text: t('buttons.help', locale), callback_data: 'help' }],
				],
			},
		}
	);
});

bot.command('help', async (ctx) => {
	await ctx.scene.enter('help');
});

bot.command('stats', async (ctx) => {
	await ctx.scene.enter('stats');
});

bot.command('settings', async (ctx) => {
	const locale = ctx.session?.language || ctx.from.language_code || 'ru';
	await ctx.reply(t('settings.title', locale), {
		reply_markup: {
			inline_keyboard: [
				[{ text: t('settings.notifications', locale), callback_data: 'notifications' }],
				[{ text: t('settings.language', locale), callback_data: 'language' }],
				[{ text: t('settings.mode', locale), callback_data: 'mode' }],
			],
		},
	});
});

bot.command('quiz', async (ctx) => {
	const locale = ctx.session?.language || ctx.from.language_code || 'ru';
	await ctx.reply(t('quiz.start', locale), {
		reply_markup: {
			inline_keyboard: [
				[{ text: t('buttons.openWebApp', locale), web_app: { url: webAppUrl } }],
			],
		},
	});
});

bot.command('form', async (ctx) => {
	await ctx.scene.enter('form');
});

// Добавляем тестовую команду для проверки работы бота
bot.command('test', (ctx) => {
	ctx.reply('Тест - бот работает');
});

// Обработка callback_query
bot.on('callback_query', async (ctx) => {
	const action = ctx.callbackQuery.data;
	const locale = ctx.session?.language || ctx.from.language_code || 'ru';

	try {
		await ctx.answerCbQuery();

		// Проверяем, нужно ли выйти из сцены
		const keepSceneActions = ['answer_', 'back_to_quiz', 'lang_'];
		const shouldKeepScene = keepSceneActions.some((prefix) => action.startsWith(prefix));

		if (!shouldKeepScene) {
			await leaveSceneIfActive(ctx, `callback_query: ${action}`);
		}

		if (action.startsWith('lang_')) {
			const lang = action.split('_')[1];
			ctx.session.language = lang;

			// Обновляем команды бота на новом языке
			await ctx.telegram.setMyCommands([
				{ command: 'start', description: t('commands.start', lang) },
				{ command: 'help', description: t('commands.help', lang) },
				{ command: 'form', description: t('commands.form', lang) },
				{ command: 'location', description: t('commands.location', lang) },
				{ command: 'quiz', description: t('commands.quiz', lang) },
				{ command: 'settings', description: t('commands.settings', lang) },
				{ command: 'stats', description: t('commands.stats', lang) },
				{ command: 'faq', description: t('commands.faq', lang) },
			]);

			// ... rest of the language change code ...
		}
		switch (action) {
			case 'help':
				await ctx.scene.enter('help');
				break;
			case 'stats':
				await ctx.scene.enter('stats');
				break;
			case 'settings':
				await ctx.reply(t('settings.title', locale), {
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: t('settings.notifications', locale),
									callback_data: 'notifications',
								},
							],
							[{ text: t('settings.language', locale), callback_data: 'language' }],
							[{ text: t('settings.mode', locale), callback_data: 'mode' }],
						],
					},
				});
				break;
			case 'notifications':
				await ctx.scene.enter('notifications');
				break;
			case 'language':
				await ctx.scene.enter('language');
				break;
			case 'mode':
				await ctx.scene.enter('mode');
				break;
			case 'quiz':
				await ctx.reply(t('quiz.start', locale), {
					reply_markup: {
						inline_keyboard: [
							[{ text: t('buttons.openWebApp', locale), web_app: { url: webAppUrl } }],
						],
					},
				});
				break;
			case 'form':
				await ctx.scene.enter('form');
				break;
			case 'back':
				await ctx.reply(t('welcome', locale) + '\n\n' + t('chooseAction', locale), {
					reply_markup: {
						inline_keyboard: [
							[
								{ text: t('buttons.form', locale), callback_data: 'form' },
								{ text: t('buttons.quiz', locale), web_app: { url: webAppUrl } },
							],
							[
								{ text: t('buttons.settings', locale), callback_data: 'settings' },
								{ text: t('buttons.stats', locale), callback_data: 'stats' },
							],
							[{ text: t('buttons.help', locale), callback_data: 'help' }],
						],
					},
				});
				break;
		}
	} catch (error) {
		console.error('Ошибка в обработке callback_query:', error);
		await ctx.reply(t('errors.callback', locale));
	}
});

// Обработка локации
bot.on('location', async (ctx) => {
	const locale = ctx.session?.language || ctx.from.language_code || 'ru';
	try {
		const { latitude, longitude } = ctx.message.location;
		const address = await getAddressFromCoordinates(latitude, longitude);

		await ctx.reply(
			t('location.received', locale, {
				latitude,
				longitude,
				address,
			}) +
				'\n\n' +
				t('location.actions', locale),
			{
				reply_markup: {
					inline_keyboard: [
						[
							{ text: t('buttons.showMap', locale), callback_data: 'show_map' },
							{ text: t('buttons.saveLocation', locale), callback_data: 'save_location' },
						],
					],
				},
			}
		);
	} catch (error) {
		console.error('Ошибка при обработке локации:', error);
		await ctx.reply(t('location.error', locale));
	}
});

// Обработка фото
bot.on('photo', async (ctx) => {
	const locale = ctx.session?.language || ctx.from.language_code || 'ru';
	try {
		const photo = ctx.message.photo[ctx.message.photo.length - 1];
		await ctx.reply(t('photo.received', locale) + '\n\n' + t('photo.actions', locale), {
			reply_markup: {
				inline_keyboard: [
					[
						{ text: t('buttons.downloadPhoto', locale), callback_data: 'download_photo' },
						{ text: t('buttons.processPhoto', locale), callback_data: 'process_photo' },
					],
				],
			},
		});
	} catch (error) {
		console.error('Ошибка при обработке фото:', error);
		await ctx.reply(t('photo.error', locale));
	}
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
	const locale = ctx.session?.language || ctx.from.language_code || 'ru';
	if (ctx.message.text.startsWith('/')) {
		return; // Пропускаем команды
	}

	await ctx.reply(t('messages.useCommands', locale));
});

// Функция для получения адреса по координатам (добавляем реализацию отсутствующей функции)
async function getAddressFromCoordinates(latitude, longitude) {
	try {
		// Здесь должен быть код для получения адреса через API геокодирования
		// Возвращаем заглушку для демонстрации
		return 'Адрес недоступен (требуется интеграция с API геокодирования)';
	} catch (error) {
		console.error('Ошибка получения адреса:', error);
		return 'Не удалось определить адрес';
	}
}

// Оптимизация команды active_users
bot.command('active_users', async (ctx) => {
	const userId = ctx.from.id;
	const locale = ctx.session?.language || ctx.from.language_code || 'ru';

	// Проверка прав администратора
	if (!ADMIN_USER_IDS.includes(userId)) {
		return await ctx.reply(t('errors.adminOnly', locale));
	}

	try {
		if (typeof getActiveUsers === 'function') {
			const stats = getActiveUsers();

			if (stats.count === 0) {
				return await ctx.reply(t('stats.noActiveUsers', locale));
			}

			let message = t('stats.activeUsersHeader', locale, { count: stats.count }) + '\n\n';

			stats.users.forEach((user, index) => {
				message += `${index + 1}. ${user.firstName} ${user.lastName || ''} `;
				if (user.username) message += `(@${user.username}) `;
				message += `- ${formatDuration(user.duration, locale)}\n`;
			});

			await ctx.reply(message);
		} else {
			await ctx.reply(t('errors.general', locale));
		}
	} catch (error) {
		console.error('Ошибка при получении статистики:', error);
		await ctx.reply(t('errors.general', locale));
	}
});

/**
 * Форматирует продолжительность в удобочитаемый формат
 * @param {number} seconds Продолжительность в секундах
 * @param {string} locale Код языка
 * @returns {string} Отформатированная строка времени
 */
function formatDuration(seconds, locale) {
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return locale === 'ru'
			? `${hours} ч ${minutes % 60} мин`
			: `${hours}h ${minutes % 60}m`;
	} else if (minutes > 0) {
		return locale === 'ru'
			? `${minutes} мин ${seconds % 60} сек`
			: `${minutes}m ${seconds % 60}s`;
	} else {
		return locale === 'ru' ? `${seconds} сек` : `${seconds}s`;
	}
}

bot
	.launch()
	.then(() => {
		console.log('🚀 Бот успешно запущен');
	})
	.catch((err) => {
		console.error('❌ Ошибка при запуске бота:', err);
	});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Создаем Express приложение
const app = express();
const PORT = process.env.PORT || 3333;

// Middleware для обработки JSON
app.use(express.json());

// Используем API маршруты
app.use('/api', apiRouter);

// Обработка ошибок в API
app.use((err, req, res, next) => {
	console.error('Ошибка сервера:', err);
	res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Вместо статических файлов делаем редирект на внешний сайт
app.get('*', (req, res) => {
	res.redirect(webAppUrl);
});

// Запускаем сервер
app.listen(PORT, () => {
	console.log(`Сервер запущен на порту ${PORT}`);
});
