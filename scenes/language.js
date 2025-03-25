const { Scenes } = require('telegraf');

const languageScene = new Scenes.BaseScene('language');

const languages = {
	ru: {
		name: 'Русский',
		flag: '🇷🇺',
		description: 'Использовать русский язык',
	},
	en: {
		name: 'English',
		flag: '🇬🇧',
		description: 'Use English language',
	},
};

languageScene.enter(async (ctx) => {
	const currentLang = ctx.session.language || ctx.from.language_code || 'ru';

	await ctx.reply('🌍 Выберите язык интерфейса\n\n' + 'Choose interface language:', {
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: `${currentLang === 'ru' ? '✅' : '⚪️'} ${languages.ru.flag} Русский`,
						callback_data: 'lang_ru',
					},
				],
				[
					{
						text: `${currentLang === 'en' ? '✅' : '⚪️'} ${languages.en.flag} English`,
						callback_data: 'lang_en',
					},
				],
				[{ text: '🔙 Вернуться в настройки', callback_data: 'settings' }],
			],
		},
	});
});

languageScene.on('callback_query', async (ctx) => {
	const action = ctx.callbackQuery.data;

	try {
		await ctx.answerCbQuery();

		if (action.startsWith('lang_')) {
			const lang = action.split('_')[1];
			ctx.session.language = lang;

			// Удаляем предыдущее сообщение
			await ctx.deleteMessage();

			// Отправляем подтверждение
			await ctx.reply(
				`✅ Язык успешно изменен на ${languages[lang].name} ${languages[lang].flag}\n\n` +
					'Вы можете изменить язык в любой момент через меню настроек.',
				{
					reply_markup: {
						inline_keyboard: [
							[{ text: '⚙️ Вернуться в настройки', callback_data: 'settings' }],
						],
					},
				}
			);

			await ctx.scene.leave();
		} else if (action === 'settings') {
			await ctx.scene.leave();
			await ctx.reply('⚙️ Настройки:', {
				reply_markup: {
					inline_keyboard: [
						[{ text: '🔔 Уведомления', callback_data: 'notifications' }],
						[{ text: '🌍 Язык', callback_data: 'language' }],
						[{ text: '⚡️ Режим работы', callback_data: 'mode' }],
					],
				},
			});
		}
	} catch (error) {
		console.error('Ошибка в обработке callback_query:', error);
		await ctx.reply('❌ Произошла ошибка. Попробуйте еще раз.');
	}
});

module.exports = languageScene;
