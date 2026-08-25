import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Better Auth's admin plugin normally uses the built-in `admin` / `user`
 * roles. Budget Go intentionally stores application roles as uppercase
 * Prisma enum values, so we define those roles explicitly and give only
 * ADMIN the built-in administrator permissions.
 */
export const ac = createAccessControl(defaultStatements);

export const adminRole = ac.newRole({
  ...adminAc.statements,
});

const noAdminPermissions = {
  user: [],
  session: [],
} as const;

export const customerRole = ac.newRole(noAdminPermissions);
export const branchAdminRole = ac.newRole(noAdminPermissions);
export const branchStaffRole = ac.newRole(noAdminPermissions);
export const deliveryStaffRole = ac.newRole(noAdminPermissions);

export const roles = {
  ADMIN: adminRole,
  CUSTOMER: customerRole,
  BRANCH_ADMIN: branchAdminRole,
  BRANCH_STAFF: branchStaffRole,
  DELIVERY_STAFF: deliveryStaffRole,
};
