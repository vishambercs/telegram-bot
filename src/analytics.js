import * as Amplitude from '@amplitude/node';
import { app } from './app';
class Analytics {
    constructor() {
        var amplitudeApiKey = process.env.AMPLITUDE_API_KEY;
        if (amplitudeApiKey) {
            console.log("amplitude started with apiKey:");
            this.client = Amplitude.init(amplitudeApiKey);
        } else {
            console.log("ERROR! amplitude not started. plese setup AMPLITUDE_API_KEY in env");
        }
    }

    async trackEventByUser(userId, event) {
        if (this.client) {
            if (userId) {
                console.log("tracking event for " + userId);
                var res = await this.client.logEvent(event);
                var respCode = res.statusCode;
                if (respCode != 200){
                    console.log("event response: " + respCode);
                }
                await this.client.flush();
                console.log("events flushed");
            } else {
                console.log("cant track event without userId");
            }
        } else {
            console.log("cant track without apmlitude_client");
        }
    }

    async trackEvent(ctx, event) {
        var userId = app.sessionAdapter.readUserId(ctx);
        await this.trackEventByUser(userId, event);
    }

    async trackWelcomeScreen(ctx) {
        console.log("track enter welcome screen");
        await this.trackEvent(ctx, {
            event_type: "enter_welcome_screen",
            user_id: app.sessionAdapter.readUserIdStr(ctx),
        });
    }

    async trackStart(ctx) {
        console.log("track enter start screen");
        await this.trackEvent(ctx, {
            event_type: "enter_start",
            user_id: app.sessionAdapter.readUserIdStr(ctx),
        });
    }

    async trackRead(ctx) {
        console.log("track enter read screen");
        await this.trackEvent(ctx, {
            event_type: "enter_read",
            user_id: app.sessionAdapter.readUserIdStr(ctx),
        });
    }

    async trackCurFrom(ctx) {
        console.log("track enter curFrom screen");
        await this.trackEvent(ctx, {
            event_type: "enter_cur_from",
            user_id: app.sessionAdapter.readUserIdStr(ctx),
        });
    }

    async trackCurTo(ctx) {
        console.log("track enter curTo screen");
        await this.trackEvent(ctx, {
            event_type: "enter_cur_to",
            user_id: app.sessionAdapter.readUserIdStr(ctx),
        });
    }

    async trackEnterAmount(ctx) {
        console.log("track enter amount screen");
        await this.trackEvent(ctx, {
            event_type: "enter_amount",
            user_id: app.sessionAdapter.readUserIdStr(ctx),
        });
    }

    async trackEstimate(ctx) {
        console.log("track enter estimate screen");
        await this.trackEvent(ctx, {
            event_type: "enter_estimate",
            user_id: app.sessionAdapter.readUserIdStr(ctx),
        });
    }

    async trackCheckAgree(ctx) {
        console.log("track enter checkAgree screen");
        await this.trackEvent(ctx, {
            event_type: "enter_check_agree",
            user_id: app.sessionAdapter.readUserIdStr(ctx),
        });
    }

    async trackTranCreate(ctx) {
        console.log("track tran create");
        await this.trackEvent(ctx, {
            event_type: "tran_create",
            user_id: app.sessionAdapter.readUserIdStr(ctx),
        });
    }

    async trackTranUpdate(userId, tranStatus) {
        console.log("track tran update for " + userId + " to status:" + tranStatus);
        await this.trackEventByUser(userId, {
            event_type: "tran_update",
            user_id: userId && userId.toString(),
            event_properties: {
                newStatus: tranStatus.toString()
            }
        });
    }
}

export const analytics = new Analytics();
