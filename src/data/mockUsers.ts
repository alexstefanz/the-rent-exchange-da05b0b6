export interface MockUser {
  id: string;
  name: string;
  avatar: string;
  memberSince: string;
  lastActive: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  responseRate: number;
  responseTime: string;
}

export const mockUsers: MockUser[] = [
  {
    id: "user-1",
    name: "Alexandru Rentals",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    memberSince: "2020",
    lastActive: "Acum 2 ore",
    rating: 4.9,
    reviewCount: 287,
    verified: true,
    responseRate: 98,
    responseTime: "< 1 oră",
  },
];

export const getDefaultOwner = (): { name: string; avatar: string; memberSince: string; id: string } => ({
  id: mockUsers[0].id,
  name: mockUsers[0].name,
  avatar: mockUsers[0].avatar,
  memberSince: mockUsers[0].memberSince,
});

export const getUserById = (id: string): MockUser | undefined => {
  return mockUsers.find(user => user.id === id);
};
