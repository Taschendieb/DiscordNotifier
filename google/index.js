// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const fetch = require('node-fetch');
const crypto = require('crypto');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  async function welcome(agent) {
    await queryDiscordApi('https://discordapp.com/api/users/@me', agent).then((user) => {
        agent.add('Wilkommen ' + user.username);
    });
  }
 
  async function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  
  async function whoIsOnline(agent) {
    let speakOutput = '';
    let guilds = [];

    await queryDiscordApi('https://discordapp.com/api/users/@me/guilds', agent).then((data) => {
        guilds = data;
    });

    let userCount = 0;
    for (let guild of guilds) {
        await fetch('https://90d06e1b.ngrok.io/api/getUsersInVoiceChannels/' + guild.id + '?signature=' + encodeURIComponent(signPayload(guild.id))).then(res => res.json()).then((data) => {
            if (data.length === 0) {
                return;
            }
            
            let l_on, l_and;
            
            switch(getLanguage()) {
                case 'de':
                    l_on = 'Auf';
                    l_and = 'und';
                    break;
                case 'en':
                    l_on = 'On';
                    l_and = 'and';
                    break;
            }
            
            speakOutput += l_on + ' ' + guild.name + ': ';
            for(let i = 0; i < data.length; i++) {
                userCount++;
                speakOutput += data[i];
                if (i === data.length - 2) {
                    speakOutput += ' ' + l_and + ' ';
                } else if (i < data.length - 2) {
                    speakOutput += ', ';
                }
            }
        });
    }

    if (userCount === 0) {
        switch(getLanguage()) {
            case 'de':
                speakOutput = 'Es ist niemand online';
                break;
            case 'en':
                speakOutput = 'No one is online';
                break;
        }
    }

    agent.add(speakOutput);
  }

  const queryDiscordApi = function(url, agent) {
    return new Promise((resolve, reject) => {
        let accessToken = agent.originalRequest.payload.user.accessToken;
        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        }).then(res => res.json()).then((data) => {
            resolve(data);
        });
    });
  };

  const signPayload = function(payload) {
    const signer = crypto.createSign('sha256');
    signer.update(payload);
    const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');;
    const sign = signer.sign(privateKey, 'base64');
    console.log(sign);
    return sign;
  };

  const getLanguage = function() {
    return "de";
  };

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('WHO_IS_ONLINE', whoIsOnline);
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
