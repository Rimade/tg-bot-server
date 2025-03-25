const { Scenes } = require('telegraf');

const quizScene = new Scenes.BaseScene('quiz');

const questions = [
	{
		question: 'Что такое JavaScript?',
		options: [
			'Язык программирования',
			'База данных',
			'Фреймворк',
			'Операционная система',
		],
		correct: 0,
	},
	{
		question: 'Что такое React?',
		options: [
			'База данных',
			'JavaScript библиотека',
			'Язык программирования',
			'Операционная система',
		],
		correct: 1,
	},
];

quizScene.enter(async (ctx) => {
	ctx.scene.state.currentQuestion = 0;
	ctx.scene.state.score = 0;
	await showQuestion(ctx);
});

async function showQuestion(ctx) {
	const question = questions[ctx.scene.state.currentQuestion];
	if (!question) {
		await showResults(ctx);
		return;
	}

	const keyboard = question.options.map((option, index) => ({
		text: option,
		callback_data: `answer_${index}`,
	}));

	await ctx.reply(
		`Вопрос ${ctx.scene.state.currentQuestion + 1} из ${questions.length}:\n\n` +
			question.question,
		{
			reply_markup: {
				inline_keyboard: keyboard.map((option) => [option]),
			},
		}
	);
}

async function showResults(ctx) {
	const score = ctx.scene.state.score;
	const total = questions.length;
	const percentage = Math.round((score / total) * 100);

	await ctx.reply(
		`📊 Результаты теста:\n\n` +
			`Правильных ответов: ${score} из ${total}\n` +
			`Процент правильных ответов: ${percentage}%\n\n` +
			`${getResultMessage(percentage)}`,
		{
			reply_markup: {
				inline_keyboard: [[{ text: '🔄 Пройти тест заново', callback_data: 'quiz' }]],
			},
		}
	);

	await ctx.scene.leave();
}

function getResultMessage(percentage) {
	if (percentage === 100) return 'Отлично! Вы знаете все!';
	if (percentage >= 80) return '👍 Хороший результат!';
	if (percentage >= 60) return '😊 Неплохо, но есть куда стремиться';
	return '📚 Рекомендуем повторить материал';
}

quizScene.on('callback_query', async (ctx) => {
	const answer = ctx.callbackQuery.data;
	if (!answer.startsWith('answer_')) return;

	const selectedAnswer = parseInt(answer.split('_')[1]);
	const question = questions[ctx.scene.state.currentQuestion];

	if (selectedAnswer === question.correct) {
		ctx.scene.state.score++;
		await ctx.answerCbQuery('✅ Правильно!');
	} else {
		await ctx.answerCbQuery('❌ Неправильно!');
	}

	ctx.scene.state.currentQuestion++;
	await showQuestion(ctx);
});

module.exports = quizScene;
