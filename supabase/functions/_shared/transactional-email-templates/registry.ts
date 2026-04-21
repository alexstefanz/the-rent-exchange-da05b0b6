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
import { template as rentalAccepted } from './rental-accepted.tsx'
import { template as rentalRejected } from './rental-rejected.tsx'
import { template as cancellationOwner } from './cancellation-owner.tsx'
import { template as cancellationRenter } from './cancellation-renter.tsx'
import { template as newMessage } from './new-message.tsx'
import { template as reviewReceived } from './review-received.tsx'
import { template as productPublished } from './product-published.tsx'
import { template as passwordChanged } from './password-changed.tsx'
import { template as accountDeactivation } from './account-deactivation.tsx'
import { template as kycApproved } from './kyc-approved.tsx'
import { template as kycRejected } from './kyc-rejected.tsx'
import { template as kycReuploadRequested } from './kyc-reupload-requested.tsx'
import { template as kycSubmitted } from './kyc-submitted.tsx'
import { template as productRejected } from './product-rejected.tsx'
import { template as ticketCreated } from './ticket-created.tsx'
import { template as ticketReplied } from './ticket-replied.tsx'
import { template as ticketResolved } from './ticket-resolved.tsx'
import { template as withdrawalRequested } from './withdrawal-requested.tsx'
import { template as withdrawalProcessed } from './withdrawal-processed.tsx'
import { template as withdrawalRejected } from './withdrawal-rejected.tsx'
import { template as payoutReceived } from './payout-received.tsx'
import { template as accountBanned } from './account-banned.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcomeEmail,
  'rental-request-owner': rentalRequestOwner,
  'rental-request-renter': rentalRequestRenter,
  'rental-accepted': rentalAccepted,
  'rental-rejected': rentalRejected,
  'cancellation-owner': cancellationOwner,
  'cancellation-renter': cancellationRenter,
  'new-message': newMessage,
  'review-received': reviewReceived,
  'product-published': productPublished,
  'password-changed': passwordChanged,
  'account-deactivation': accountDeactivation,
  'kyc-approved': kycApproved,
  'kyc-rejected': kycRejected,
  'kyc-reupload-requested': kycReuploadRequested,
  'kyc-submitted': kycSubmitted,
  'product-rejected': productRejected,
  'ticket-created': ticketCreated,
  'ticket-replied': ticketReplied,
  'ticket-resolved': ticketResolved,
  'withdrawal-requested': withdrawalRequested,
  'withdrawal-processed': withdrawalProcessed,
  'withdrawal-rejected': withdrawalRejected,
  'payout-received': payoutReceived,
  'account-banned': accountBanned,
}
