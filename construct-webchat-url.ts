export type LiveChatSessionData = {
  user?: {
    name?: string;
    email?: string;
    phone?: string | null;
  };
  conversationId?: string;
  sessionId: string;
  sessionToken: string;
  sessionTokenExpiration: string;
  userId: string;
};

export function constructWebchatUrl(props: {
  baseUrl: string;
  orgId: string;
  installedSourceId: number;
  sessionData?: LiveChatSessionData;
  defaultUser?: {
    email?: string;
    name?: string;
    phone?: string | null;
  };
  locale?: string;
}): string {
  const params = new URLSearchParams();
  params.append('organizationId', props.orgId);
  params.append('installedSourceId', String(props.installedSourceId));
  params.append('mode', 'webview');
  params.append('hideHeader', 'true');
  params.append('locale', props.locale || 'en');

  if (props.defaultUser) {
    if (props.defaultUser.name) params.append('_defaultUserName', props.defaultUser.name);
    if (props.defaultUser.email) params.append('_defaultUserEmail', props.defaultUser.email);
    if (props.defaultUser.phone) params.append('_defaultUserPhone', props.defaultUser.phone);
  }
  if (props.sessionData) {
    for (const data of Object.entries(props.sessionData)) {
      const [key, obj] = data;
      if (typeof obj === 'object') {
        if (obj.name) params.append('userName', obj.name);
        if (obj.email) params.append('userEmail', obj.email);
        if (obj.phone) params.append('userPhone', obj.phone);
      } else {
        params.append(key, obj);
      }
    }
  }

  return `${props.baseUrl}/?${params.toString()}`;
}
