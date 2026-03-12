/**
 * File Purpose:
 * - Central configuration for package tab navigation.
 * - Declares top-level package tabs and their corresponding sub-tab options.
 * - Used by package query/filter logic and package tab UI to keep states aligned.
 */

export const PACKAGE_TABS = [
  { label: 'All Packages', value: 'all' },
  { label: 'Ready to Assign', value: 'ready-to-assign' },
  { label: 'In Transit', value: 'in-transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Return to Shop', value: 'return-to-shop' }
];

export const PACKAGE_SUB_TABS = {
  all: [
    { label: 'All', value: 'all' }
  ],
  'ready-to-assign': [
    { label: 'All Ready', value: 'all' },
    { label: 'Awaiting Schedule', value: 'awaiting_schedule' },
    { label: 'Scheduled for Pickup', value: 'scheduled_for_pickup' },
    { label: 'Exchange Awaiting Schedule', value: 'exchange-awaiting-schedule' },
    { label: 'Return Requested', value: 'return-requested' }
  ],
  'in-transit': [
    { label: 'All In Transit', value: 'all' },
    { label: 'Assigned', value: 'assigned' },
    { label: 'Picked Up', value: 'pickedup' },
    { label: 'In Transit', value: 'in-transit' }
  ],
  delivered: [
    { label: 'All Delivered', value: 'all' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Delivered & Returned', value: 'delivered-returned' }
  ],
  cancelled: [
    { label: 'All Cancelled', value: 'all' },
    { label: 'Cancelled & Cancelled Returned', value: 'cancelled-group' },
    { label: 'Rejected & Rejected Returned', value: 'rejected-group' }
  ],
  'return-to-shop': [
    { label: 'All Returns', value: 'all' },
    { label: 'Return Requested', value: 'return-requested' },
    { label: 'Return In Transit', value: 'return-in-transit' },
    { label: 'Return Pending', value: 'return-pending' },
    { label: 'Return Completed', value: 'return-completed' },
    { label: 'Exchange Requested', value: 'exchange-requests' },
    { label: 'Cancelled Awaiting Return', value: 'cancelled-awaiting-return' },
    { label: 'Rejected Awaiting Return', value: 'rejected-awaiting-return' },
    { label: 'Delivered Awaiting Return', value: 'delivered-awaiting-return' },
    { label: 'Exchange Completed', value: 'exchange-completed' }
  ]
};
