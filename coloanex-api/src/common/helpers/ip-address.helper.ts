import { Request } from 'express';

export function getClientIpAddress(request: Request): string | undefined {
  const xForwardedFor = request.headers['x-forwarded-for'];

  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor.split(',')[0];
    return ips.trim();
  }

  const xRealIp = request.headers['x-real-ip'];
  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }

  const cfConnectingIp = request.headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  }

  return request.ip || request.socket?.remoteAddress;
}
