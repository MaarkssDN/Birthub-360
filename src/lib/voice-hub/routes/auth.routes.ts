import express from 'express';
import { meHandler, logoutHandler } from '../controllers/auth.controller.js';
import { requireTenant } from '../middlewares/rbac.js';

const router = express.Router();

// Auth canônica (Better Auth): /auth/register, /auth/login e /auth/refresh com JWT próprio foram
// REMOVIDOS — cadastro/login/sessão são exclusivamente /api/auth/* do Better Auth (ver src/lib/
// auth.ts e src/bootstrap/auth.ts). O voice-hub nunca cria tenants nem senhas próprias.
//
// `/auth/me` é a introspecção de sessão do voice-hub: resolve a sessão (cookie httpOnly ou bearer)
// via requireTenant antes do controller ler a sessão — nunca devolve `user` para anônimo.
router.get('/auth/me', requireTenant, meHandler);
// Logout delega ao signOut do Better Auth (invalida a Session server-side), não a um JWT local.
router.post('/auth/logout', logoutHandler);

export default router;
