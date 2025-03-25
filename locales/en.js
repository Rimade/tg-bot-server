module.exports = {
	welcome: '👋 Welcome, {name}!',
	chooseAction: 'Choose an action:',
	location: {
		request: '📍 Send your location',
		received:
			'📍 Location information:\n\n📌 Address: {address}\n🌐 Coordinates:\n   • Latitude: {latitude}\n   • Longitude: {longitude}',
		actions: 'What would you like to do with this location?',
		error: '❌ An error occurred while processing the location. Please try again.',
	},
	photo: {
		received: '📸 Photo received!',
		processing: '🔄 Processing photo...',
		actions: 'What would you like to do with this photo?',
		error: '❌ An error occurred while processing the photo',
	},
	form: {
		start: '📝 Fill out the form:\n\nEnter your name:',
		age: 'Enter your age:',
		email: 'Enter your email:',
		complete: '✅ Form completed!\n\nName: {name}\nAge: {age}\nEmail: {email}',
	},
	quiz: {
		start: 'Take the quiz:',
		question: 'Question {current} of {total}:\n\n{question}',
		results:
			'📊 Quiz results:\n\nCorrect answers: {score} out of {total}\nPercentage: {percentage}%\n\n{message}',
		correct: '✅ Correct!',
		incorrect: '❌ Incorrect!',
	},
	settings: {
		title: '⚙️ Bot settings:',
		notifications: '🔔 Notification settings',
		language: '🌍 Language selection',
		mode: '⚡️ Operation mode',
	},
	buttons: {
		form: '📝 Fill Form',
		quiz: '📚 Take Quiz',
		settings: '⚙️ Settings',
		stats: '📊 Statistics',
		help: '❓ Help',
		openWebApp: '🌐 Open Quiz in App',
		showMap: '🗺 Show on Map',
		saveLocation: '�� Save Location',
		downloadPhoto: '💾 Download',
		processPhoto: '🔄 Process',
	},
	errors: {
		callback: '❌ An error occurred. Please try again.',
		general: '❌ An error occurred. Please try again later.',
	},
	messages: {
		useCommands: 'Please use commands or menu buttons to interact with the bot.',
	},
	commands: {
		start: 'Start',
		help: 'Help',
		form: 'Fill form',
		location: 'Send location',
		quiz: 'Take quiz',
		settings: 'Settings',
		stats: 'Statistics',
		faq: 'FAQ',
	},
};
