export type UserConversationType = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
};

export type MessageType = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  text: string;
  conversationId: string;
  sender: "user" | "bot";
};

export type UserDataType = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
};

export type ReportType = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string;
  status: "open" | "resolved";
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type ModelType = {
  id: string;
  name: string;
  key: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};
