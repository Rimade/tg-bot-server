const { Scenes } = require('telegraf');

const notificationsScene = new Scenes.BaseScene('notifications');

const notificationTypes = {
	daily: {
		name: 'Ежедневные уведомления',
		emoji: '📅',
		description: 'Уведомления каждый день в установленное время',
	},
	weekly: {
		name: 'Еженедельные уведомления',
		emoji: '📊',
		description: 'Еженедельный отчет о вашей активности',
	},
	monthly: {
		name: 'Ежемесячные уведомления',
		emoji: '📈',
		description: 'Месячная статистика и достижения',
	},
};

notificationsScene.enter(async (ctx) => {
	// Инициализация настроек, если их нет
	if (!ctx.session.notifications) {
		ctx.session.notifications = {
			daily: true,
			weekly: true,
			monthly: false,
		};
	}

	await ctx.reply(
		'🔔 Настройки уведомлений\n\n' +
			'Выберите тип уведомлений для настройки:\n\n' +
			Object.entries(notificationTypes)
				.map(
					([key, type]) =>
						`${ctx.session.notifications[key] ? '✅' : '❌'} ${type.emoji} ${
							type.name
						}\n${type.description}`
				)
				.join('\n\n'),
		{
			reply_markup: {
				inline_keyboard: [
					[
						{ text: '📅 Ежедневные', callback_data: 'notify_daily' },
						{ text: '📊 Еженедельные', callback_data: 'notify_weekly' },
					],
					[{ text: '📈 Ежемесячные', callback_data: 'notify_monthly' }],
					[{ text: '💾 Сохранить и выйти', callback_data: 'notify_save' }],
					[{ text: '🔙 Вернуться в настройки', callback_data: 'settings' }],
				],
			},
		}
	);
});

notificationsScene.on('callback_query', async (ctx) => {
	const action = ctx.callbackQuery.data;

	try {
		await ctx.answerCbQuery();

		if (action.startsWith('notify_')) {
			const type = action.split('_')[1];

			if (type === 'save') {
				// Удаляем предыдущее сообщение
				await ctx.deleteMessage();

				// Формируем список активных уведомлений
				const activeNotifications = Object.entries(ctx.session.notifications || {})
					.filter(([_, enabled]) => enabled)
					.map(
						([key]) => `${notificationTypes[key].emoji} ${notificationTypes[key].name}`
					)
					.join('\n');

				// Отправляем подтверждение
				await ctx.reply(
					'✅ Настройки уведомлений сохранены\n\n' +
						'Активные уведомления:\n' +
						(activeNotifications || 'Нет активных уведомлений') +
						'\n\n' +
						'Вы можете изменить их в любой момент через меню настроек.',
					{
						reply_markup: {
							inline_keyboard: [
								[{ text: '⚙️ Вернуться в настройки', callback_data: 'settings' }],
							],
						},
					}
				);

				await ctx.scene.leave();
				return;
			}

			// Инициализация настроек, если их нет
			if (!ctx.session.notifications) {
				ctx.session.notifications = {
					daily: true,
					weekly: true,
					monthly: false,
				};
			}

			// Переключение состояния
			ctx.session.notifications[type] = !ctx.session.notifications[type];

			// Обновляем сообщение с новыми настройками
			await ctx.editMessageText(
				'🔔 Настройки уведомлений\n\n' +
					'Выберите тип уведомлений для настройки:\n\n' +
					Object.entries(notificationTypes)
						.map(
							([key, type]) =>
								`${ctx.session.notifications[key] ? '✅' : '❌'} ${type.emoji} ${
									type.name
								}\n${type.description}`
						)
						.join('\n\n'),
				{
					reply_markup: {
						inline_keyboard: [
							[
								{ text: '📅 Ежедневные', callback_data: 'notify_daily' },
								{ text: '📊 Еженедельные', callback_data: 'notify_weekly' },
							],
							[{ text: '📈 Ежемесячные', callback_data: 'notify_monthly' }],
							[{ text: '💾 Сохранить и выйти', callback_data: 'notify_save' }],
							[{ text: '🔙 Вернуться в настройки', callback_data: 'settings' }],
						],
					},
				}
			);
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

module.exports = notificationsScene;
