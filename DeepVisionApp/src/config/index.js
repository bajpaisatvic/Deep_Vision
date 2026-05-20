import { Platform } from 'react-native';

// Physical Android device — must use the machine's Wi-Fi LAN IP.
// Android emulator would use 10.0.2.2, iOS simulator would use localhost.
const HOST = '10.226.255.56';

export const DJANGO_URL = `http://${HOST}:8000`;
export const NODE_URL = `http://${HOST}:4000`;

export const API_BASE = `${DJANGO_URL}/api`;
export const MEDIA_BASE = DJANGO_URL;

export const SOCKET_URL = NODE_URL;

export const ROLES = {
  CITIZEN: 'CITIZEN',
  POLICE: 'POLICE',
  ADMIN: 'ADMIN',
};

export const CASE_STATUS = {
  ACTIVE: 'ACTIVE',
  FOUND: 'FOUND',
  CLOSED: 'CLOSED',
};

export const ALERT_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  DISMISSED: 'DISMISSED',
};
