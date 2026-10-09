/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as welcomeEmail } from './welcome.tsx'
import { template as rentalRequestOwner } from './rental-request-owner.tsx'
import { template as rentalRequestRenter } from './rental-request-renter.tsx'
import { template as rentalAcceptedRenter } from './rental-accepted-renter.tsx'
import { template as rentalAcceptedOwner } from './rental-accepted-owner.tsx'
import { template as rentalRejected } from './rental-rejected.tsx'
import { template as cancellationOwner } from './cancellation-owner.tsx'
import { template as cancellationRenter } from './cancellation-renter.tsx'
import { template as newMessage } from './new-message.tsx'
import { template as reviewReceived } from './review-received.tsx'
import { template as productPublished } from './product-published.tsx'
import { template as passwordChanged } from './password-changed.tsx'
import { template as accountDeactivation } from './account-deactivation.tsx'
import { template as productRejected } from './product-rejected.tsx'
import { template as ticketCreated } from './ticket-created.tsx'
import { template as ticketReplied } from './ticket-replied.tsx'
import { template as ticketResolved } from './ticket-resolved.tsx'
import { template as withdrawalRequested } from './withdrawal-requested.tsx'
import { template as withdrawalProcessed } from './withdrawal-processed.tsx'
import { template as withdrawalRejected } from './withdrawal-rejected.tsx'
import { template as payoutReceived } from './payout-received.tsx'
import { template as accountBanned } from './account-banned.tsx'
import { template as pickupScheduled } from './pickup-scheduled.tsx'
import { template as pvPending } from './pv-pending.tsx'
import { template as pvOtherDone } from './pv-other-done.tsx'
import { template as handoverConfirmed } from './handover-confirmed.tsx'
import { template as returnReminder } from './return-reminder.tsx'
import { template as returnDeadline2h } from './return-deadline-2h.tsx'
import { template as returnInProgress } from './return-in-progress.tsx'
import { template as rentalCompletedOwner } from './rental-completed-owner.tsx'
import { template as rentalCompletedRenter } from './rental-completed-renter.tsx'
import { template as reviewReminder } from './review-reminder.tsx'
import { template as disputeOpened } from './dispute-opened.tsx'
import { template as requestReminder2hOwner } from './request-reminder-2h-owner.tsx'
import { template as requestReminder2hRenter } from './request-reminder-2h-renter.tsx'
import { template as requestExpiredOwner } from './request-expired-owner.tsx'
import { template as requestExpiredRenter } from './request-expired-renter.tsx'
import { template as profileUpdated } from './profile-updated.tsx'
import { template as ibanAdded } from './iban-added.tsx'
import { template as accountDeactivated } from './account-deactivated.tsx'
import { template as contractOtp } from './contract-otp.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcomeEmail,
  'rental-request-owner': rentalRequestOwner,
  'rental-request-renter': rentalRequestRenter,
  'rental-accepted-renter': rentalAcceptedRenter,
  'rental-accepted-owner': rentalAcceptedOwner,
  'rental-rejected': rentalRejected,
  'cancellation-owner': cancellationOwner,
  'cancellation-renter': cancellationRenter,
  'new-message': newMessage,
  'review-received': reviewReceived,
  'product-published': productPublished,
  'password-changed': passwordChanged,
  'account-deactivation': accountDeactivation,
  'product-rejected': productRejected,
  'ticket-created': ticketCreated,
  'ticket-replied': ticketReplied,
  'ticket-resolved': ticketResolved,
  'withdrawal-requested': withdrawalRequested,
  'withdrawal-processed': withdrawalProcessed,
  'withdrawal-rejected': withdrawalRejected,
  'payout-received': payoutReceived,
  'account-banned': accountBanned,
  'pickup-scheduled': pickupScheduled,
  'pv-pending': pvPending,
  'pv-other-done': pvOtherDone,
  'handover-confirmed': handoverConfirmed,
  'return-reminder': returnReminder,
  'return-deadline-2h': returnDeadline2h,
  'return-in-progress': returnInProgress,
  'rental-completed-owner': rentalCompletedOwner,
  'rental-completed-renter': rentalCompletedRenter,
  'review-reminder': reviewReminder,
  'dispute-opened': disputeOpened,
  'request-reminder-2h-owner': requestReminder2hOwner,
  'request-reminder-2h-renter': requestReminder2hRenter,
  'request-expired-owner': requestExpiredOwner,
  'request-expired-renter': requestExpiredRenter,
  'profile-updated': profileUpdated,
  'iban-added': ibanAdded,
  'account-deactivated': accountDeactivated,
  'contract-otp': contractOtp,
}
