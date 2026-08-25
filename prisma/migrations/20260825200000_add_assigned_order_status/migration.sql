-- Add the explicit delivery-assigned stage to the order lifecycle.
ALTER TYPE "OrderStatus" ADD VALUE 'ASSIGNED' AFTER 'PENDING';
