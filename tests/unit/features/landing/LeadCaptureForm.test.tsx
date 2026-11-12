import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeadCaptureForm } from '@/features/landing/components/LeadCaptureForm';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn() },
}));

vi.mock('@/features/landing/services/submitLead', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/landing/services/submitLead')>();
  return { ...actual, submitLead: vi.fn() };
});

function renderForm() {
  return render(
    <MemoryRouter>
      <LeadCaptureForm abVariant="A" />
    </MemoryRouter>,
  );
}

describe('LeadCaptureForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('cancela o requestAnimationFrame da equipe no unmount', () => {
    const rafId = 4242;
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => rafId);
    const caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

    const { unmount } = renderForm();
    fireEvent.keyDown(screen.getByRole('radio', { name: '6 a 15' }), { key: 'ArrowRight' });
    expect(raf).toHaveBeenCalledTimes(1);

    unmount();

    expect(caf).toHaveBeenCalledWith(rafId);
  });
});
