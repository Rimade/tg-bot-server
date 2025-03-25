const { Scenes } = require('telegraf');

const helpScene = new Scenes.BaseScene('help');

const helpCategories = {
	quiz: {
		title: '📚 Подсказки для тестов',
		content: [
			'• Внимательно читайте вопросы',
			'• Используйте логическое мышление',
			'• Если не уверены, пропустите вопрос',
			'• Проверяйте ответы перед отправкой',
			'• Практикуйтесь регулярно',
		],
	},
	bot: {
		title: '🤖 Советы по использованию бота',
		content: [
			'• Используйте команду /start для начала работы',
			'• Настройте язык в разделе настроек',
			'• Включите нужные уведомления',
			'• Выберите удобный режим работы',
			'• Используйте веб-приложение для расширенных функций',
		],
	},
	faq: {
		title: '❓ Часто задаваемые вопросы',
		content: [
			'Q: Как начать тест?\nA: Используйте команду /quiz или нажмите кнопку "Пройти тест"',
			'Q: Как изменить язык?\nA: Перейдите в настройки и выберите нужный язык',
			'Q: Как отключить уведомления?\nA: В настройках выберите тип уведомлений для отключения',
			'Q: Как посмотреть статистику?\nA: Используйте команду /stats или нажмите кнопку "Статистика"',
			'Q: Как связаться с поддержкой?\nA: Используйте команду /support',
		],
	},
};

helpScene.enter(async (ctx) => {
	await ctx.reply('📚 Справка и подсказки\n\n' + 'Выберите категорию:', {
		reply_markup: {
			inline_keyboard: [
				[
					{ text: '📚 Подсказки для тестов', callback_data: 'help_quiz' },
					{ text: '🤖 Советы по боту', callback_data: 'help_bot' },
				],
				[{ text: '❓ FAQ', callback_data: 'help_faq' }],
			],
		},
	});
});

helpScene.on('callback_query', async (ctx) => {
	const action = ctx.callbackQuery.data;

	try {
		await ctx.answerCbQuery();

		if (action.startsWith('help_')) {
			const category = action.split('_')[1];
			const helpData = helpCategories[category];

			if (helpData) {
				await ctx.reply(`${helpData.title}\n\n` + helpData.content.join('\n\n'), {
					reply_markup: {
						inline_keyboard: [
							[{ text: '🔙 Назад к категориям', callback_data: 'help_back' }],
						],
					},
				});
			}
		} else if (action === 'help_back') {
			await ctx.deleteMessage();
			await ctx.reply('📚 Справка и подсказки\n\n' + 'Выберите категорию:', {
				reply_markup: {
					inline_keyboard: [
						[
							{ text: '📚 Подсказки для тестов', callback_data: 'help_quiz' },
							{ text: '🤖 Советы по боту', callback_data: 'help_bot' },
						],
						[{ text: '❓ FAQ', callback_data: 'help_faq' }],
					],
				},
			});
		}
	} catch (error) {
		console.error('Ошибка в обработке callback_query:', error);
		await ctx.reply('❌ Произошла ошибка. Попробуйте еще раз.');
	}
});

module.exports = helpScene;
