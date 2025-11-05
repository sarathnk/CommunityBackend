import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { router as authRouter } from './src/routes/auth.js';
import { router as orgRouter } from './src/routes/organizations.js';
import { router as meRouter } from './src/routes/me.js';
import { router as rolesRouter } from './src/routes/roles.js';
import { router as membersRouter } from './src/routes/members.js';
import { router as eventsRouter } from './src/routes/events.js';
import { router as announcementsRouter } from './src/routes/announcements.js';
import { router as uploadRouter } from './src/routes/upload.js';
import { router as logoRouter } from './src/routes/logo.js';
import { router as electionsRouter } from './src/routes/elections.js';
import { router as chatsRouter } from './src/routes/chats.js';
import { router as messagesRouter } from './src/routes/messages.js';
import { router as notificationsRouter } from './src/routes/notifications.js';
import { router as subscriptionRouter } from './src/routes/subscription.js';
import { router as paymentRouter } from './src/routes/payment.js';
import dashboardRouter from './src/routes/dashboard.js';
import eventFinancialsRouter from './src/routes/eventFinancials.js';
import { router as incomeRouter } from './src/routes/income.js';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRouter);
app.use('/api/organizations', orgRouter);
app.use('/api/me', meRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/members', membersRouter);
app.use('/api/events', eventsRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/elections', electionsRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/event-financials', eventFinancialsRouter);
app.use('/api/income', incomeRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/logo', logoRouter);
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(process.cwd(), 'uploads', req.path);
  res.sendFile(filePath);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
