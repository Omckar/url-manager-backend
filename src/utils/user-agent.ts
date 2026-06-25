export interface UserAgentInfo {
  browser: string;
  device: string;
  operatingSystem: string;
}

export function parseUserAgent(ua: string | undefined): UserAgentInfo {
  if (!ua) {
    return { browser: 'Unknown', device: 'Desktop', operatingSystem: 'Unknown' };
  }

  let browser = 'Unknown';
  let device = 'Desktop';
  let operatingSystem = 'Unknown';

  // Parse OS
  if (/windows/i.test(ua)) {
    operatingSystem = 'Windows';
  } else if (/macintosh|mac os x/i.test(ua)) {
    operatingSystem = 'macOS';
  } else if (/android/i.test(ua)) {
    operatingSystem = 'Android';
    device = 'Mobile';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    operatingSystem = 'iOS';
    device = /ipad/i.test(ua) ? 'Tablet' : 'Mobile';
  } else if (/linux/i.test(ua)) {
    operatingSystem = 'Linux';
  }

  // Parse Device type if not already set to Mobile/Tablet
  if (device === 'Desktop') {
    if (/mobile/i.test(ua)) {
      device = 'Mobile';
    } else if (/tablet/i.test(ua)) {
      device = 'Tablet';
    }
  }

  // Parse Browser
  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua) && !/opr/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/edge|edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/opr/i.test(ua)) {
    browser = 'Opera';
  }

  return { browser, device, operatingSystem };
}
