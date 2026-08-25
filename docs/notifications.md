# Budget Go notifications

## Events

- `NEW_ORDER`: sent to the selected branch manager and branch staff when a customer places an order.
- `DELIVERY_ASSIGNED`: sent to the assigned delivery staff member.

Each notification is persisted in PostgreSQL and sent to every registered device for the recipient.

Expired push endpoints are removed automatically after a provider 404/410 response.
