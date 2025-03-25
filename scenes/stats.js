const { Scenes } = require('telegraf');

const statsScene = new Scenes.BaseScene('stats');

statsScene.enter(async (ctx) => {
	const userId = ctx.from.id;
	const stats = ctx.session.stats || {
		quizzesTaken: 0,
		correctAnswers: 0,
		totalQuestions: 0,
		formsSubmitted: 0,
		photosSent: 0,
		locationsShared: 0,
		lastActive: new Date().toISOString(),
	};

	const accuracy =
		stats.totalQuestions > 0
			? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
			: 0;

	await ctx.reply(
		'📊 Ваша статистика:\n\n' +
			`📚 Пройдено тестов: ${stats.quizzesTaken}\n` +
			`✅ Правильных ответов: ${stats.correctAnswers}\n` +
			`📝 Всего вопросов: ${stats.totalQuestions}\n` +
			`🎯 Точность: ${accuracy}%\n\n` +
			`📋 Заполнено форм: ${stats.formsSubmitted}\n` +
			`📸 Отправлено фото: ${stats.photosSent}\n` +
			`🗺 Поделено локаций: ${stats.locationsShared}\n\n` +
			`🕒 Последняя активность: ${new Date(stats.lastActive).toLocaleString()}`,
		{
			reply_markup: {
				inline_keyboard: [
					[
						{ text: '📈 Графики', callback_data: 'stats_graphs' },
						{ text: '🏆 Достижения', callback_data: 'stats_achievements' },
					],
					[{ text: '📊 Подробная статистика', callback_data: 'stats_detailed' }],
				],
			},
		}
	);
});

statsScene.on('callback_query', async (ctx) => {
	const action = ctx.callbackQuery.data;

	switch (action) {
		case 'stats_graphs':
			await ctx.reply('📈 Графики статистики в разработке...');
			break;

		case 'stats_achievements':
			await ctx.reply('🏆 Достижения в разработке...');
			break;

		case 'stats_detailed':
			await ctx.reply('📊 Подробная статистика в разработке...');
			break;
	}
});

module.exports = statsScene;
