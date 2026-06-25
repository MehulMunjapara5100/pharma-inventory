export type Role = "admin" | "vendor" | "seller" | "manager";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    "products:read", "products:write", "products:delete",
    "inventory:read", "inventory:write", "inventory:adjust",
    "sales:read", "sales:write",
    "users:read", "users:write", "users:delete",
    "reports:read",
    "notifications:read", "notifications:write",
    "settings:read", "settings:write"
  ],
  manager: [
    "products:read", "products:write",
    "inventory:read", "inventory:adjust",
    "sales:read",
    "reports:read",
    "notifications:read"
  ],
  seller: [
    "products:read",
    "inventory:read",
    "sales:read", "sales:write",
    "notifications:read"
  ],
  vendor: [
    "products:read",
    "inventory:read", "inventory:write",
    "sales:read",
    "notifications:read"
  ]
};

export function hasPermission(role: Role, perm: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

export const ROLE_HOME: Record<Role, string> = {
  admin: "/dashboard",
  manager: "/dashboard",
  seller: "/sales",
  vendor: "/inventory"
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  manager: "Manager",
  seller: "Seller",
  vendor: "Vendor"
};
