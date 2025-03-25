const { Scenes } = require('telegraf');

const formScene = new Scenes.BaseScene('form');

formScene.enter(async (ctx) => {
	await ctx.reply('Заполните форму:\n\n' + 'Введите ваше имя:');
});

formScene.on('text', async (ctx) => {
	if (!ctx.scene.state.name) {
		ctx.scene.state.name = ctx.message.text;
		await ctx.reply('Введите ваш возраст:');
	} else if (!ctx.scene.state.age) {
		ctx.scene.state.age = ctx.message.text;
		await ctx.reply('Введите ваш email:');
	} else if (!ctx.scene.state.email) {
		ctx.scene.state.email = ctx.message.text;

		// Отправляем итоговую информацию
		await ctx.reply(
			'✅ Форма заполнена!\n\n' +
				`Имя: ${ctx.scene.state.name}\n` +
				`Возраст: ${ctx.scene.state.age}\n` +
				`Email: ${ctx.scene.state.email}`,
			{
				reply_markup: {
					inline_keyboard: [[{ text: '📝 Заполнить еще раз', callback_data: 'form' }]],
				},
			}
		);

		await ctx.scene.leave();
	}
});

module.exports = formScene;
