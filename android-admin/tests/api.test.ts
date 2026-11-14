import { setAuthToken, getAuthToken, setApiBaseUrl, getApiBaseUrl } from '../src/api/client';

describe('Android Admin API Client & Token Security', () => {
  beforeEach(async () => {
    await setAuthToken(null);
  });

  test('should default to authoritative Save & Smile production API', async () => {
    const url = await getApiBaseUrl();
    expect(url).toBe('https://saveandsmile.vercel.app/api');
  });

  test('should allow custom API base URL configuration', async () => {
    await setApiBaseUrl('http://192.168.1.100:5000/api');
    const url = await getApiBaseUrl();
    expect(url).toBe('http://192.168.1.100:5000/api');
    // Restore
    await setApiBaseUrl('https://saveandsmile.vercel.app/api');
  });

  test('should store and retrieve staff auth token', async () => {
    const testToken = 'staff_jwt_token_sample_12345';
    await setAuthToken(testToken);
    const token = await getAuthToken();
    expect(token).toBe(testToken);
  });

  test('should clear auth token on logout', async () => {
    await setAuthToken('temporary_token');
    await setAuthToken(null);
    const token = await getAuthToken();
    expect(token).toBeNull();
  });
});
