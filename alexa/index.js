// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');

const getLanguage = function(handlerInput) {
    let language;
    if(handlerInput.requestEnvelope.request.locale === 'de-DE'){
       language = "de";
    } else {
       language = "en";
    }
    return language;
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        let accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
        let speakOutput;
        
        if (accessToken === undefined) {
            switch(getLanguage(handlerInput)) {
                case 'de':
                    speakOutput = 'Bitte verbinde deinen Discord Account in der Alexa App, um diesen Skill zu nutzen';
                    break;
                case 'en':
                    speakOutput = 'Please link your discord account first using the companion app to use this skill';
                    break;
            }
        } else {
            await queryDiscordApi('https://discordapp.com/api/users/@me', handlerInput).then((user) => {
                switch(getLanguage(handlerInput)) {
                    case 'de':
                        speakOutput = 'Hallo ' + user.username;
                        break;
                    case 'en':
                        speakOutput = 'Hello ' + user.username;
                        break;
                }
            });
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        let speakOutput;
        switch(getLanguage(handlerInput)) {
            case 'de':
                speakOutput = 'Frage einfach: Wer ist online ? Hinweis: Der DiscordNotifier Bot muss dem Server zuvor hinzugefügt worden sein'
                break;
            case 'en':
                speakOutput = 'Just ask: Who is online ? Note: The DiscordNotifier Bot must be added to a server beforehand'
                break;
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};


const WhosOnlineIntendHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'WhoIsOnlineIntend';
    },
    async handle(handlerInput) {
        let speakOutput = '';

        let guilds = [];

        await queryDiscordApi('https://discordapp.com/api/users/@me/guilds', handlerInput).then((data) => {
            guilds = data;
        })

        let userCount = 0;
        for (let guild of guilds) {
            await fetch('https://90d06e1b.ngrok.io/api/getUsersInVoiceChannels/' + guild.id + '?signature=' + encodeURIComponent(signPayload(guild.id))).then(res => res.json()).then((data) => {
                if (data.length === 0) {
                    return;
                }
                
                let l_on, l_and;
                
                switch(getLanguage(handlerInput)) {
                    case 'de':
                        l_on = 'Auf';
                        l_and = 'und';
                        break;
                    case 'en':
                        l_on = 'On';
                        l_and = 'and';
                        break;
                }
                
                speakOutput += l_on + ' ' + guild.name + ': '
                for(let i = 0; i < data.length; i++) {
                    userCount++;
                    speakOutput += data[i];
                    if (i === data.length - 2) {
                        speakOutput += ' ' + l_and + ' ';
                    } else if (i < data.length - 2) {
                        speakOutput += ', ';
                    }
                }
                speakOutput += '. ';
            });
        }
        if (userCount === 0) {
            switch(getLanguage(handlerInput)) {
                case 'de':
                    speakOutput = 'Es ist niemand online';
                    break;
                case 'en':
                    speakOutput = 'No one is online';
                    break;
            }
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const signPayload = function(payload) {
    const signer = crypto.createSign('sha256');
    signer.update(payload);
    const privateKey = fs.readFileSync('private.pem', 'utf8');
    const sign = signer.sign(privateKey, 'base64');
    console.log(sign);
    return sign;
};

const queryDiscordApi = function(url, handlerInput) {
    let accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
    return new Promise(async (resolve, reject) => {
        await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        }).then(res => res.json()).then((data) => {
            resolve(data);
        });
    });
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        WhosOnlineIntendHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();
