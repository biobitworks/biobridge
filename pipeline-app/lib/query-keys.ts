export type QueryParams = Readonly<
  Record<string, string | number | boolean | null | undefined>
>;

export const queryKeys = {
  workspaceMembers: () => ["workspace", "members"] as const,
  leads: {
    all: () => ["leads"] as const,
    lists: () => [...queryKeys.leads.all(), "list"] as const,
    list: (params: QueryParams = {}) =>
      [...queryKeys.leads.lists(), params] as const,
    infiniteList: (params: QueryParams = {}) =>
      [...queryKeys.leads.lists(), "infinite", params] as const,
  },
};
