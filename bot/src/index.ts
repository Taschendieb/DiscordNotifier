import cors from 'cors';
import * as http from 'http';
import express from 'express';
import * as dotenv from 'dotenv';
import DiscordNotifierBot from './bot';

dotenv.config({path: __dirname + '/../.env'});

const dicordNotifierBot = new DiscordNotifierBot();
const app = express();
const server = new http.Server(app);
app.use(cors());

app.get('/', (req, res) => {res.send('DiscordNotifier Backend')});

app.get('/api/getUsersInVoiceChannels/:serverid', (req, res) => {
    res.send(JSON.stringify(dicordNotifierBot.getUsersInVoiceChannels(req.params.serverid)));
});

server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT} ...`);
});