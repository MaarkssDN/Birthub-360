/**
 * Cards de contato da landing (Ajuda, Contato, Segurança): são <div role="button"> e precisam
 * responder a Enter e Espaço como um botão nativo (AGENTS.md §32 e §40). Tecla segurada
 * (keydown com repeat=true) não pode disparar a ação de novo.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const playMock = vi.fn();
vi.mock('@/lib/soundEffects', () => ({ SoundFX: { play: (...a: unknown[]) => playMock(...a) } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ currentUser: null }) }));
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));
vi.mock('@/lib/auth-client', () => ({ authClient: {} }));

import { NewLoginScreen } from '@/features/auth/components/NewLoginScreen';

const originalLocation = window.location;
let hrefSet: string[];

beforeEach(() => {
  playMock.mockClear();
  hrefSet = [];
  // mailto: não navega no jsdom; captura a atribuição de href.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...originalLocation,
      get href() {
        return hrefSet.at(-1) ?? 'http://localhost/';
      },
      set href(v: string) {
        hrefSet.push(v);
      },
    },
  });
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<NewLoginScreen />} />
        <Route path="/privacy" element={<p data-testid="privacy">privacidade</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const mailCards = [
  { name: /^Ajuda/, href: 'mailto:suporte@birthhub360.com' },
  { name: /^Contato/, href: 'mailto:comercial@birthhub360.com' },
];

describe('NewLoginScreen — cards de contato acionáveis por teclado', () => {
  for (const key of ['Enter', ' ']) {
    const label = key === ' ' ? 'Espaço' : key;

    for (const card of mailCards) {
      it(`${label} no card ${card.name.source.slice(1)} abre ${card.href}`, () => {
        renderScreen();
        const btn = screen.getByRole('button', { name: card.name });
        const ev = fireEvent.keyDown(btn, { key });
        expect(ev).toBe(false); // preventDefault: Espaço não rola a página
        expect(hrefSet).toEqual([card.href]);
        expect(playMock).toHaveBeenCalledWith('click');
      });
    }

    it(`${label} no card Segurança navega para /privacy`, () => {
      renderScreen();
      fireEvent.keyDown(screen.getByRole('button', { name: /^Segurança/ }), { key });
      expect(screen.getByTestId('privacy')).toBeInTheDocument();
      expect(playMock).toHaveBeenCalledWith('click');
    });
  }

  it('ignora keydown repetido (tecla segurada) em todos os cards', () => {
    renderScreen();
    for (const name of [/^Ajuda/, /^Contato/, /^Segurança/]) {
      const btn = screen.getByRole('button', { name });
      fireEvent.keyDown(btn, { key: 'Enter', repeat: true });
      fireEvent.keyDown(btn, { key: ' ', repeat: true });
    }
    expect(hrefSet).toEqual([]);
    expect(playMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('privacy')).not.toBeInTheDocument();
  });

  it('outras teclas não acionam o card', () => {
    renderScreen();
    fireEvent.keyDown(screen.getByRole('button', { name: /^Ajuda/ }), { key: 'a' });
    expect(hrefSet).toEqual([]);
    expect(playMock).not.toHaveBeenCalled();
  });
});
