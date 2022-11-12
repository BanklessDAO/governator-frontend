export interface Poll {
  _id: string
  createdAt: string
  title: string
  client_config: ClientConfigDiscord[]
  author_user_id: number | string
}

interface ClientConfigBase {
  provider_id: string,
}

interface ClientConfigDiscord extends ClientConfigBase {
  channel_id: string;
  message_id: string;
  role_restrictions: string[];
}

export interface RenderedPoll {
  id?: string
  created?: string
  name?: string
  channel?: string | undefined
  author?: number | string
  votes?: number
  actions?: JSX.Element
}

export interface Address {
  _id: string
  createdAt: string
  updatedAt: string
  user_id: string
  provider_id: string
  verified: boolean
  verification_message: string
  nonce: string
}