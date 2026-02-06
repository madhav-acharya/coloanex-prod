export interface MailConfig {
  email: string;
  password: string;
  host: string;
  port: number;
  userId: string;
}

export interface MailConnectionStatus {
  isConnected: boolean;
  email?: string;
  host?: string;
  port?: number;
}
