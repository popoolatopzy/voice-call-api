const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { twiml: { VoiceResponse } } = require('twilio');
const { GoogleGenerativeAI } = require("@google/generative-ai");

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/voice', async (req, res) => {
    const response = new VoiceResponse();
    const gather = response.gather({
        input: 'speech',
        action: '/process-speech',
        method: 'POST',
        timeout : 5,
        speechTimeout : 'auto',
        language : 'en-US'
    });
    gather.say('Hello, I am Gemini, your voice call AI assistant. Please ask me any question.');

    response.say('I did not receive any question from you. Goodbye.');

    res.type('text/xml');
    res.send(response.toString());
});

app.post('/process-speech', async (req, res) => {
    const speechResult = req.body.SpeechResult;
    if (!speechResult) {
        res.redirect('/voice');
        return;
    }

    try {

        const prompt = speechResult
        const result = await model.generateContent(prompt);
        const ai_response = await result.response;
        const responseText = ai_response.text();

        const response = new VoiceResponse();
        response.say(responseText);
        response.say('Goodbye.');
        res.type('text/xml');
        res.send(response.toString());
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        const response = new VoiceResponse();
        response.say('There was an error processing your request. Please try again later.');
        response.say('Goodbye.');
        res.type('text/xml');
        res.send(response.toString());
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
