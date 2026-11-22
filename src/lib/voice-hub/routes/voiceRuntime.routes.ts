import express from 'express';
import { requireTenant } from '../middlewares/rbac.js';
import {
  getVoiceRuntimeHandler,
  createVoiceRuntimeHandler,
  updateVoiceRuntimeHandler,
  resetVoiceRuntimeHandler,
  createVoiceSessionHandler,
  interactVoiceSessionHandler,
  endVoiceSessionHandler,
} from '../controllers/voiceRuntime.controller.js';

const router = express.Router();

router.get('/voice-runtime', requireTenant, getVoiceRuntimeHandler);
router.post('/voice-runtime', requireTenant, createVoiceRuntimeHandler);
router.put('/voice-runtime', requireTenant, updateVoiceRuntimeHandler);
router.delete('/voice-runtime', requireTenant, resetVoiceRuntimeHandler);

// Live WebRTC/Whisper session control, intent analysis & post-call automation
router.post('/voice-runtime/sessions', requireTenant, createVoiceSessionHandler);
router.post(
  '/voice-runtime/sessions/:sessionId/interact',
  requireTenant,
  interactVoiceSessionHandler,
);
router.post('/voice-runtime/sessions/:sessionId/end', requireTenant, endVoiceSessionHandler);

export default router;
