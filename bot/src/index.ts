import cors from 'cors';
import * as http from 'http';
import express from 'express';
import * as dotenv from 'dotenv';
import DiscordNotifierBot from './bot';
import helmet from 'helmet';
import crypto from 'crypto';
import fs from 'fs';

dotenv.config({path: __dirname + '/../.env'});

const dicordNotifierBot = new DiscordNotifierBot();
const app = express();
const server = new http.Server(app);
app.use(cors(),helmet());


app.get('/getUsersInVoiceChannels/:serverid', async (req, res) => {
    if (!verifySignature(req.params.serverid, decodeURIComponent(<string>req.query.signature))) {
        res.status(401);
        res.send('');
        return;
    }
    res.send(JSON.stringify(await dicordNotifierBot.getUsersInVoiceChannels(req.params.serverid)));
});

app.get('/', (req, res) => {res.send('DiscordNotifier Backend')});

server.listen(process.env.PORT ?? 3000, () => {
    console.log(`Server running on port ${process.env.PORT ?? 3000} ...`);
});

function verifySignature(payload: string, signature: string) {
    const verifier = crypto.createVerify('sha256');
    verifier.update(payload);
    const publicKey = fs.readFileSync(__dirname + '/../public.pem');
    return verifier.verify(publicKey, signature,'base64');
}
