import type { UserRole } from "@/lib/generated/prisma/client";

export type DashboardPermissions = {
  canViewDashboard: boolean;

  // Inventory
  canViewInventory: boolean;
  canAddProduct: boolean;
  canUpdateStock: boolean;
  canRemoveStock: boolean;

  // Orders
  canViewOperationalOrders: boolean;
  canViewCompletedOrders: boolean;
  canViewTodaySales: boolean;
  canAssignOrders: boolean;

  // Delivery
  canManageDeliveryAssignments: boolean;
};

export function getDashboardPermissions(
  role: UserRole,
): DashboardPermissions {
  switch (role) {
    /*
     * --------------------------------------------------
     * GLOBAL ADMIN
     * --------------------------------------------------
     *
     * Admin has full dashboard access.
     */
    case "ADMIN":
      return {
        canViewDashboard: true,

        // Inventory
        canViewInventory: true,
        canAddProduct: true,
        canUpdateStock: true,
        canRemoveStock: true,

        // Orders
        canViewOperationalOrders: true,
        canViewCompletedOrders: true,
        canViewTodaySales: true,
        canAssignOrders: true,

        // Delivery
        canManageDeliveryAssignments: true,
      };

    /*
     * --------------------------------------------------
     * BRANCH ADMIN / BRANCH MANAGER
     * --------------------------------------------------
     *
     * Branch managers can operate their own branch.
     *
     * They can:
     * - Manage inventory
     * - View operational orders
     * - View completed orders
     * - View today's sales
     * - Assign orders to delivery staff
     * - Manage delivery assignments
     */
    case "BRANCH_ADMIN":
      return {
        canViewDashboard: true,

        // Inventory
        canViewInventory: true,
        canAddProduct: true,
        canUpdateStock: true,
        canRemoveStock: true,

        // Orders
        canViewOperationalOrders: true,
        canViewCompletedOrders: true,
        canViewTodaySales: true,
        canAssignOrders: true,

        // Delivery
        canManageDeliveryAssignments: true,
      };

    /*
     * --------------------------------------------------
     * BRANCH STAFF
     * --------------------------------------------------
     *
     * Branch staff are restricted to inventory operations.
     *
     * They can:
     * - View inventory
     * - Add products to branch inventory
     * - Update stock
     * - Remove/deactivate stock
     *
     * They CANNOT:
     * - View today's operational sales
     * - View completed orders
     * - View today's sales
     * - Assign orders
     * - Manage delivery assignments
     */
    case "BRANCH_STAFF":
      return {
        canViewDashboard: true,

        // Inventory
        canViewInventory: true,
        canAddProduct: true,
        canUpdateStock: true,
        canRemoveStock: true,

        // Orders
        canViewOperationalOrders: false,
        canViewCompletedOrders: false,
        canViewTodaySales: false,
        canAssignOrders: false,

        // Delivery
        canManageDeliveryAssignments: false,
      };

    /*
     * --------------------------------------------------
     * DELIVERY STAFF
     * --------------------------------------------------
     *
     * Delivery staff do not have dashboard access.
     */
    case "DELIVERY_STAFF":
      return {
        canViewDashboard: false,

        // Inventory
        canViewInventory: false,
        canAddProduct: false,
        canUpdateStock: false,
        canRemoveStock: false,

        // Orders
        canViewOperationalOrders: false,
        canViewCompletedOrders: false,
        canViewTodaySales: false,
        canAssignOrders: false,

        // Delivery
        canManageDeliveryAssignments: false,
      };

    /*
     * --------------------------------------------------
     * CUSTOMER
     * --------------------------------------------------
     *
     * Customers never receive dashboard permissions.
     */
    case "CUSTOMER":
    default:
      return {
        canViewDashboard: false,

        // Inventory
        canViewInventory: false,
        canAddProduct: false,
        canUpdateStock: false,
        canRemoveStock: false,

        // Orders
        canViewOperationalOrders: false,
        canViewCompletedOrders: false,
        canViewTodaySales: false,
        canAssignOrders: false,

        // Delivery
        canManageDeliveryAssignments: false,
      };
  }
}