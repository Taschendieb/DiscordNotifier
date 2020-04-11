import "discord.js";
import { Client, VoiceState } from "discord.js";

export default class DiscordNotifierBot {
    private client: Client;
    
    constructor() {
        this.client = new Client();

        this.client.on('ready', () => {
            console.log('DISCORD: I am ready!');
        });

        this.client.login(process.env.BOT_TOKEN);
    }
    
    public async getUsersInVoiceChannels(serverId: string): Promise<string[]> {
        const userArray: string[] = [];

        this.client.guilds.resolve(serverId)?.voiceStates.cache.forEach((vs: VoiceState) => {
            const username = this.client.guilds.resolve(serverId)?.members.resolve(vs.id)?.user.username;
            username !== undefined ? userArray.push(username) : null;
        });

        return userArray;
    }
}