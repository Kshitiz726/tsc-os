import { Express } from 'express';
import { prisma } from '../index';
import { setupBot, sendTaskNotification, escapeHtml } from '../bot';
import multer from 'multer';
import { createFolder, setupContentFolders, setupGeneralTaskFolder, deleteDriveFolder } from '../utils/googleDrive';

const upload = multer({ storage: multer.memoryStorage() });

function getClientShortCode(name?: string | null) {
  if (!name) return 'INT';
  const lowerName = name.toLowerCase();
  if (lowerName === 'muncheez' || lowerName.includes('muncheez')) return 'MZ';
  if (lowerName === 'big juicy burgers' || lowerName.includes('big juicy') || lowerName.includes('bigjuicy')) return 'BJB';
  const words = name.trim().split(/\s+/);
  if (words.length > 1) {
    return words.map(w => w[0].toUpperCase()).join('').substring(0, 3);
  }
  return name.substring(0, 3).toUpperCase();
}

export function setupRoutes(app: Express, bot: any) {
  const getArray = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.includes(',')) return val.split(',');
    return [val];
  };

  // Get all users (Leaderboard / Team)
  app.get('/api/users', async (req, res) => {
    const users = await prisma.user.findMany({
      where: { registrationState: 'REGISTERED' },
      orderBy: { points: 'desc' },
      include: { tasks: { include: { client: true } }, contentShoots: true, contentSchedules: true, contentWrites: true, contentEdits: true, payments: true, privateJobs: true }
    });
    res.json(users);
  });

  // Delete a user
  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const userId = Number(id);

      // Remove createdById references
      await prisma.task.updateMany({
        where: { createdById: userId },
        data: { createdById: null }
      });
      await prisma.contentTask.updateMany({
        where: { createdById: userId },
        data: { createdById: null }
      });

      // Get the user to save their name
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const employeeName = user?.name || 'Unknown Employee';

      // Disconnect financial records instead of deleting
      await prisma.pointLog.deleteMany({ where: { userId } });
      await prisma.employeePayment.updateMany({ 
        where: { userId },
        data: { userId: null, employeeName }
      });
      await prisma.privateJob.updateMany({ 
        where: { userId },
        data: { userId: null, employeeName }
      });

      // Delete the user
      await prisma.user.delete({ where: { id: userId } });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Get all tasks
  app.get('/api/tasks', async (req, res) => {
    const tasks = await prisma.task.findMany({
      include: { assignedUsers: true, createdBy: true, client: true },
      orderBy: { deadline: 'asc' }
    });
    res.json(tasks);
  });

  // Create new task
  app.post('/api/tasks', upload.array('files'), async (req, res) => {
    const files = req.files as Express.Multer.File[];
    const { title, description, deadline, priority, recurring, createdById, clientId } = req.body;
    const assignedUserIds = getArray(req.body.assignedUserIds).filter((id: any) => id && id !== 'null' && id !== 'undefined');
    
    try {
      console.log(`Creating task: ${title}, assigned to: ${assignedUserIds}`);
      // Create the DB record first to get the assigned users and client details
      const initialTask = await prisma.task.create({
        data: {
          title,
          description,
          deadline: deadline ? new Date(deadline) : new Date(),
          priority: priority || 'MEDIUM',
          recurring,
          assignedUsers: { connect: assignedUserIds.map((id: any) => ({ id: Number(id) })) },
          createdById: createdById ? Number(createdById) : undefined,
          clientId: clientId ? Number(clientId) : undefined,
          status: 'TO_DO'
        },
        include: { assignedUsers: true, client: true }
      });

      // Generate Task ID
      const clientShortCode = getClientShortCode(initialTask.client?.companyName);
      const assigneesSafe = initialTask.assignedUsers.map(u => u.name?.split(' ')[0] || 'User').join('_') || 'Unassigned';
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      
      const generatedTaskId = `TSC_${clientShortCode}_${assigneesSafe}_${dateStr}_${timeStr}`;

      // Setup Google Drive Folder
      const folderRes = await setupGeneralTaskFolder(generatedTaskId);

      // Update Task with generated ID and Drive Folder
      const task = await prisma.task.update({
        where: { id: initialTask.id },
        data: {
          taskId: generatedTaskId,
          driveFolderId: folderRes?.id || null,
          driveFolderLink: folderRes?.link || null
        },
        include: { assignedUsers: true }
      });

      if (process.env.TELEGRAM_BOT_TOKEN !== 'mock_token_for_now') {
        console.log(`Sending notifications for task ${task.id} to ${task.assignedUsers.length} users`);
        for (const user of task.assignedUsers) {
          if (user.telegramId) {
            console.log(`Sending task notification to ${user.name} (${user.telegramId})`);
            try {
              await sendTaskNotification(bot, user.telegramId, task.title, task.description || null, task.deadline, task.id, task.driveFolderLink);
              
              if (files && files.length > 0) {
                for (const file of files) {
                  await bot.telegram.sendDocument(user.telegramId, {
                    source: file.buffer,
                    filename: file.originalname
                  }).catch(console.error);
                }
              }
              console.log(`Successfully sent all notifications to ${user.name}`);
            } catch (notifyError) {
              console.error(`Failed to send notification to ${user.name}:`, notifyError);
            }
          } else {
            console.log(`User ${user.name} has no telegramId`);
          }
        }
      }

      res.status(201).json(task);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Update task status
  app.put('/api/tasks/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 
    try {
      const oldTask = await prisma.task.findUnique({ where: { id: Number(id) }, include: { assignedUsers: true } });
      if (!oldTask) return res.status(404).json({ error: 'Task not found' });

      const task = await prisma.task.update({
        where: { id: Number(id) },
        data: { status },
        include: { assignedUsers: true }
      });

      // Increment points if newly completed
      if (oldTask.status !== 'COMPLETED' && status === 'COMPLETED') {
        for (const user of task.assignedUsers) {
          await prisma.user.update({
            where: { id: user.id },
            data: { points: { increment: 10 } }
          });
        }
      }

      if (process.env.TELEGRAM_BOT_TOKEN !== 'mock_token_for_now') {
        for (const user of task.assignedUsers) {
          if (!user.telegramId) continue;
          if (status === 'CANCELLED') {
            bot.telegram.sendMessage(
              user.telegramId,
              `🚫 <b>Task Cancelled</b>\n\nThe administrator has cancelled your task: "${escapeHtml(task.title)}". You no longer need to complete this.`,
              { parse_mode: 'HTML' }
            ).catch(console.error);
          } else if (oldTask.status !== 'COMPLETED' && status === 'COMPLETED') {
            bot.telegram.sendMessage(
              user.telegramId,
              `🎉 <b>Task Approved!</b>\n\nYour task "${escapeHtml(task.title)}" was approved and marked as Completed!\n<b>+10 Points</b> added to your profile!`,
              { parse_mode: 'HTML' }
            ).catch(console.error);
          }
        }

        // Notify admins if submitted for review
        if (oldTask.status !== 'WAITING_APPROVAL' && status === 'WAITING_APPROVAL') {
          const admins = await prisma.user.findMany({ where: { isAdmin: true } });
          for (const admin of admins) {
            if (admin.telegramId) {
              bot.telegram.sendMessage(
                admin.telegramId,
                `✅ <b>Task Ready for Review</b>\n\nThe task "<b>${escapeHtml(task.title)}</b>" has been submitted for review.\n\nPlease review the work and either approve or request a revision.`,
                {
                  parse_mode: 'HTML',
                  reply_markup: {
                    inline_keyboard: [
                      [{ text: '✅ Approve Task', callback_data: `admin_approve_task_${task.id}` }],
                      [{ text: '🔄 Request Revision', callback_data: `admin_revise_task_${task.id}` }]
                    ]
                  }
                }
              ).catch(console.error);
            }
          }
        }
      }

      res.json(task);
    } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({ error: 'Failed to update task status' });
    }
  });

  // Feedback for content task
  app.post('/api/content/:id/feedback', upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const file = req.file;

    try {
      const task = await prisma.contentTask.update({
        where: { id: Number(id) },
        data: { status: 'EDITING' }, // Revert to editing or previous state
        include: { scriptWriters: true, shooters: true, editors: true, client: true }
      });

      // Notify relevant users (e.g., editors or writers)
      const usersToNotify = [...task.scriptWriters, ...task.shooters, ...task.editors];
      const uniqueUsers = Array.from(new Set(usersToNotify.map(u => u.id))).map(uid => usersToNotify.find(u => u.id === uid));

      if (process.env.TELEGRAM_BOT_TOKEN !== 'mock_token_for_now') {
        for (const user of uniqueUsers) {
          if (user?.telegramId) {
            await bot.telegram.sendMessage(
              user.telegramId,
              `🔄 <b>Revision Requested</b>\n\nAdmin has requested a revision for "<b>${escapeHtml(task.title)}</b>".\n\n<b>Note:</b> ${escapeHtml(message)}\n\nPlease update the work and notify admin.`,
              { parse_mode: 'HTML' }
            ).catch(console.error);

            if (file) {
              await bot.telegram.sendDocument(user.telegramId, {
                source: file.buffer,
                filename: file.originalname
              }).catch(console.error);
            }
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error sending content feedback:', error);
      res.status(500).json({ error: 'Failed to send feedback' });
    }
  });

  // Get all content tasks
  app.get('/api/content', async (req, res) => {
    const content = await prisma.contentTask.findMany({
      include: { scriptWriters: true, shooters: true, editors: true, schedulers: true, createdBy: true, client: true },
      orderBy: { deadline: 'asc' }
    });
    res.json(content);
  });

  // Create new content task
  app.post('/api/content', upload.array('files'), async (req, res) => {
    const { title, description, idea, deadline, platform, driveLink, createdById, clientId } = req.body;
    
    const scriptWriterIds = getArray(req.body.scriptWriterIds);
    const shooterIds = getArray(req.body.shooterIds);
    const editorIds = getArray(req.body.editorIds);
    const schedulerIds = getArray(req.body.schedulerIds);

    const files = req.files as Express.Multer.File[];
    
    try {
      // Find Client to get folder ID
      const client = clientId ? await prisma.client.findUnique({ where: { id: Number(clientId) } }) : null;

      // Generate Content ID: TSC_ClientName_YYYYMMDD_HHMM
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
      const clientShortCode = getClientShortCode(client?.companyName);
      const contentId = `TSC_${clientShortCode}_CONTENT_${dateStr}_${timeStr}`;

      let folderLink = driveLink;
      let driveFolderId = null;
      let scriptFolderLink = null;
      let rawFolderLink = null;
      let finalFolderLink = null;

      if (client?.driveFolderId) {
        const driveFolder = await setupContentFolders(contentId, client.driveFolderId);
        if (driveFolder) {
          folderLink = driveFolder.link || driveLink;
          driveFolderId = driveFolder.id;
          scriptFolderLink = driveFolder.scriptFolderLink;
          rawFolderLink = driveFolder.rawFolderLink;
          finalFolderLink = driveFolder.finalFolderLink;
        }
      }

      const content = await prisma.contentTask.create({
        data: {
          title,
          contentId,
          description,
          idea,
          deadline: new Date(deadline),
          platform,
          driveLink: folderLink,
          driveFolderId,
          scriptFolderLink,
          rawFolderLink,
          finalFolderLink,
          scriptWriters: { connect: (scriptWriterIds || []).map((id: number) => ({ id: Number(id) })) },
          shooters: { connect: (shooterIds || []).map((id: number) => ({ id: Number(id) })) },
          editors: { connect: (editorIds || []).map((id: number) => ({ id: Number(id) })) },
          schedulers: { connect: (schedulerIds || []).map((id: number) => ({ id: Number(id) })) },
          createdById: createdById ? Number(createdById) : undefined,
          clientId: clientId ? Number(clientId) : undefined,
          status: 'IDEA'
        },
        include: { scriptWriters: true, client: true }
      });

      if (process.env.TELEGRAM_BOT_TOKEN !== 'mock_token_for_now') {
        const finalDate = new Date(content.deadline);
        const durationMs = finalDate.getTime() - now.getTime();
        const scriptDeadline = new Date(now.getTime() + durationMs * 0.25);
        const shootDeadline = new Date(now.getTime() + durationMs * 0.50);
        const editDeadline = new Date(now.getTime() + durationMs * 0.75);

        // Notify script writers
        for (const user of content.scriptWriters) {
          if (user.telegramId) {
            const ideaLine = content.idea ? `\n<b>The Requirement:</b> ${escapeHtml(content.idea)}` : '';
            const scriptLink = content.scriptFolderLink ? `<a href="${content.scriptFolderLink}">Script Folder on Drive</a>` : 'Script folder on Drive';
            
            await bot.telegram.sendMessage(
              user.telegramId,
              `📝 <b>New Content Idea</b>\n\n<b>New Task:</b> "${escapeHtml(content.title)}"\n<b>Content ID:</b> ${content.contentId}\n<b>Client:</b> ${escapeHtml(content.client?.companyName || 'None')}${ideaLine}\n\n<b>Scripting Deadline:</b> ${scriptDeadline.toLocaleString()}\n\nPlease write the script, upload it to the ${scriptLink}, then click the button below.`,
              {
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '✅ Script Uploaded', callback_data: `content_action_upload_script_${content.id}` }]
                  ]
                }
              }
            ).catch(console.error);

            if (files && files.length > 0) {
              for (const file of files) {
                bot.telegram.sendDocument(user.telegramId, {
                  source: file.buffer,
                  filename: file.originalname
                }).catch(console.error);
              }
            }
          }
        }

        // Notify admins about new task
        const admins = await prisma.user.findMany({ where: { isAdmin: true } });
        for (const admin of admins) {
          if (!admin.telegramId) continue;
          bot.telegram.sendMessage(
            admin.telegramId,
            `🆕 <b>New Content Task Created</b>\n\n<b>Title:</b> ${content.title}\n<b>Content ID:</b> ${content.contentId}\n<b>Client:</b> ${content.client?.companyName || 'None'}${content.idea ? `\n<b>Brief:</b> ${content.idea}` : ''}\n<b>Final Deadline:</b> ${new Date(content.deadline).toLocaleDateString()}\n\nThe script writer has been notified to start the project.`,
            { parse_mode: 'HTML' }
          ).catch(console.error);
        }
      }

      res.status(201).json(content);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create content task' });
    }
  });

  // Update content task status
  app.put('/api/content/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 
    try {
      const oldContent = await prisma.contentTask.findUnique({ where: { id: Number(id) } });
      if (!oldContent) return res.status(404).json({ error: 'Not found' });

      const content = await prisma.contentTask.update({
        where: { id: Number(id) },
        data: { status },
        include: { scriptWriters: true, shooters: true, editors: true, schedulers: true }
      });

      // Increment points if newly posted
      if (oldContent.status !== 'POSTED' && status === 'POSTED') {
        const allUsers = [...content.scriptWriters, ...content.shooters, ...content.editors, ...content.schedulers];
        // Deduplicate users in case someone has multiple roles
        const uniqueUsers = Array.from(new Set(allUsers.map(u => u.id)));
        for (const userId of uniqueUsers) {
          await prisma.user.update({
            where: { id: userId },
            data: { points: { increment: 10 } }
          });
        }
      }

      if (process.env.TELEGRAM_BOT_TOKEN !== 'mock_token_for_now') {
        if (status === 'APPROVED') {
          for (const user of content.schedulers) {
            if (!user.telegramId) continue;
            bot.telegram.sendMessage(
              user.telegramId,
              `✅ <b>New video to schedule, please complete the task in time</b>\n\n<b>Content ID:</b> ${content.contentId}\n<b>Drive Link:</b> ${content.driveLink || 'No link provided'}\n\nThe final video is ready in the <b>Final Content</b> folder.`,
              {
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '📅 Set Post Date', callback_data: `content_action_set_post_${content.id}` }]
                  ]
                }
              }
            ).catch(console.error);
          }
        }
      }

      res.json(content);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update content status' });
    }
  });

  // Admin Ping Shoot Approval
  app.post('/api/content/:id/ping-shoot-approval', async (req, res) => {
    const { id } = req.params;
    try {
      const content = await prisma.contentTask.findUnique({ where: { id: Number(id) }, include: { shooters: true } });
      if (!content) return res.status(404).json({ error: 'Not found' });
      
      if (process.env.TELEGRAM_BOT_TOKEN !== 'mock_token_for_now') {
        for (const user of content.shooters) {
          if (!user.telegramId) continue;
          bot.telegram.sendMessage(
            user.telegramId,
            `📅 <b>Shoot Date Approved</b>\n\nAdmin has approved the shoot date for Content ID: ${content.contentId}.\nDate: ${content.shootDate ? new Date(content.shootDate).toLocaleString() : 'N/A'}\n\nPlease confirm.`,
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '✅ Okay', callback_data: `content_shoot_ok_${content.id}` }, { text: '❌ Not Okay', callback_data: `content_shoot_not_ok_${content.id}` }]
                ]
              }
            }
          ).catch(console.error);
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Admin Reschedule Shoot
  app.post('/api/content/:id/admin-reschedule', async (req, res) => {
    const { id } = req.params;
    const { newDate, note } = req.body;
    try {
      const parsedDate = new Date(newDate);
      const content = await prisma.contentTask.update({ 
        where: { id: Number(id) }, 
        data: { shootDate: parsedDate },
        include: { shooters: true } 
      });
      
      if (process.env.TELEGRAM_BOT_TOKEN !== 'mock_token_for_now') {
        for (const user of content.shooters) {
          if (!user.telegramId) continue;
          bot.telegram.sendMessage(
            user.telegramId,
            `📅 <b>Admin Rescheduled Shoot</b>\n\nAdmin has proposed a new date for Content ID: ${content.contentId}.\n<b>New Date:</b> ${parsedDate.toLocaleString()}\n<b>Note:</b> ${note || 'None'}\n\nPlease confirm this date.`,
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '✅ Okay', callback_data: `content_shoot_ok_${content.id}` }, { text: '❌ Not Okay', callback_data: `content_shoot_not_ok_${content.id}` }]
                ]
              }
            }
          ).catch(console.error);
        }
      }
      res.json({ success: true, shootDate: parsedDate });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Proxy Telegram Profile Photo
  app.get('/api/users/:id/photo', async (req, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
      if (!user || !user.photoUrl || process.env.TELEGRAM_BOT_TOKEN === 'mock_token_for_now') {
        return res.status(404).send('Not found');
      }

      const fileLink = await bot.telegram.getFileLink(user.photoUrl);
      const imageResponse = await fetch(fileLink.toString());
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.set('Content-Type', 'image/jpeg');
      res.send(buffer);
    } catch (error) {
      console.error('Error fetching photo:', error);
      res.status(500).send('Error fetching photo');
    }
  });

  // Manual Ping / Notify Employee
  app.post('/api/tasks/:id/notify', async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    
    try {
      const task = await prisma.task.findUnique({ where: { id: Number(id) }, include: { assignedUsers: true } });
      if (!task) return res.status(404).json({ error: 'Not found' });

      if (process.env.TELEGRAM_BOT_TOKEN !== 'mock_token_for_now') {
        for (const user of task.assignedUsers) {
          if (!user.telegramId) continue;
          bot.telegram.sendMessage(
            user.telegramId,
            `🔔 *Admin Notification for Task #${task.id}*\n\n"${task.title}"\n\n*Admin Message:* ${message || 'Please provide an update on this task.'}`,
            { parse_mode: 'Markdown' }
          ).catch(console.error);
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // Admin Feedback with Attachments
  app.post('/api/tasks/:id/feedback', upload.single('attachment'), async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const file = req.file;

    try {
      const task = await prisma.task.findUnique({ where: { id: Number(id) }, include: { assignedUsers: true } });
      if (!task) return res.status(404).json({ error: 'Not found' });

      // Change status back to IN_PROGRESS since admin is asking for revisions
      await prisma.task.update({ where: { id: Number(id) }, data: { status: 'IN_PROGRESS' } });

      if (process.env.TELEGRAM_BOT_TOKEN !== 'mock_token_for_now') {
        const textCaption = `🔄 *Task Revisions Needed*\n\nAdmin reviewed: "${task.title}"\n\n*Feedback:* ${message || 'Please review the attached feedback and resubmit.'}`;
        
        const markup = {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Submit Revised Task', callback_data: `mark_done_${task.id}` }]
            ]
          }
        };

        for (const user of task.assignedUsers) {
          if (!user.telegramId) continue;
          if (file) {
            const isPhoto = file.mimetype.startsWith('image/');
            if (isPhoto) {
              await bot.telegram.sendPhoto(user.telegramId, { source: file.buffer, filename: file.originalname }, { caption: textCaption, parse_mode: 'Markdown', ...markup }).catch(console.error);
            } else {
              await bot.telegram.sendDocument(user.telegramId, { source: file.buffer, filename: file.originalname }, { caption: textCaption, parse_mode: 'Markdown', ...markup }).catch(console.error);
            }
          } else {
            await bot.telegram.sendMessage(user.telegramId, textCaption, { parse_mode: 'Markdown', ...markup }).catch(console.error);
          }
        }
      }

      res.json({ success: true, status: 'IN_PROGRESS' });
    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({ error: 'Failed to send feedback' });
    }
  });

  // Global Ping All Employees
  app.post('/api/ping-all', async (req, res) => {
    const { message } = req.body;
    try {
      const users = await prisma.user.findMany({ where: { registrationState: 'REGISTERED' }});
      if (process.env.TELEGRAM_BOT_TOKEN !== 'mock_token_for_now') {
        users.forEach(u => {
          if (u.telegramId) {
            bot.telegram.sendMessage(
              u.telegramId,
              `📢 *GLOBAL ANNOUNCEMENT*\n\n${message}`,
              { parse_mode: 'Markdown' }
            ).catch(console.error);
          }
        });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to broadcast' });
    }
  });

  // CRM: Get Clients
  app.get('/api/clients', async (req, res) => {
    const clients = await prisma.client.findMany({ include: { invoices: true } });
    res.json(clients);
  });

  // CRM: Create Client
  app.post('/api/clients', async (req, res) => {
    const { companyName, contactEmail, logoUrl, package: pkg, monthlyDeliverables, driveLinks, passwords, notes, status } = req.body;
    
    // Create Drive Folder
    const driveFolder = await createFolder(companyName, process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
    
    const client = await prisma.client.create({
      data: { 
        companyName, contactEmail, logoUrl, 
        package: pkg, monthlyDeliverables, driveLinks, passwords, notes, 
        status: status || 'ACTIVE',
        driveFolderId: driveFolder?.id
      }
    });
    res.json(client);
  });
  // CRM: Delete Client
  app.delete('/api/clients/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const clientId = Number(id);
      
      // Get client to find Drive Folder ID
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // 1. Delete associated PointLogs for Tasks of this client
      const clientTasks = await prisma.task.findMany({ where: { clientId } });
      const taskIds = clientTasks.map(t => t.id);
      if (taskIds.length > 0) {
        await prisma.pointLog.deleteMany({ where: { taskId: { in: taskIds } } });
      }

      // 2. Delete Tasks
      await prisma.task.deleteMany({ where: { clientId } });

      // 3. Delete ContentTasks
      await prisma.contentTask.deleteMany({ where: { clientId } });

      // 4. Preserve Invoices (Financial History)
      await prisma.invoice.updateMany({
        where: { clientId },
        data: { clientId: null, clientName: client.companyName }
      });

      // 6. Finally, Delete the Client
      await prisma.client.delete({ where: { id: clientId } });

      // 7. Delete Google Drive Folder
      if (client.driveFolderId) {
        await deleteDriveFolder(client.driveFolderId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({ error: 'Failed to delete client' });
    }
  });
  // CRM: Update Client Status
  app.put('/api/clients/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      const client = await prisma.client.update({
        where: { id: Number(id) },
        data: { status }
      });
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update client status' });
    }
  });

  // CRM: Update Client Info
  app.put('/api/clients/:id', async (req, res) => {
    const { id } = req.params;
    const { companyName, contactEmail, logoUrl, package: pkg, monthlyDeliverables, driveLinks, passwords, notes, status } = req.body;
    try {
      const client = await prisma.client.update({
        where: { id: Number(id) },
        data: {
          companyName, contactEmail, logoUrl,
          package: pkg, monthlyDeliverables, driveLinks, passwords, notes, status
        }
      });
      res.json(client);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update client' });
    }
  });

  // Finance: Get Invoices
  app.get('/api/invoices', async (req, res) => {
    const invoices = await prisma.invoice.findMany({ include: { client: true, payments: true }, orderBy: { dueDate: 'asc' } });
    res.json(invoices);
  });

  // Finance: Create Invoice
  app.post('/api/invoices', async (req, res) => {
    const { clientId, amount, dueDate, description, issueDate, isInternal } = req.body;
    const invoice = await prisma.invoice.create({
      data: { 
        clientId: Number(clientId), 
        amount: Number(amount), 
        dueDate: new Date(dueDate), 
        description,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        isInternal: Boolean(isInternal)
      }
    });
    
    // Auto update client status if it's not internal
    if (!isInternal) {
      await prisma.client.update({
        where: { id: Number(clientId) },
        data: { status: 'PENDING_PAYMENT' }
      });
    }
    
    res.json(invoice);
  });


  // Finance: Mark Invoice as Paid
  app.put('/api/invoices/:id/paid', async (req, res) => {
    const { id } = req.params;
    try {
      const invoice = await prisma.invoice.update({
        where: { id: Number(id) },
        data: { status: 'PAID', paidAt: new Date() }
      });
      // Auto update client status
      if (invoice.clientId) {
        await prisma.client.update({
          where: { id: invoice.clientId },
          data: { status: 'ACTIVE' }
        });
      }
      res.json(invoice);
    } catch (e) {
      res.status(500).json({ error: 'Failed to pay invoice' });
    }
  });

  // Finance: Add Payment to Invoice
  app.post('/api/invoices/:id/payments', async (req, res) => {
    const { id } = req.params;
    const { amount, date, method } = req.body;
    try {
      const payment = await prisma.invoicePayment.create({
        data: {
          invoiceId: Number(id),
          amount: Number(amount),
          date: new Date(date),
          method
        }
      });

      const invoice = await prisma.invoice.findUnique({
        where: { id: Number(id) },
        include: { payments: true }
      });

      if (invoice) {
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        let status = invoice.status;
        let paidAt = invoice.paidAt;

        if (totalPaid >= invoice.amount) {
          status = 'PAID';
          paidAt = paidAt || new Date(date); // Use payment date if full paid
          // Auto update client status
          if (invoice.clientId) {
            await prisma.client.update({
              where: { id: invoice.clientId },
              data: { status: 'ACTIVE' }
            });
          }
        } else if (totalPaid > 0) {
          status = 'PARTIAL';
        }

        await prisma.invoice.update({
          where: { id: Number(id) },
          data: { status, paidAt }
        });
      }

      res.json(payment);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to add payment' });
    }
  });

  // Finance: Expenses & Payments
  app.get('/api/expenses', async (req, res) => {
    const expenses = await prisma.expense.findMany({ orderBy: { date: 'desc' } });
    res.json(expenses);
  });

  app.post('/api/expenses', async (req, res) => {
    const { amount, category, description } = req.body;
    const expense = await prisma.expense.create({
      data: { amount: Number(amount), category, description }
    });
    res.json(expense);
  });

  app.delete('/api/expenses/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  });

  // Finance: Incomes
  app.get('/api/incomes', async (req, res) => {
    const incomes = await prisma.income.findMany({ orderBy: { date: 'desc' } });
    res.json(incomes);
  });

  app.post('/api/incomes', async (req, res) => {
    const { amount, source, description, date } = req.body;
    const income = await prisma.income.create({
      data: { amount: Number(amount), source: source || 'GENERAL', description, date: date ? new Date(date) : new Date() }
    });
    res.json(income);
  });

  app.delete('/api/incomes/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.income.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  });

  app.get('/api/employee-payments', async (req, res) => {
    const payments = await prisma.employeePayment.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
    res.json(payments);
  });

  app.post('/api/employee-payments', async (req, res) => {
    const { userId, month, amount, status } = req.body;
    const payment = await prisma.employeePayment.create({
      data: { userId: Number(userId), month, amount: Number(amount), status, paidAt: status === 'PAID' ? new Date() : null }
    });
    if (status === 'PAID') {
      await prisma.expense.create({
        data: { amount: Number(amount), category: 'SALARY', description: `Salary for ${month}` }
      });
    }
    res.json(payment);
  });

  app.put('/api/employee-payments/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, amount } = req.body;
    
    const existing = await prisma.employeePayment.findUnique({ where: { id: Number(id) } });
    const finalAmount = amount !== undefined ? Number(amount) : existing?.amount;

    const payment = await prisma.employeePayment.update({
      where: { id: Number(id) },
      data: { status, amount: finalAmount, paidAt: status === 'PAID' ? new Date() : null },
      include: { user: true }
    });
    const baseDesc = `Salary for ${payment.month} - ${payment.user?.name || payment.employeeName || 'Unknown Employee'}`;
    const refDesc = `${baseDesc} (Ref: ${payment.id})`;

    // Delete any existing expense to prevent duplicates (handles both old and new description formats)
    await prisma.expense.deleteMany({
      where: {
        category: 'SALARY',
        OR: [{ description: baseDesc }, { description: refDesc }]
      }
    });

    if (status === 'PAID') {
      await prisma.expense.create({
        data: { amount: payment.amount, category: 'SALARY', description: refDesc }
      });
    }
    res.json(payment);
  });

  // Private Jobs
  app.get('/api/private-jobs', async (req, res) => {
    const jobs = await prisma.privateJob.findMany({ include: { user: true }, orderBy: { date: 'desc' } });
    res.json(jobs);
  });

  app.post('/api/private-jobs', async (req, res) => {
    const { userId, clientName, description, amount, date, method } = req.body;
    const job = await prisma.privateJob.create({
      data: { 
        userId: Number(userId), 
        clientName, 
        description, 
        amount: Number(amount), 
        date: new Date(date), 
        method, 
        status: 'UNPAID' 
      }
    });
    res.json(job);
  });

  app.put('/api/private-jobs/:id/paid', async (req, res) => {
    const { id } = req.params;
    const { method } = req.body;
    try {
      const job = await prisma.privateJob.update({
        where: { id: Number(id) },
        data: { status: 'PAID', method }
      });
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update job' });
    }
  });

  app.delete('/api/private-jobs/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.privateJob.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  });

  // Analytics Dashboard Stats
  app.get('/api/analytics', async (req, res) => {
    const users = await prisma.user.findMany({ include: { tasks: true, contentWrites: true, contentShoots: true, contentEdits: true, contentSchedules: true } });
    const invoices = await prisma.invoice.findMany({ include: { client: true } });
    // Filter out internal invoices for all financial calculations
    const publicInvoices = invoices.filter(i => !i.isInternal);
    
    const expenses = await prisma.expense.findMany();
    const incomes = await prisma.income.findMany();
    const clients = await prisma.client.findMany({ include: { invoices: true } });
    
    // Revenue from paid invoices
    let totalInvoiceRevenue = 0;
    publicInvoices.forEach(i => { if (i.status === 'PAID') totalInvoiceRevenue += i.amount; });

    // Revenue from generic incomes
    let totalGenericIncome = 0;
    incomes.forEach(i => { totalGenericIncome += i.amount; });

    const totalRevenue = totalInvoiceRevenue + totalGenericIncome;

    let totalExpenses = 0;
    expenses.forEach(e => { totalExpenses += e.amount; });

    const retained = totalRevenue - totalExpenses;
    const profitMarginPct = totalRevenue > 0 ? ((retained / totalRevenue) * 100).toFixed(1) : '0.0';

    // Revenue run rate (annualized based on current month)
    const now = new Date();
    const currentMonthRevenue = publicInvoices
      .filter(i => i.status === 'PAID' && new Date(i.createdAt).getMonth() === now.getMonth() && new Date(i.createdAt).getFullYear() === now.getFullYear())
      .reduce((sum, i) => sum + i.amount, 0) + incomes
      .filter(i => new Date(i.date).getMonth() === now.getMonth() && new Date(i.date).getFullYear() === now.getFullYear())
      .reduce((sum, i) => sum + i.amount, 0);
    const revenueRunRate = currentMonthRevenue * 12;

    // ARPC - Average Revenue Per Client
    const activeClients = clients.filter(c => c.invoices.some(i => i.status === 'PAID' && !i.isInternal));
    const arpc = activeClients.length > 0 ? totalInvoiceRevenue / activeClients.length : 0;

    // Top client by revenue
    const clientRevenue = clients.map(c => {
      const cInvoices = c.invoices.filter(i => !i.isInternal);
      return {
        id: c.id,
        name: c.companyName,
        revenue: cInvoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0),
        pending: cInvoices.filter(i => i.status === 'UNPAID' || i.status === 'PARTIAL').reduce((s, i) => s + i.amount, 0),
        invoiceCount: cInvoices.length,
        paidCount: cInvoices.filter(i => i.status === 'PAID').length,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Expense breakdown by category
    const expenseCategoryMap: Record<string, number> = {};
    expenses.forEach(e => {
      expenseCategoryMap[e.category] = (expenseCategoryMap[e.category] || 0) + e.amount;
    });
    const expenseBreakdown = Object.entries(expenseCategoryMap).map(([name, value]) => ({ name, value }));

    // Unpaid invoices (cash flow forecast)
    const unpaidInvoices = publicInvoices.filter(i => i.status === 'UNPAID' || i.status === 'PARTIAL').map(i => ({
      id: i.id,
      client: i.client?.companyName || 'Unknown',
      amount: i.amount,
      dueDate: i.dueDate,
      description: i.description
    }));
    const pendingRevenue = unpaidInvoices.reduce((s, i) => s + i.amount, 0);

    const completionStats = users.map(u => {
      const contentTasksCount = u.contentWrites.length + u.contentShoots.length + u.contentEdits.length + u.contentSchedules.length;
      return {
        name: u.name || 'Unknown',
        completed: u.tasks.filter(t => t.status === 'COMPLETED').length + contentTasksCount,
        delayed: u.tasks.filter(t => t.status === 'DELAYED').length,
      };
    });

    const tasks = await prisma.task.findMany();
    const statusCounts = {
      ToDo: tasks.filter(t => t.status === 'TO_DO').length,
      InProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      WaitingApproval: tasks.filter(t => t.status === 'WAITING_APPROVAL').length,
      Completed: tasks.filter(t => t.status === 'COMPLETED').length,
      Delayed: tasks.filter(t => t.status === 'DELAYED').length,
    };

    const statusDistribution = [
      { name: 'To Do', value: statusCounts.ToDo, color: '#9CA3AF' },
      { name: 'In Progress', value: statusCounts.InProgress, color: '#3B82F6' },
      { name: 'Waiting Approval', value: statusCounts.WaitingApproval, color: '#A855F7' },
      { name: 'Completed', value: statusCounts.Completed, color: '#10B981' },
      { name: 'Delayed', value: statusCounts.Delayed, color: '#EF4444' },
    ].filter(d => d.value > 0);

    res.json({
      finance: { 
        totalRevenue, 
        totalInvoiceRevenue,
        totalGenericIncome,
        totalExpenses, 
        retained, 
        profitMarginPct,
        revenueRunRate,
        arpc,
        pendingRevenue,
        topClient: clientRevenue[0] || null,
      },
      clientRevenue,
      expenseBreakdown,
      unpaidInvoices,
      completionStats,
      statusDistribution
    });
  });
}
