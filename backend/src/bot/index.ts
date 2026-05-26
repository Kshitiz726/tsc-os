import { Telegraf } from 'telegraf';
import { prisma } from '../index';

export function escapeHtml(text: string) {
  if (!text) return text;
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export const userSessions = new Map<string, { 
  awaitingDelayReasonForTaskId?: number;
  awaitingShootDateForTaskId?: number;
  awaitingPostDateForTaskId?: number;
  awaitingRevisionNoteForTaskId?: number;
  awaitingClientNoteForTaskId?: number;
  awaitingTaskRevisionNoteForTaskId?: number;
}>();

// Helper: Notify all admin users on Telegram
async function notifyAdmins(bot: Telegraf, message: string, keyboard?: any) {
  const admins = await prisma.user.findMany({ where: { isAdmin: true } });
  for (const admin of admins) {
    if (!admin.telegramId) continue;
    bot.telegram.sendMessage(admin.telegramId, message, {
      parse_mode: 'HTML',
      ...(keyboard ? { reply_markup: keyboard } : {})
    }).catch(console.error);
  }
}

export function setupBot(): Telegraf {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || 'mock_token_for_now';
  const bot = new Telegraf(botToken);

  // User Registration Flow
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    try {
      let user = await prisma.user.findUnique({ where: { telegramId } });
      if (!user) {
        user = await prisma.user.create({ data: { telegramId, registrationState: 'PENDING_NAME' } });
        await ctx.reply("Welcome to AutoTasker! 👋\n\nLet's set up your profile.\nPlease reply with your full, preferred Name.");
      } else if (user.registrationState === 'PENDING_NAME') {
        await ctx.reply("Please reply with your full Name to continue.");
      } else if (user.registrationState === 'PENDING_PHOTO') {
        await ctx.reply("Please send me a profile picture to complete registration.");
      } else {
        await ctx.reply(`Welcome back ${user.name}! Your account is fully linked and active.`);
      }
    } catch (error) {
      console.error(error);
      ctx.reply('There was an error linking your account. Please contact Admin.');
    }
  });

  // Admin Secret Registration Command: /admin <secret>
  bot.command('admin', async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    const parts = ctx.message.text.split(' ');
    const secret = parts[1];
    const ADMIN_SECRET = process.env.ADMIN_SECRET || 'tsc-admin-2026';
    if (secret !== ADMIN_SECRET) {
      return ctx.reply('❌ Invalid secret. Access denied.');
    }
    let user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      user = await prisma.user.create({ data: { telegramId, isAdmin: true, registrationState: 'PENDING_NAME' } });
      await ctx.reply("✅ Admin Access Granted.\n\nLet's set up your profile.\nPlease reply with your full, preferred Name.");
    } else {
      await prisma.user.update({
        where: { telegramId },
        data: { isAdmin: true }
      });
      if (user.registrationState === 'REGISTERED') {
        await ctx.reply('✅ You are now registered as <b>Admin</b>. You will receive all pipeline update notifications here.', { parse_mode: 'HTML' });
      } else if (user.registrationState === 'PENDING_NAME') {
        await ctx.reply("✅ Admin Access Granted.\nPlease reply with your full, preferred Name.");
      } else if (user.registrationState === 'PENDING_PHOTO') {
        await ctx.reply("✅ Admin Access Granted.\nPlease send me a profile picture to complete registration.");
      }
    }
  });


  // Handle general text messages for Name collection and Delay Reasons
  bot.on('text', async (ctx, next) => {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return next();

    const session = userSessions.get(telegramId);
    if (session?.awaitingDelayReasonForTaskId) {
      const taskId = session.awaitingDelayReasonForTaskId;
      const delayReason = ctx.message.text;
      
      try {
        await prisma.task.update({
          where: { id: taskId },
          data: { delayReason }
        });
        
        // Clear session state
        userSessions.delete(telegramId);
        
        await ctx.reply(`Reason recorded for Task #${taskId}. You can still submit the task once finished by clicking the button below:`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Deliver Task', callback_data: `deliver_delayed_task_${taskId}` }]
            ]
          }
        });
      } catch (e) {
        await ctx.reply('Failed to record reason. Please contact Admin.');
      }
      return;
    }

    if (session?.awaitingShootDateForTaskId) {
      const taskId = session.awaitingShootDateForTaskId;
      const parsedDate = new Date(ctx.message.text);

      if (isNaN(parsedDate.getTime())) {
        await ctx.reply('Invalid date format. Please try again (e.g., 2026-05-20 14:00)');
        return;
      }

      try {
        const content = await prisma.contentTask.update({
          where: { id: taskId },
          data: { shootDate: parsedDate, status: 'SHOOT_SCHEDULED', shootDateConfirmed: false },
          include: { client: true }
        });
        userSessions.delete(telegramId);
        await ctx.reply(`📅 Shoot date proposed: <b>${parsedDate.toLocaleString()}</b>\n\nWaiting for Admin approval.`, { parse_mode: 'HTML' });

        // Notify all admins with approve / change date buttons
        await notifyAdmins(bot,
          `📅 <b>Shoot Date Proposed</b>\n\n<b>Content ID:</b> ${content.contentId}\n<b>Client:</b> ${content.client?.companyName || 'None'}\n<b>Proposed Date:</b> ${parsedDate.toLocaleString()}\n\nPlease approve or request a different date.`,
          {
            inline_keyboard: [
              [
                { text: '✅ Approve Date', callback_data: `admin_approve_shoot_${content.id}` },
                { text: '📅 Change Date', callback_data: `admin_change_shoot_${content.id}` }
              ]
            ]
          }
        );
      } catch (e) {
        await ctx.reply('Failed to save shoot date.');
      }
      return;
    }

    if (session?.awaitingPostDateForTaskId) {
      const taskId = session.awaitingPostDateForTaskId;
      const parsedDate = new Date(ctx.message.text);

      if (isNaN(parsedDate.getTime())) {
        await ctx.reply('Invalid date format. Please try again (e.g., 2026-05-20 14:00)');
        return;
      }

      try {
        const content = await prisma.contentTask.update({
          where: { id: taskId },
          data: { postDate: parsedDate, status: 'APPROVED' },
          include: { schedulers: true, client: true }
        });
        userSessions.delete(telegramId);
        await ctx.reply(`✅ Post date set! The content is now APPROVED and the schedulers have been notified.`, { parse_mode: 'HTML' });

        const finalLinkLine = content.finalFolderLink ? `\n📁 <b>Final Content:</b> <a href="${content.finalFolderLink}">Final Content Folder</a>` : '';
        for (const scheduler of content.schedulers) {
          if (!scheduler.telegramId) continue;
          bot.telegram.sendMessage(
            scheduler.telegramId,
            `✅ <b>Content Approved — Schedule Now</b>\n\n<b>Content ID:</b> ${content.contentId}\n<b>Client:</b> ${content.client?.companyName || 'None'}\n<b>Post Date:</b> ${parsedDate.toLocaleString()}${finalLinkLine}\n\nThis content is approved. Please schedule it for the requested date.`,
            { 
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: [[{ text: '📅 Scheduled', callback_data: `content_mark_scheduled_${content.id}` }]] }
            }
          ).catch(console.error);
        }
      } catch (e) {
        await ctx.reply('Failed to save post date.');
      }
      return;
    }

    if (session?.awaitingRevisionNoteForTaskId) {
      const taskId = session.awaitingRevisionNoteForTaskId;
      const note = ctx.message.text;
      try {
        const content = await prisma.contentTask.update({
          where: { id: taskId },
          data: { status: 'EDITING' },
          include: { editors: true, client: true }
        });
        userSessions.delete(telegramId);
        await ctx.reply(`✅ Revision notes sent to the editors!`, { parse_mode: 'HTML' });
        for (const editor of content.editors) {
          if (!editor.telegramId) continue;
          const finalLinkLine = content.finalFolderLink ? `\n📁 <a href="${content.finalFolderLink}">Final Content Folder</a>\n` : '';
          bot.telegram.sendMessage(
            editor.telegramId,
            `🔄 <b>Internal Revision Requested</b>\n\n<b>Content ID:</b> ${content.contentId}\n<b>Admin Notes:</b>\n<i>${note}</i>\n${finalLinkLine}\nPlease revise and reupload the content (replacing the old one) considering the requirements and revision requests, and click "Editing Done" again when ready.`,
            { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '✅ Editing Done', callback_data: `content_editing_done_${content.id}` }]] } }
          ).catch(console.error);
        }
      } catch (e) { await ctx.reply('Failed to send revision note.'); }
      return;
    }

    if (session?.awaitingClientNoteForTaskId) {
      const taskId = session.awaitingClientNoteForTaskId;
      const note = ctx.message.text;
      try {
        const content = await prisma.contentTask.update({
          where: { id: taskId },
          data: { status: 'EDITING' },
          include: { editors: true, client: true }
        });
        userSessions.delete(telegramId);
        await ctx.reply(`✅ Client feedback sent to the editors!`, { parse_mode: 'HTML' });
        for (const editor of content.editors) {
          if (!editor.telegramId) continue;
          const finalLinkLine = content.finalFolderLink ? `\n📁 <a href="${content.finalFolderLink}">Final Content Folder</a>\n` : '';
          bot.telegram.sendMessage(
            editor.telegramId,
            `❌ <b>Client Revision Requested</b>\n\n<b>Content ID:</b> ${content.contentId}\n<b>Client Feedback:</b>\n<i>${note}</i>\n${finalLinkLine}\nPlease revise and reupload the content (replacing the old one) considering the requirements and revision requests, and click "Editing Done" again when ready.`,
            { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '✅ Editing Done', callback_data: `content_editing_done_${content.id}` }]] } }
          ).catch(console.error);
        }
      } catch (e) { await ctx.reply('Failed to send client note.'); }
      return;
    }

    if (session?.awaitingTaskRevisionNoteForTaskId) {
      const taskId = session.awaitingTaskRevisionNoteForTaskId;
      const note = ctx.message.text;
      try {
        const task = await prisma.task.update({
          where: { id: taskId },
          data: { status: 'IN_PROGRESS' },
          include: { assignedUsers: true }
        });
        userSessions.delete(telegramId);
        await ctx.reply(`✅ Revision notes sent to the assignee!`, { parse_mode: 'HTML' });
        for (const user of task.assignedUsers) {
          if (!user.telegramId) continue;
          bot.telegram.sendMessage(
            user.telegramId,
            `🔄 <b>Task Revision Requested</b>\n\n<b>Task:</b> ${escapeHtml(task.title)}\n<b>Admin Notes:</b>\n<i>${escapeHtml(note)}</i>\n\nPlease revise the task and submit for review again.`,
            { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '✅ Deliver Task', callback_data: `deliver_delayed_task_${task.id}` }]] } }
          ).catch(console.error);
        }
      } catch (e) { await ctx.reply('Failed to send revision note.'); }
      return;
    }

    const user = await prisma.user.findUnique({ where: { telegramId } });
    
    if (user && user.registrationState === 'PENDING_NAME' && !ctx.message.text.startsWith('/')) {
      const chosenName = ctx.message.text;
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: chosenName,
          registrationState: 'PENDING_PHOTO'
        }
      });
      
      await ctx.reply(`Thanks, ${chosenName}! \n\nNow, please send me a professional profile picture (just upload an image here).`);
    } else {
      return next();
    }
  });

  // Handle photo messages for Photo collection
  bot.on('photo', async (ctx, next) => {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return next();

    const user = await prisma.user.findUnique({ where: { telegramId } });
    
    if (user && user.registrationState === 'PENDING_PHOTO') {
      // Get the highest resolution photo from the array
      const photoArray = ctx.message.photo;
      const bestPhoto = photoArray[photoArray.length - 1];
      const fileId = bestPhoto.file_id;
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          photoUrl: fileId,
          registrationState: 'REGISTERED'
        }
      });
      
      await ctx.reply("Awesome! Your profile is completely set up. You will receive task assignments right here.");
    } else {
      return next();
    }
  });

  // Employee Hub Commands
  bot.command('stats', async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    const user = await prisma.user.findUnique({ where: { telegramId }, include: { tasks: true } });
    if (!user || user.registrationState !== 'REGISTERED') return ctx.reply('Please complete your registration first.');

    const completedTasks = user.tasks.filter(t => t.status === 'COMPLETED').length;
    const overdueTasks = user.tasks.filter(t => t.status === 'OVERDUE').length;
    let tier = 'Warning 🔴';
    if (user.points >= 50) tier = 'Elite 🏆';
    else if (user.points >= 0) tier = 'Good 📈';

    await ctx.reply(
      `📊 <b>Your Performance Stats</b>\n\n` +
      `<b>Total Points:</b> ${user.points}\n` +
      `<b>Rating Tier:</b> ${tier}\n\n` +
      `<b>Tasks Completed:</b> ${completedTasks}\n` +
      `<b>Tasks Overdue:</b> ${overdueTasks}`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('tasks', async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    const user = await prisma.user.findUnique({ where: { telegramId }, include: { tasks: true } });
    if (!user || user.registrationState !== 'REGISTERED') return ctx.reply('Please complete your registration first.');

    const pending = user.tasks.filter(t => ['PENDING', 'IN_PROGRESS'].includes(t.status));
    if (pending.length === 0) return ctx.reply('You have no pending tasks. Great job! 🎉');

    const taskList = pending.map(t => `- <b>${t.description}</b>\n  Due: ${t.deadline.toLocaleString()}`).join('\n\n');
    await ctx.reply(`📋 <b>Your Pending Tasks:</b>\n\n${taskList}`, { parse_mode: 'HTML' });
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `🤖 <b>AutoTasker Bot Commands</b>\n\n` +
      `/start - Register or check status\n` +
      `/tasks - View your pending tasks\n` +
      `/stats - View your performance points & rating\n` +
      `/help - Show this menu`,
      { parse_mode: 'HTML' }
    );
  });

  // Handle "Acknowledge" inline button callbacks
  bot.action(/ack_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      await prisma.task.update({ where: { id: taskId }, data: { status: 'IN_PROGRESS' } });
      await ctx.editMessageText(`Task #${taskId} acknowledged! You've marked it as Received.`);
      await ctx.reply(`When you finish Task #${taskId}, click below to submit it for review:`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Submit for Review', callback_data: `mark_done_${taskId}` }]
          ]
        }
      });
    } catch (error) { ctx.answerCbQuery('Failed to update task.'); }
  });

  bot.action(/work_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      await prisma.task.update({ where: { id: taskId }, data: { status: 'IN_PROGRESS' } });
      await ctx.editMessageText(`Task #${taskId} is now In Progress!`);
      await ctx.reply(`When you finish Task #${taskId}, click below to submit it for review:`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Submit for Review', callback_data: `mark_done_${taskId}` }]
          ]
        }
      });
    } catch (error) { ctx.answerCbQuery('Failed to update task.'); }
  });

  // Handle "Mark as Done" inline button callbacks
  bot.action(/mark_done_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      const task = await prisma.task.findUnique({ where: { id: taskId }});
      if (task?.status === 'COMPLETED') {
        await ctx.answerCbQuery('Task is already completed!');
        return;
      }

      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'WAITING_APPROVAL' }
      });
      
      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch (e) {} // ignore if it fails to remove keyboard

      await ctx.reply(`✅ Task #${taskId} submitted for review! Admin will check it shortly.`);
      await ctx.answerCbQuery('Task submitted!');
    } catch (error) {
      console.error('Submit task error:', error);
      ctx.answerCbQuery('Failed to submit task.');
    }
  });

  // Handle Delay Explanation Workflow
  bot.action(/explain_delay_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    
    // Set session state
    userSessions.set(telegramId, { awaitingDelayReasonForTaskId: taskId });
    
    await ctx.reply(`Please reply to this message with the reason for the delay on Task #${taskId}.`);
    await ctx.answerCbQuery();
  });

  bot.action(/deliver_delayed_task_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'WAITING_APPROVAL' }
      });
      
      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch (e) {} 
      
      await ctx.reply(`📦 Late submission for Task #${taskId} sent to Admin for review!`);
      await ctx.answerCbQuery('Task submitted!');
    } catch (e) {
      ctx.answerCbQuery('Failed to submit task.');
    }
  });

  // CONTENT PIPELINE ACTIONS
  bot.action(/content_action_schedule_shoot_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    
    userSessions.set(telegramId, { awaitingShootDateForTaskId: taskId });
    await ctx.reply(`Please reply with the exact Date & Time for the shoot of Content #${taskId}.\n\nFormat: YYYY-MM-DD HH:MM\nExample: 2026-05-20 14:30`);
    await ctx.answerCbQuery();
  });

  bot.action(/content_action_set_post_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    
    userSessions.set(telegramId, { awaitingPostDateForTaskId: taskId });
    await ctx.reply(`Please reply with the exact Date & Time to post Content #${taskId}.\n\nFormat: YYYY-MM-DD HH:MM\nExample: 2026-05-25 18:00`);
    await ctx.answerCbQuery();
  });

  // ONE-CLICK: Script Uploaded (no file upload needed, employee uploads to Drive directly)
  bot.action(/^content_action_upload_script_(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      const content = await prisma.contentTask.update({
        where: { id: taskId },
        data: { status: 'SCRIPT' },
        include: { shooters: true, client: true }
      });
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
      await ctx.reply('✅ Script marked as uploaded! The shooters have been notified.');
      await ctx.answerCbQuery('Script confirmed!');

      // Notify admin
      await notifyAdmins(bot,
        `📝 <b>Script Uploaded</b>\n\n<b>Content ID:</b> ${content.contentId}\n<b>Client:</b> ${content.client?.companyName || 'None'}\n\nThe script writer has confirmed the script is ready. Shooters have been notified.`
      );

      // Notify shooters with specific deadline
      const durationMs = new Date(content.deadline).getTime() - new Date(content.createdAt).getTime();
      const shootDeadline = new Date(new Date(content.createdAt).getTime() + durationMs * 0.50);
      const rawLink = content.rawFolderLink ? `<a href="${content.rawFolderLink}">Raw Footage folder on Drive</a>` : 'Raw Footage folder on Drive';

      const scriptLink = content.scriptFolderLink ? `<a href="${content.scriptFolderLink}">Script Link</a>` : 'Script folder on Drive';

      for (const shooter of content.shooters) {
        if (!shooter.telegramId) continue;
        bot.telegram.sendMessage(
          shooter.telegramId,
          `🎬 <b>Script Ready for Shoot</b>\n\n<b>Content ID:</b> ${content.contentId}\n<b>Client:</b> ${content.client?.companyName || 'None'}\n<b>Deadline:</b> ${shootDeadline.toLocaleString()}\n\nThe script is ready.\n${scriptLink}\n\nPlease provide a date you are free for the shoot.`,
          {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: '📅 Schedule Shoot', callback_data: `content_action_schedule_shoot_${content.id}` }]] }
          }
        ).catch(console.error);
      }
    } catch(e) { console.error(e); await ctx.answerCbQuery('Error'); }
  });

  bot.action(/content_action_schedule_shoot_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    userSessions.set(telegramId, { awaitingShootDateForTaskId: taskId });
    await ctx.reply(`Please reply with the Date & Time you are free for the shoot.\n\nFormat: YYYY-MM-DD HH:MM\nExample: 2026-05-20 14:30`);
    await ctx.answerCbQuery();
  });

  bot.action(/content_action_set_post_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    userSessions.set(telegramId, { awaitingPostDateForTaskId: taskId });
    await ctx.reply(`Please reply with the Date & Time to post Content #${taskId}.\n\nFormat: YYYY-MM-DD HH:MM`);
    await ctx.answerCbQuery();
  });


  // EMPLOYEE CONFIRMS SHOOT DATE → lock it, show raw footage link, notify admin
  bot.action(/content_shoot_ok_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      const content = await prisma.contentTask.update({
        where: { id: taskId },
        data: { shootDateConfirmed: true },
        include: { client: true }
      });
      const rawLinkLine = content.rawFolderLink
        ? `<a href="${content.rawFolderLink}">Raw Footage Folder</a>`
        : 'Raw Footage folder on Drive';

      await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
      await ctx.reply(
        `✅ <b>You confirmed the shoot date!</b>\n\nWhen the shoot is complete, please upload the raw footage and click the button below.\n\n📁 <b>Upload raw footage here:</b> ${rawLinkLine}`,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '🎥 Filmed', callback_data: `content_shoot_filmed_${taskId}` }]] }
        }
      );
      await ctx.answerCbQuery('Shoot date confirmed!');

      // Notify admin — shoot date is now locked
      await notifyAdmins(bot,
        `✅ <b>Shoot Date Confirmed</b>\n\n<b>Content ID:</b> ${content.contentId}\n<b>Client:</b> ${content.client?.companyName || 'None'}\n<b>Date:</b> ${content.shootDate ? new Date(content.shootDate).toLocaleString() : 'N/A'}\n\nThe shooter has confirmed this date. ✅ Date is now locked.`
      );
    } catch(e) { console.error(e); }
  });

  // EMPLOYEE REJECTS SHOOT DATE → notify admin, let admin know they need to reschedule
  bot.action(/content_shoot_not_ok_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const telegramId = ctx.from?.id.toString();
    if (telegramId) userSessions.set(telegramId, { awaitingShootDateForTaskId: taskId });
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
    await ctx.reply('❌ You rejected the shoot date. Please reply with the Date & Time you are free (YYYY-MM-DD HH:MM).');
    await ctx.answerCbQuery();

    // Notify admin
    const content = await prisma.contentTask.findUnique({ where: { id: taskId }, include: { client: true } });
    if (content) {
      await notifyAdmins(bot,
        `❌ <b>Shoot Date Rejected</b>\n\n<b>Content ID:</b> ${content.contentId}\n<b>Client:</b> ${content.client?.companyName || 'None'}\n\nThe shooter rejected the proposed date. They are providing an alternative. You can propose a new date from the dashboard.`
      );
    }
  });

  // FILMED → notify editors + admin
  bot.action(/content_shoot_filmed_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      const content = await prisma.contentTask.update({
        where: { id: taskId },
        data: { status: 'FILMED' },
        include: { editors: true, client: true }
      });
      await ctx.reply('🎉 Great job! Marked as FILMED. The editors have been notified.');
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
      await ctx.answerCbQuery('Marked as Filmed!');

      // Notify admin
      await notifyAdmins(bot,
        `🎥 <b>Filming Complete</b>\n\n<b>Content ID:</b> ${content.contentId}\n<b>Client:</b> ${content.client?.companyName || 'None'}\n\nThe shooter has marked the content as FILMED. Editors have been notified.`
      );

      // Notify editors with specific deadline
      const durationMs = new Date(content.deadline).getTime() - new Date(content.createdAt).getTime();
      const editDeadline = new Date(new Date(content.createdAt).getTime() + durationMs * 0.75);

      for (const editor of content.editors) {
        if (!editor.telegramId) continue;
        const rawLinkLine = content.rawFolderLink
          ? `\n📁 <b>Raw Footage:</b> <a href="${content.rawFolderLink}">Raw Footage Folder</a>`
          : `\n<b>Raw Footage:</b> ${content.driveLink || 'No link provided'}`;
        const finalLinkLine = content.finalFolderLink
          ? `\n📁 <b>Upload final video here:</b> <a href="${content.finalFolderLink}">Final Content Folder</a>`
          : `\nUpload to the <b>Final Content</b> folder inside: ${content.contentId}`;
        
        bot.telegram.sendMessage(
          editor.telegramId,
          `✂️ <b>New video to edit</b>\n\n<b>Content ID:</b> ${content.contentId}${rawLinkLine}\n<b>Editing Deadline:</b> ${editDeadline.toLocaleString()}\n\nOnce edited, upload final video here:${finalLinkLine}\n\nClick below when done.`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[{ text: '✅ Editing Done', callback_data: `content_editing_done_${content.id}` }]]
            }
          }
        ).catch(console.error);
      }
    } catch(e) { console.error(e); }
  });

  bot.action(/content_shoot_not_filmed_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    await ctx.reply('❌ Marked as NOT FILMED. Admin has been notified.');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
    await ctx.answerCbQuery();
    const content = await prisma.contentTask.findUnique({ where: { id: taskId }, include: { client: true } });
    if (content) {
      await notifyAdmins(bot,
        `⚠️ <b>Shoot Not Filmed</b>\n\n<b>Content ID:</b> ${content.contentId}\n<b>Client:</b> ${content.client?.companyName || 'None'}\n\nThe shooter indicated the content was <b>NOT filmed</b> after the scheduled time. Please reschedule.`,
        { inline_keyboard: [[{ text: '🗓 Reschedule from Dashboard', url: 'http://localhost:3000' }]] }
      );
    }
  });

  // EDITING DONE → notify admin for INTERNAL review (do not notify schedulers yet)
  bot.action(/content_editing_done_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      const content = await prisma.contentTask.update({
        where: { id: taskId },
        data: { status: 'REVIEW' },
        include: { client: true }
      });
      await ctx.reply('✅ Editing marked as done. Admin has been notified for Internal Review!');
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
      await ctx.answerCbQuery();

      const finalLinkLine = content.finalFolderLink
        ? `\n📁 <a href="${content.finalFolderLink}">Final Content Folder</a>`
        : '';
      
      // Notify admin for internal review
      await notifyAdmins(bot,
        `✂️ <b>Editing Complete — Internal Review Required</b>\n\n<b>Content ID:</b> ${content.contentId}\n<b>Client:</b> ${content.client?.companyName || 'None'}${finalLinkLine}\n\nThe editor has finished. Please review it internally before sending to the client.`,
        {
          inline_keyboard: [
            [{ text: '✅ Pass to Client Review', callback_data: `admin_pass_client_${content.id}` }],
            [{ text: '📅 Approve & Schedule', callback_data: `admin_client_approve_${content.id}` }, { text: '❌ Request Revision', callback_data: `admin_revise_content_${content.id}` }]
          ]
        }
      );
    } catch(e) { console.error(e); }
  });

  // ADMIN: Request internal revision
  bot.action(/admin_revise_content_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    const content = await prisma.contentTask.findUnique({ where: { id: taskId } });
    if (!content) return;
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
    await ctx.reply(`Please reply with the revision notes you want to send to the editor for <b>${content.contentId}</b>.`, { parse_mode: 'HTML' });
    userSessions.set(telegramId, { awaitingRevisionNoteForTaskId: taskId });
    await ctx.answerCbQuery();
  });

  // ADMIN: Pass to Client Review
  bot.action(/admin_pass_client_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      const content = await prisma.contentTask.update({
        where: { id: taskId },
        data: { status: 'CLIENT_APPROVAL' },
        include: { client: true }
      });
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
      await ctx.reply(`✅ Content <b>${content.contentId}</b> moved to Client Approval stage.\n\nOnce the client has reviewed it, please mark their decision below:`, { 
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Client Approved', callback_data: `admin_client_approve_${content.id}` }, { text: '❌ Client Rejected', callback_data: `admin_client_reject_${content.id}` }]
          ]
        }
      });
      await ctx.answerCbQuery('Passed to client review');
    } catch(e) { console.error(e); }
  });

  // SCHEDULER: Mark as Scheduled
  bot.action(/content_mark_scheduled_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      await prisma.contentTask.update({
        where: { id: taskId },
        data: { status: 'SCHEDULED' }
      });
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
      await ctx.reply('✅ Content marked as Scheduled! The system will move it to Posted when the time comes.');
      await ctx.answerCbQuery('Scheduled!');
    } catch (e) { console.error(e); }
  });

  // ADMIN: Client Rejected -> Get notes
  bot.action(/admin_client_reject_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    const content = await prisma.contentTask.findUnique({ where: { id: taskId } });
    if (!content) return;
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
    await ctx.reply(`Please reply with the client's feedback/changes needed for <b>${content.contentId}</b>. This will be sent back to the editor.`, { parse_mode: 'HTML' });
    userSessions.set(telegramId, { awaitingClientNoteForTaskId: taskId });
    await ctx.answerCbQuery();
  });

  // ADMIN: Client Approved -> Ask for post date to schedule
  bot.action(/admin_client_approve_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    const content = await prisma.contentTask.findUnique({ where: { id: taskId } });
    if (!content) return;
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
    await ctx.reply(`🎉 Client Approved <b>${content.contentId}</b>!\n\nWhen do you want to schedule this content?\nPlease reply with the Date & Time (Format: YYYY-MM-DD HH:MM).`, { parse_mode: 'HTML' });
    userSessions.set(telegramId, { awaitingPostDateForTaskId: taskId });
    await ctx.answerCbQuery();
  });
  bot.action(/admin_approve_task_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      const oldTask = await prisma.task.findUnique({ where: { id: taskId }, include: { assignedUsers: true } });
      if (!oldTask || oldTask.status === 'COMPLETED') return ctx.answerCbQuery('Already completed or not found.');

      const task = await prisma.task.update({
        where: { id: taskId },
        data: { status: 'COMPLETED' },
        include: { assignedUsers: true }
      });
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
      await ctx.reply(`✅ Task approved and marked as Completed.`);
      
      for (const user of task.assignedUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: { points: { increment: 10 } }
        });
        if (user.telegramId) {
          bot.telegram.sendMessage(
            user.telegramId,
            `🎉 <b>Task Approved!</b>\n\nYour task "${escapeHtml(task.title)}" was approved and marked as Completed!\n<b>+10 Points</b> added to your profile!`,
            { parse_mode: 'HTML' }
          ).catch(console.error);
        }
      }
      await ctx.answerCbQuery('Task Approved!');
    } catch (e) { console.error(e); }
  });

  bot.action(/admin_approve_task_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      const task = await prisma.task.findUnique({ 
        where: { id: taskId },
        include: { assignedUsers: true }
      });
      if (!task) return ctx.answerCbQuery('Task not found');
      if (task.status === 'COMPLETED') return ctx.answerCbQuery('Task already completed');

      // Update task status
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'COMPLETED' }
      });

      // Reward points to all assigned users
      for (const user of task.assignedUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: { points: { increment: 10 } }
        });

        if (user.telegramId) {
          bot.telegram.sendMessage(
            user.telegramId,
            `🎉 <b>Task Approved!</b>\n\nYour task "<b>${escapeHtml(task.title)}</b>" has been approved by the admin!\n\n<b>+10 Points</b> have been added to your profile! Keep up the great work! 🚀`,
            { parse_mode: 'HTML' }
          ).catch(console.error);
        }
      }

      await ctx.editMessageText(`✅ <b>Task Approved</b>\n\nYou have approved the task "<b>${escapeHtml(task.title)}</b>". The team has been notified and points have been awarded.`, { parse_mode: 'HTML' });
      await ctx.answerCbQuery('Task approved!');
    } catch (error) {
      console.error('Admin approve task error:', error);
      ctx.answerCbQuery('Error approving task');
    }
  });

  bot.action(/admin_revise_task_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return;
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
    await ctx.reply(`Please reply with the revision requests/notes for task <b>${escapeHtml(task.title)}</b>. This will be sent back to the assignee.`, { parse_mode: 'HTML' });
    userSessions.set(telegramId, { awaitingTaskRevisionNoteForTaskId: taskId });
    await ctx.answerCbQuery();
  });


  // ADMIN: Approve shoot date → notify shooter to confirm
  bot.action(/admin_approve_shoot_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    try {
      const content = await prisma.contentTask.findUnique({ where: { id: taskId }, include: { shooters: true, client: true } });
      if (!content) return ctx.answerCbQuery('Task not found');
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
      await ctx.reply(`✅ You approved the shoot date for <b>${content.contentId}</b>. The shooter has been asked to confirm.`, { parse_mode: 'HTML' });
      await ctx.answerCbQuery('Date approved!');

      for (const shooter of content.shooters) {
        if (!shooter.telegramId) continue;
        bot.telegram.sendMessage(
          shooter.telegramId,
          `📅 <b>Shoot Date Approved</b>\n\nAdmin has approved the shoot date for <b>${content.contentId}</b>.\n<b>Date:</b> ${content.shootDate ? new Date(content.shootDate).toLocaleString() : 'N/A'}\n\nPlease confirm this is still okay for you.`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[
                { text: '✅ Confirm', callback_data: `content_shoot_ok_${content.id}` },
                { text: '❌ Not Okay', callback_data: `content_shoot_not_ok_${content.id}` }
              ]]
            }
          }
        ).catch(console.error);
      }
    } catch(e) { console.error(e); }
  });

  // ADMIN: Request date change → admin types new date (session)
  bot.action(/admin_change_shoot_(\d+)/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;
    const content = await prisma.contentTask.findUnique({ where: { id: taskId } });
    if (!content) return ctx.answerCbQuery('Task not found');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {});
    await ctx.reply(`Please reply with the new shoot date you want to propose for <b>${content.contentId}</b>.\n\nFormat: YYYY-MM-DD HH:MM`, { parse_mode: 'HTML' });
    // Store in session as a shoot date for admin — reuse same handler
    userSessions.set(telegramId, { awaitingShootDateForTaskId: taskId });
    await ctx.answerCbQuery();
  });

  return bot;
}

export function sendTaskNotification(bot: Telegraf, telegramId: string, taskTitle: string, description: string | null, deadline: any, taskId: number, driveLink: string | null) {
  const safeTitle = escapeHtml(taskTitle || 'Untitled Task');
  const descLine = description ? `\n<b>Description:</b>\n${escapeHtml(description)}\n` : '';
  const driveLine = driveLink ? `\n\nif the task is related to uploading content, upload it to the drive:\n<a href="${driveLink}">Open Drive Folder</a>` : '';
  
  const dateStr = (deadline instanceof Date && !isNaN(deadline.getTime())) 
    ? deadline.toLocaleString() 
    : (typeof deadline === 'string' ? deadline : 'N/A');

  console.log(`Bot: Sending task notification to ${telegramId} for task ${taskId}`);

  bot.telegram.sendMessage(
    telegramId,
    `📋 <b>New Task Assigned</b>\n\n<b>New Task:</b> ${safeTitle}${descLine}\n<b>Deadline:</b> ${dateStr}${driveLine}\n\nPlease acknowledge this task:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👍 Received the task', callback_data: `ack_${taskId}` },
            { text: '🛠️ Working on it', callback_data: `work_${taskId}` }
          ]
        ]
      }
    }
  ).then(() => {
    console.log(`Bot: Successfully sent task notification to ${telegramId}`);
  }).catch(err => {
    console.error(`Bot: Error sending task notification to ${telegramId}:`, err);
  });
}
