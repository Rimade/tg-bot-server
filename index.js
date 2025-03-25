require('dotenv').config();
const { Telegraf, Scenes, session } = require('telegraf');
const BOT_TOKEN = process.env.BOT_TOKEN;
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

// Функция для получения локализованного текста
function t(key, locale = 'ru', params = {}) {
	const translations = locale === 'en' ? en : ru;
	let text = key.split('.').reduce((obj, k) => obj[k], translations);

	// Заменяем параметры в тексте
	Object.keys(params).forEach((param) => {
		text = text.replace(`{${param}}`, params[param]);
	});

	return text;
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

// Обработка callback_query
bot.on('callback_query', async (ctx) => {
	const action = ctx.callbackQuery.data;
	const locale = ctx.session?.language || ctx.from.language_code || 'ru';

	try {
		await ctx.answerCbQuery();

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
