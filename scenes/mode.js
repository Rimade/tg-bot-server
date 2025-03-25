const { Scenes } = require('telegraf');

const modeScene = new Scenes.BaseScene('mode');

const modes = {
	standard: {
		name: 'Стандартный',
		emoji: '⚡️',
		description: 'Обычный режим работы бота',
	},
	quiet: {
		name: 'Тихий',
		emoji: '��',
		description: 'Минимум уведомлений и сообщений',
	},
	verbose: {
		name: 'Подробный',
		emoji: '📝',
		description: 'Расширенная информация и подробные ответы',
	},
};

modeScene.enter(async (ctx) => {
	const currentMode = ctx.session.mode || 'standard';

	await ctx.reply(
		'⚡️ Выберите режим работы бота:\n\n' +
			Object.entries(modes)
				.map(
					([key, mode]) =>
						`${currentMode === key ? '✅' : '⚪️'} ${mode.emoji} ${mode.name}\n${
							mode.description
						}`
				)
				.join('\n\n'),
		{
			reply_markup: {
				inline_keyboard: [
					[
						{ text: '⚡️ Стандартный', callback_data: 'mode_standard' },
						{ text: '🤫 Тихий', callback_data: 'mode_quiet' },
					],
					[{ text: '📝 Подробный', callback_data: 'mode_verbose' }],
					[{ text: '🔙 Вернуться в настройки', callback_data: 'settings' }],
				],
			},
		}
	);
});

modeScene.on('callback_query', async (ctx) => {
	const action = ctx.callbackQuery.data;

	try {
		await ctx.answerCbQuery();

		if (action.startsWith('mode_')) {
			const mode = action.split('_')[1];
			ctx.session.mode = mode;

			// Удаляем предыдущее сообщение
			await ctx.deleteMessage();

			// Отправляем подтверждение
			await ctx.reply(
				`✅ Режим работы изменен на ${modes[mode].emoji} ${modes[mode].name}\n\n` +
					`${modes[mode].description}\n\n` +
					'Вы можете изменить режим в любой момент через меню настроек.',
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

module.exports = modeScene;
