import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  getMe: vi.fn().mockResolvedValue({
    id: '1',
    username: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@test.com',
    role: 'admin',
    is_active_cashier: false,
  }),
  pinVerify: vi.fn(),
}));

const { useAuth } = await import('@/hooks/useAuth');

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('loading starts as false when no token is in localStorage', () => {
    const { result } = renderHook(() => useAuth());
    // No token → loading should already be false (no async work to do)
    expect(result.current.loading).toBe(false);
  });

  it('user is null and not authenticated when there is no token', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('loading starts as true when a token is present in localStorage', () => {
    localStorage.setItem('access_token', 'fake-access-token');
    const { result } = renderHook(() => useAuth());
    // Token present → starts loading while getMe() is in flight
    expect(result.current.loading).toBe(true);
  });

  it('resolves user and sets loading=false after successful getMe', async () => {
    localStorage.setItem('access_token', 'fake-access-token');
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).not.toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('clears token and leaves user null when getMe fails', async () => {
    const { getMe } = await import('@/api/auth');
    vi.mocked(getMe).mockRejectedValueOnce(new Error('Unauthorized'));
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', 'expired-refresh');

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('role helpers are correct for admin user', async () => {
    localStorage.setItem('access_token', 'fake-access-token');
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isManager).toBe(true); // admin implies manager
    expect(result.current.isCashier).toBe(true); // admin implies cashier
  });

  it('logout clears user and tokens', async () => {
    localStorage.setItem('access_token', 'fake-access-token');
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    result.current.logout();
    await waitFor(() => expect(result.current.user).toBeNull());
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});
