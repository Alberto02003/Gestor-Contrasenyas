export type NetworkPeer = {
  id: string;
  name: string;
  ip: string;
  lastSeen: number;
  hasApp?: boolean; // True si tiene la app instalada
};

export type ShareRequestPayload = {
  peerId: string;
  credential: {
    title: string;
    username: string;
    password: string;
  };
};

export type IncomingSharePayload = {
  id: string;
  fromName: string;
  fromIp: string;
  credentialTitle: string;
  username: string;
  password: string;
  timestamp: number;
};
