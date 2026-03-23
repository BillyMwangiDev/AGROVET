import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock GSAP before importing the component
vi.mock('gsap', () => ({
  default: {
    context: vi.fn((fn: () => void) => {
      fn();
      return { revert: vi.fn() };
    }),
    timeline: vi.fn(() => ({
      fromTo: vi.fn().mockReturnThis(),
    })),
  },
}));

const { default: Hero } = await import('@/sections/Hero');

describe('Hero section', () => {
  it('renders the h1 headline', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders all three stat cards', () => {
    render(<Hero />);
    expect(screen.getByText('20+')).toBeInTheDocument();
    expect(screen.getByText('Years of Service')).toBeInTheDocument();
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('Farmers Served')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Service Lines')).toBeInTheDocument();
  });

  it('renders all trust items', () => {
    render(<Hero />);
    expect(screen.getByText('20+ Years Experience')).toBeInTheDocument();
    expect(screen.getByText('Trusted by 500+ Farmers')).toBeInTheDocument();
    expect(screen.getByText('Naromoru, Nyeri County')).toBeInTheDocument();
  });

  it('renders a WhatsApp link pointing to wa.me', () => {
    render(<Hero />);
    const waLinks = screen.getAllByRole('link').filter(
      (el) => el.getAttribute('href')?.includes('wa.me')
    );
    expect(waLinks.length).toBeGreaterThan(0);
  });

  it('renders the Browse Products button', () => {
    render(<Hero />);
    expect(
      screen.getByRole('button', { name: /browse products/i })
    ).toBeInTheDocument();
  });

  it('calls document.getElementById("products") when Browse Products is clicked', async () => {
    const mockScrollIntoView = vi.fn();
    vi.spyOn(document, 'getElementById').mockReturnValue({
      scrollIntoView: mockScrollIntoView,
    } as unknown as HTMLElement);

    render(<Hero />);
    const btn = screen.getByRole('button', { name: /browse products/i });
    await userEvent.click(btn);
    expect(document.getElementById).toHaveBeenCalledWith('products');
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    vi.restoreAllMocks();
  });
});
