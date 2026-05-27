import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { prisma } from '../index';

export function startCronJobs(bot: Telegraf) {
  // Check every minute for overdue tasks or upcoming deadlines
  cron.schedule('* * * * *', async () => {
    console.log('Running task deadline checker...');
    const now = new Date();
    
    // Fetch admins for notifications
    const admins = await prisma.user.findMany({ where: { isAdmin: true } });
    const notifyAdmins = async (message: string) => {
      for (const admin of admins) {
        if (admin.telegramId && process.env.TELEGRAM_BOT_TOKEN !== 'mock_token_for_now') {
          await bot.telegram.sendMessage(admin.telegramId, message, { parse_mode: 'HTML' }).catch(console.error);
        }
      }
    };

    const pendingTasks = await prisma.task.findMany({
      where: {
        status: { in: ['TO_DO', 'IN_PROGRESS'] }
      },
      include: { assignedUsers: true }
    });

    for (const task of pendingTasks) {
      if (task.assignedUsers.length === 0) continue;

      const timeUntilDeadline = task.deadline.getTime() - now.getTime();
      const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60);

      // 1. Overdue Check
      if (hoursUntilDeadline < 0) {
        await prisma.task.update({
          where: { id: task.id },
          data: { status: 'DELAYED' }
        });

        for (const user of task.assignedUsers) {
          if (!user.telegramId || process.env.TELEGRAM_BOT_TOKEN === 'mock_token_for_now') continue;

          await prisma.user.update({
            where: { id: user.id },
            data: { points: { decrement: 5 } }
          });

          await prisma.pointLog.create({
            data: {
              userId: user.id,
              taskId: task.id,
              amount: -5,
              reason: `Task delayed penalty: ${task.title}`
            }
          });

          bot.telegram.sendMessage(
            user.telegramId,
            `🚨 <b>DEADLINE MISSED</b>\n\nYou failed to complete task #${task.id} on time.\n<b>-5 points</b> have been deducted.`,
            { 
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '💬 Explain Delay', callback_data: `explain_delay_${task.id}` }]
                ]
              }
            }
          ).catch(console.error);
        }

        // Notify admins about the delayed general task
        const assignees = task.assignedUsers.map(u => u.name || 'Unknown').join(', ');
        await notifyAdmins(`🚨 <b>Task Delayed</b>\n\nTask "${task.title}" has passed its deadline and was marked as delayed.\n<b>Assigned to:</b> ${assignees}`);
      } 
      // 2. 4-Hour Warning
      else if (hoursUntilDeadline <= 4 && !task.reminder4hSent) {
        await prisma.task.update({ where: { id: task.id }, data: { reminder4hSent: true } });
        
        for (const user of task.assignedUsers) {
          if (!user.telegramId || process.env.TELEGRAM_BOT_TOKEN === 'mock_token_for_now') continue;
          bot.telegram.sendMessage(
            user.telegramId,
            `⚠️ <b>URGENT REMINDER</b>\n\nYour task "${task.title}" is due in less than 4 hours!`,
            { parse_mode: 'HTML' }
          ).catch(console.error);
        }
      }
      // 3. 24-Hour Warning
      else if (hoursUntilDeadline <= 24 && !task.reminder24hSent) {
        await prisma.task.update({ where: { id: task.id }, data: { reminder24hSent: true } });
        
        for (const user of task.assignedUsers) {
          if (!user.telegramId || process.env.TELEGRAM_BOT_TOKEN === 'mock_token_for_now') continue;
          bot.telegram.sendMessage(
            user.telegramId,
            `🔔 <b>Gentle Reminder</b>\n\nYour task "${task.title}" is due in 24 hours.`,
            { parse_mode: 'HTML' }
          ).catch(console.error);
        }
      }
    }

    // Content Task Checking
    const activeContentTasks = await prisma.contentTask.findMany({
      where: {
        status: { not: 'POSTED' }
      },
      include: { 
        shooters: true, 
        schedulers: true, 
        editors: true, 
        scriptWriters: true, 
        client: true 
      }
    });

    for (const content of activeContentTasks) {
      if (process.env.TELEGRAM_BOT_TOKEN === 'mock_token_for_now') continue;

      // --- Phase-Specific Penalties ---
      
      // 1. Scripting Phase Penalty
      if (content.scriptDeadline && (content.status === 'IDEA' || content.status === 'SCRIPT')) {
        const timeUntilScript = content.scriptDeadline.getTime() - now.getTime();
        if (timeUntilScript < 0 && !content.scriptPenaltyApplied) {
          await prisma.contentTask.update({ where: { id: content.id }, data: { scriptPenaltyApplied: true, status: 'DELAYED' } });
          const writers = content.scriptWriters.map(u => u.name || 'Unknown').join(', ');
          await notifyAdmins(`🚨 <b>Content Delayed</b>\n\nContent "${content.title}" (#${content.contentId}) was delayed at the <b>Scripting</b> phase.\n<b>Responsible:</b> ${writers}`);
          
          for (const user of content.scriptWriters) {
            if (!user.telegramId) continue;
            await prisma.user.update({ where: { id: user.id }, data: { points: { decrement: 5 } } });
            await prisma.pointLog.create({ data: { userId: user.id, amount: -5, reason: `Script delayed penalty: ${content.title}` } });
            bot.telegram.sendMessage(user.telegramId, `🚨 <b>SCRIPT DELAYED</b>\n\nYou failed to complete the script for #${content.contentId} on time. The task has been moved to DELAYED.\n<b>-5 points</b> have been deducted.`, { parse_mode: 'HTML' }).catch(console.error);
          }
        }
      }

      // 2. Shooting Phase Penalty (2 hours after shoot date)
      if (content.shootDate && content.status === 'SHOOT_SCHEDULED') {
        const timeUntilShootEnd = (content.shootDate.getTime() + (2 * 60 * 60 * 1000)) - now.getTime();
        if (timeUntilShootEnd < 0 && !content.shootPenaltyApplied) {
          await prisma.contentTask.update({ where: { id: content.id }, data: { shootPenaltyApplied: true, status: 'DELAYED' } });
          const shooters = content.shooters.map(u => u.name || 'Unknown').join(', ');
          await notifyAdmins(`🚨 <b>Content Delayed</b>\n\nContent "${content.title}" (#${content.contentId}) was delayed at the <b>Shooting</b> phase.\n<b>Responsible:</b> ${shooters}`);

          for (const user of content.shooters) {
            if (!user.telegramId) continue;
            await prisma.user.update({ where: { id: user.id }, data: { points: { decrement: 5 } } });
            await prisma.pointLog.create({ data: { userId: user.id, amount: -5, reason: `Shoot delayed penalty: ${content.title}` } });
            bot.telegram.sendMessage(user.telegramId, `🚨 <b>SHOOT DELAYED</b>\n\nYou failed to mark the shoot as completed for #${content.contentId}. The task has been moved to DELAYED.\n<b>-5 points</b> have been deducted.`, { parse_mode: 'HTML' }).catch(console.error);
          }
        }
      }

      // 3. Editing Phase Penalty
      if (content.editDeadline && (content.status === 'FILMED' || content.status === 'EDITING')) {
        const timeUntilEdit = content.editDeadline.getTime() - now.getTime();
        if (timeUntilEdit < 0 && !content.editPenaltyApplied) {
          await prisma.contentTask.update({ where: { id: content.id }, data: { editPenaltyApplied: true, status: 'DELAYED' } });
          const editors = content.editors.map(u => u.name || 'Unknown').join(', ');
          await notifyAdmins(`🚨 <b>Content Delayed</b>\n\nContent "${content.title}" (#${content.contentId}) was delayed at the <b>Editing</b> phase.\n<b>Responsible:</b> ${editors}`);

          for (const user of content.editors) {
            if (!user.telegramId) continue;
            await prisma.user.update({ where: { id: user.id }, data: { points: { decrement: 5 } } });
            await prisma.pointLog.create({ data: { userId: user.id, amount: -5, reason: `Edit delayed penalty: ${content.title}` } });
            bot.telegram.sendMessage(user.telegramId, `🚨 <b>EDIT DELAYED</b>\n\nYou failed to complete the edit for #${content.contentId} on time. The task has been moved to DELAYED.\n<b>-5 points</b> have been deducted.`, { parse_mode: 'HTML' }).catch(console.error);
          }
        }
      }

      // 4. Overall Deadline Check (Scheduler Penalty)
      const timeUntilContentDeadline = content.deadline.getTime() - now.getTime();
      if (timeUntilContentDeadline < 0 && !content.delayedPenaltyApplied && (content.status === 'REVIEW' || content.status === 'CLIENT_APPROVAL' || content.status === 'SCHEDULED')) {
        await prisma.contentTask.update({ where: { id: content.id }, data: { delayedPenaltyApplied: true, status: 'DELAYED' } });
        const schedulers = content.schedulers.map(u => u.name || 'Unknown').join(', ');
        await notifyAdmins(`🚨 <b>Content Delayed</b>\n\nContent "${content.title}" (#${content.contentId}) was delayed at the <b>Final/Posting</b> phase.\n<b>Responsible:</b> ${schedulers}`);

        for (const user of content.schedulers) {
          if (!user.telegramId) continue;
          await prisma.user.update({ where: { id: user.id }, data: { points: { decrement: 5 } } });
          await prisma.pointLog.create({ data: { userId: user.id, amount: -5, reason: `Posting delayed penalty: ${content.title}` } });
          bot.telegram.sendMessage(user.telegramId, `🚨 <b>DEADLINE MISSED</b>\n\nYou failed to post/schedule #${content.contentId} on time. The task has been moved to DELAYED.\n<b>-5 points</b> have been deducted.`, { parse_mode: 'HTML' }).catch(console.error);
        }
      }

      if (content.status === 'SHOOT_SCHEDULED' && content.shootDate) {
        const timeUntilShoot = content.shootDate.getTime() - now.getTime();
        const hoursUntilShoot = timeUntilShoot / (1000 * 60 * 60);

        // 12-hour reminder
        if (hoursUntilShoot <= 12 && hoursUntilShoot > 4 && !content.reminder12hSent) {
          await prisma.contentTask.update({ where: { id: content.id }, data: { reminder12hSent: true } });
          for (const user of content.shooters) {
            if (user.telegramId) {
              bot.telegram.sendMessage(user.telegramId, `🕒 <b>Shoot Reminder</b>\n\nYou have a shoot scheduled for "${content.title}" in about 12 hours.`, { parse_mode: 'HTML' }).catch(console.error);
            }
          }
        }
        
        // 4-hour reminder
        else if (hoursUntilShoot <= 4 && hoursUntilShoot > 0 && !content.reminder4hSent) {
          await prisma.contentTask.update({ where: { id: content.id }, data: { reminder4hSent: true } });
          for (const user of content.shooters) {
            if (user.telegramId) {
              bot.telegram.sendMessage(user.telegramId, `⚠️ <b>URGENT Shoot Reminder</b>\n\nYou have a shoot scheduled for "${content.title}" in less than 4 hours!`, { parse_mode: 'HTML' }).catch(console.error);
            }
          }
        }

        // 1 hour POST-shoot check
        else if (hoursUntilShoot <= -1 && !content.postShootPromptSent) {
          await prisma.contentTask.update({ where: { id: content.id }, data: { postShootPromptSent: true } });
          for (const user of content.shooters) {
            if (user.telegramId) {
              bot.telegram.sendMessage(user.telegramId, `🎥 <b>Shoot Check</b>\n\nYour scheduled shoot time for "${content.title}" passed an hour ago.\n\nWas this filmed?`, { 
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '🎥 Filmed', callback_data: `content_shoot_filmed_${content.id}` }, { text: '❌ Not Filmed', callback_data: `content_shoot_not_filmed_${content.id}` }]
                  ]
                }
              }).catch(console.error);
            }
          }
        }
      }

      // Auto-Posting when scheduled time is reached
      if (content.status === 'SCHEDULED' && content.postDate) {
        const timeUntilPost = content.postDate.getTime() - now.getTime();
        if (timeUntilPost <= 0) {
          await prisma.contentTask.update({ where: { id: content.id }, data: { status: 'POSTED' } });
          for (const user of content.schedulers) {
            if (user.telegramId) {
              const clientName = content.client?.companyName ? ` (Client: ${content.client.companyName})` : '';
              bot.telegram.sendMessage(user.telegramId, `🎉 <b>Content Auto-Posted</b>\n\nThe content "${content.title}"${clientName} has reached its scheduled time and has been marked as POSTED.`, { parse_mode: 'HTML' }).catch(console.error);
            }
          }
        }
      }
    }
  });
}
