import Telegraf from 'telegraf';
import rp from 'request-promise';
import RedisSession from 'telegraf-session-redis';
import Stage from 'telegraf/stage';
import start from './controllers/start';
import currFrom from './controllers/currFrom';
import curTo from './controllers/curTo';
import amount from './controllers/amount';
import addInfo from './controllers/addInfo';
import estimateExchange from './controllers/estimateExchange';
import checkAgree from './controllers/checkAgree';
import read from './controllers/read';
import startNewExchange from './controllers/startNewExchange';
import { messages } from './messages';
import scenes from './constants/scenes';
import buttons from './constants/buttons';
import { createAnswerByUpdateSubType, pause } from './helpers';
import updateTypes from './constants/updateTypes';
import { keyboards } from './keyboards';
import { getTransactionStatus } from './api';
import { safeReply, safeReplyWithHTML } from "./helpers";
import { app } from './app';

export const bot = new Telegraf(process.env.API_BOT_KEY);


export const stage = new Stage([
  start,
  currFrom,
  curTo,
  amount,
  addInfo,
  estimateExchange,
  checkAgree,
  read,
  startNewExchange
]);

export const session = new RedisSession({
  store: {
    host: process.env.DB_REDIS_HOST || '127.0.0.1',
    port: process.env.DB_REDIS_PORT || 6379,
  }
});

stage.hears([buttons.help, buttons.cancel], async ctx => {
  if (await app.msgInterceptor.interceptedByMsgAge(ctx)) { return; }
  console.log("bot received one of commands [help,cancel]");
  const { text } = ctx.message;

  if (text === buttons.help) {
    await safeReply(ctx, `${messages.support}\n${process.env.CN_EMAIL}`);
    return;
  }

  if (text === buttons.cancel) {
    ctx.session.tradingData = {};
    await ctx.scene.leave();
    await ctx.scene.enter(scenes.startNewExchange);
  }
});

stage.command('start', async (ctx, next) => {
  if (await app.msgInterceptor.interceptedByMsgAge(ctx)) { return; }
  console.log("bot received command [start]");
  await ctx.scene.leave();
  return next();
});

bot.use(session);
bot.use(stage.middleware());

bot.start(async ctx => {
  if (await app.msgInterceptor.interceptedByMsgAge(ctx)) { return; }
  console.log("bot receive 3=start");
  if (ctx.session) {
    ctx.session = null;
  }
  await ctx.scene.enter(scenes.read);
  console.log("bot start processed well");
});

bot.on(updateTypes.message, async (ctx, next) => {
  if (await app.msgInterceptor.interceptedByMsgAge(ctx)) { return; }
  console.log("bot received message");
  try {
    const { session, updateSubTypes, message, scene } = ctx;
    if (message.text.startsWith('/status')) {
      var tranId = message.text.split('_')[1]
      const updatedTrn = await getTransactionStatus(tranId);
      if (updatedTrn) {
        await safeReplyWithHTML(ctx, `status is <b>${updatedTrn.status}</b>`)
        // await safeReply(ctx, {
        // ...updatedTrn
        // });
        // await app.analytics.trackTranUpdate(ctx.session.userId, updatedTrn.status);
        // await safeReply(ctx, `https://changenow.io/exchange/txs/${tranId}`);
      }
      return;
    }

    if ((!session || !session.userId) && !scene.current) {
      await safeReply(ctx, messages.replyForCrash);
      await ctx.scene.leave();
      ctx.session = null;
      await pause(500);
      await ctx.scene.enter(scenes.read);
      console.log("return from message processing");
      return;
    }
    console.log("bot.on continues message processing");
    if (message.text === messages.startNewExchange || message.text === messages.startExchange) {
      var currenciesURL = process.env.CURRENCIES_LIST_LINK;
      if (currenciesURL) {
        // await safeReply(ctx, "Check out supported currencies: " + currenciesURL);
      }

      await ctx.scene.enter(scenes.currFrom);
      return;
    }
    console.log("bot receive 4.2=on");
    const promises = updateSubTypes.map(async type => {
      const textMessage = createAnswerByUpdateSubType(type);
      if (textMessage) {
        await safeReply(ctx, textMessage);
        await pause(500);
      }
    });
    console.log("bot receive 4.3=on");
    await Promise.all(promises);
    console.log("bot receive 4.4=on");
    if (scene.current) {
      if (scene.current.id === scenes.read) {
        console.log("bot receive 4.4.1=on");
        await safeReply(ctx, messages.pressButton);
        return;
      }
      if (scene.current.id === scenes.startNewExchange) {
        // console.log("bot receive 4.4.2=on");
        await safeReply(ctx, messages.pressButton, keyboards.getBackKeyboard());
        return;
      }
      if (scene.current.id === scenes.agree) {
        // console.log("bot receive 4.4.3=on");
        await safeReply(ctx, messages.pressButton);
        return;
      }
      if (scene.current.id === scenes.start && !session.listenPressButton) {
        // console.log("bot receive 4.4.4=on");
        await scene.reenter();
        return;
      }
      if (scene.current.id === scenes.start && session.listenPressButton) {
        // console.log("bot receive 4.4.5=on");
        await safeReply(ctx, messages.pressButton);
        return;
      }
      // console.log("bot receive 4.4.99=on");
    }
    return next();
  } catch (error) {
    await ctx.scene.leave();
    console.log(error)
    return
  }
});

export async function initBot() {
  console.log("bot init ");
  if (process.env.NODE_ENV === 'development') {
    rp(`https://api.telegram.org/bot${process.env.API_BOT_KEY}/deleteWebhook`).then(() =>
      bot.startPolling()
    );
  } else if (process.env.NODE_ENV !== 'development' && process.env.APP_USE_CERTIFICATE == 'true') {

    await bot.telegram.setWebhook(
      `${process.env.APP_EXTERNAL_HOST}/${process.env.API_BOT_KEY}`,
      {
        source: process.env.SSL_CERTIFICATE_PATH
      }
    );
  } else if (process.env.NODE_ENV !== 'development' && process.env.APP_USE_CERTIFICATE == 'false') {
    await bot.telegram.setWebhook(
      `${process.env.APP_EXTERNAL_HOST}/${process.env.API_BOT_KEY}`);
  }
}
