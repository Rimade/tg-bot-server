require('dotenv').config();
const { Telegraf } = require('telegraf');

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;
const bot = new Telegraf(token);

bot.telegram.setMyCommands([
    { command: 'start', description: 'Старт' },
    { command: 'help', description: 'Помощь' },
    { command: 'form', description: 'Заполнить форму' }
]);

bot.command('start', async (ctx) => {
    await ctx.reply('Добро пожаловать! Выберите действие:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Открыть веб-приложение', web_app: { url: webAppUrl } }],
                [{ text: 'Помощь', callback_data: 'help' }]
            ]
        }
    });
});

bot.command('help', async (ctx) => {
    await ctx.reply(
        'Доступные команды:\n' +
        '/start - Начать работу с ботом\n' +
        '/help - Показать справку\n' +
        '/form - Заполнить форму\n' +
        '\nТакже вы можете:\n' +
        '- Отправить стикер\n' +
        '- Отправить фото\n' +
        '- Поделиться локацией'
    );
});

bot.on('web_app_data', async (ctx) => {
    const data = ctx.webAppData.data;
    try {
        const jsonData = JSON.parse(data);
        await ctx.reply(`Получены данные из формы:\n${JSON.stringify(jsonData, null, 2)}`);
    } catch (e) {
        await ctx.reply('Произошла ошибка при обработке данных');
    }
});

bot.on('photo', async (ctx) => {
    try {
        await ctx.reply('Фото получено! Спасибо за отправку.');
    } catch (e) {
        await ctx.reply('Произошла ошибка при обработке фото');
    }
});

bot.on('location', async (ctx) => {
    try {
        const { latitude, longitude } = ctx.message.location;
        await ctx.reply(`Получены координаты:\nШирота: ${latitude}\nДолгота: ${longitude}`);
    } catch (e) {
        await ctx.reply('Произошла ошибка при обработке локации');
    }
});

bot.on('callback_query', async (ctx) => {
    const action = ctx.callbackQuery.data;

    if (action === 'help') {
        await ctx.answerCbQuery();
        await ctx.reply(
            'Доступные команды:\n' +
            '/start - Начать работу с ботом\n' +
            '/help - Показать справку\n' +
            '/form - Заполнить форму'
        );
    }
});

bot.on('sticker', async (ctx) => {
    await ctx.reply('Классный стикер! 👍');
});

bot.on('text', async (ctx) => {
    await ctx.reply('Я понимаю только команды и специальные типы сообщений');
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
