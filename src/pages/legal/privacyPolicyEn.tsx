import { Link } from "react-router-dom";

const a = "text-primary hover:underline";

export const privacyIntroEn =
  "Through this Policy we inform you about how we collect, use, transfer and protect your personal data. We process it in accordance with Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, repealing Directive 95/46/EC (the “General Data Protection Regulation”, hereinafter “GDPR”) and the relevant national data protection legislation.";

export const privacySectionsEn = [
  {
    id: "operator",
    title: "WHO ARE WE?",
    content: (
      <div className="space-y-3">
        <p><strong>RENTLI 1 S.R.L.</strong>, hereinafter the Company or We,</p>
        <p>Our contact details are:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Registered office:</strong> Valea Lupului village, Valea Lupului commune, 42 Aleea cu Nuci St., Iași County, Romania</li>
          <li><strong>Unique registration code (CUI):</strong> 53914386</li>
          <li><strong>Trade Register number:</strong> J2026009653007</li>
          <li><strong>Website:</strong> <a href="https://rentli.ro" target="_blank" rel="noopener noreferrer" className={a}>https://rentli.ro</a></li>
          <li><strong>E-mail:</strong> office@rentli.ro, gdpr@rentli.ro</li>
          <li><strong>Contact:</strong> via the contact form available on the Platform or at the e-mail addresses above</li>
        </ul>
      </div>
    ),
  },
  {
    id: "cum-prelucram",
    title: "HOW DO WE PROCESS YOUR PERSONAL DATA?",
    content: (
      <div className="space-y-3">
        <p>The Company, as Controller, processes the personal data of job applicants, employees, individual customers, representatives of corporate customers, contractual partners and collaborators, and of other natural persons who interact with the Company and/or are involved in contractual relationships with it.</p>
        <p>Personal data is:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>processed lawfully, fairly and transparently in relation to the data subject;</li>
          <li>collected for specified, explicit and legitimate purposes and not further processed in a manner incompatible with those purposes;</li>
          <li>adequate, relevant and limited to what is necessary for the purposes for which it is processed;</li>
          <li>accurate and kept up to date;</li>
          <li>kept in a form which permits identification of data subjects for no longer than necessary for the purposes of processing;</li>
          <li>processed in a manner that ensures appropriate security, including protection against unauthorised or unlawful processing and against accidental loss, destruction or damage, using appropriate technical or organisational measures.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "tipuri-date",
    title: "WHAT TYPES OF PERSONAL DATA DO WE PROCESS AND FOR WHAT PURPOSE?",
    content: (
      <div className="space-y-3">
        <p>In the context of <strong>recruitment</strong>, we process: surname, first name, address, date of birth, citizenship, gender, phone number, e-mail address, professional and/or social experience, education and training, skills and other personal data contained in the CV and cover letter submitted and, where applicable, resulting from the job interview.</p>
        <p>For the <strong>conclusion and performance</strong> of <strong>service</strong> and <strong>partnership/collaboration</strong> contracts, we mainly process: surname, first name, identity card/passport series and number, gender, home/residence address, bank account number, e-mail address, phone number.</p>
        <p>For <strong>creating and managing the user account</strong> and <strong>completing the contact form</strong> on the Company's website – <a href="https://rentli.ro" target="_blank" rel="noopener noreferrer" className={a}>https://rentli.ro</a> (hereinafter the “website” or the “Platform”), we process: surname, first name, e-mail address, phone number, password (encrypted) and, where applicable, other data provided at the data subject's initiative in the message field.</p>
        <p>For <strong>identity verification</strong> of Platform users, in order to prevent fraud and ensure transaction safety, we may process: surname and first name, date of birth, identity document series and number, and the image of the identity document presented. The personal numeric code <u>is processed only where required by law and in compliance with the safeguards of art. 4</u> <u>of Law no. 190/2018. The image of the identity document is stored for a strictly</u> limited period and access to it is restricted to specifically designated staff.</p>
        <p>For <strong>intermediating bookings and processing payments</strong> made through the Platform, we process: identification and contact data of the owner and renter, data about the rented item, rental period and price, booking history, history of payments, refunds and any penalties. Full payment instrument data (card number, expiry date, security code) <strong>is not collected or stored by the Company</strong>; it is processed directly by the authorised payment processor.</p>
        <p>For <strong>documenting the condition of the item</strong> at handover and return, users may upload photos of the <u>rented item. These photos are intended exclusively to document the item's condition and may</u> <u>incidentally contain personal data. Users must not upload</u> <u>images containing identifiable persons, licence plates, documents or other</u> personal information not necessary for this purpose.</p>
        <p>For <strong>communication between users</strong>, support provided through our support channels and <strong>resolving complaints and disputes</strong>, we process the content of messages sent through the Platform, identification data of the parties involved, documents and evidence submitted, and ratings and reviews published by users.</p>
        <p>For <strong>fraud prevention and Platform security</strong>, we process technical and usage data (IP address, device identifiers, access and authentication logs, account activity history). This processing may lead to temporary account suspension. We do not take decisions based solely on automated processing that produce legal effects or similarly significantly affect you without ensuring your right to obtain human intervention, to express your point of view and to contest the decision.</p>
        <p>Please note that the Company acts as an <strong>intermediary</strong> between owners and renters. Once a booking is confirmed, some of your identification and contact data is communicated to the other party to the rental contract, strictly to the extent necessary for its performance. From that <u>moment, the other party processes that data as a separate controller, on its own</u> responsibility, and the Company cannot control how it is used.</p>
        <p>The Platform is <strong>not intended for minors.</strong> Creating an account and concluding contracts through the Platform is allowed only to persons aged 18 or over with full legal capacity. If we become aware that we have collected data of a <u>person who does not meet this condition, we will delete that data without delay.</u></p>
        <p>For <strong>website visitors</strong> we may collect data through cookies or similar technologies, such as: IP address, browser, location, pages visited on our website, time spent on the website, internet network, device used. For more details, see the <Link to="/politica-cookies" className={a}>Cookie Policy.</Link></p>
        <p>We do not use your personal data to send you <strong>marketing communications</strong> such as <strong>newsletters</strong> unless you expressly consent to such communications by ticking a consent box. In that case, we process only your e-mail and make sure you have a simple option to unsubscribe at any time, i.e. to withdraw your consent to receiving these communications.</p>
      </div>
    ),
  },
  {
    id: "dreptul-la-imagine",
    title: "PROCESSING OF PHOTOGRAPHS AND THE RIGHT TO ONE'S OWN IMAGE",
    content: (
      <div className="space-y-3">
        <p>The image of an identifiable natural person is personal data. The Company processes it in compliance with <strong>art. 6(1)(a) and art. 7 GDPR</strong> and <strong>art. 73–74 of the Romanian Civil Code</strong> on the right to one's own image.</p>
        <p><strong>a) Photos and videos produced by the Company.</strong> When we take photos or video recordings featuring employees, collaborators, customers or other data subjects, to be used for promotion, public communication, internal materials or press releases, processing takes place <strong>solely on the basis of the prior, written, freely given, specific, informed and unambiguous consent</strong> of the data subject, obtained through a separate consent form. Consent is not a condition for concluding or performing an employment or collaboration contract, and refusal entails no disadvantage.</p>
        <p>The standard form can be viewed and downloaded here: <Link to="/formular-consimtamant-imagine" className={a}>Consent form regarding the right to one's own image</Link>.</p>
        <p><strong>b) Withdrawal of consent.</strong> The data subject may withdraw consent at any time by a request sent to <a href="mailto:gdpr@rentli.ro" className={a}>gdpr@rentli.ro</a>. Withdrawal takes effect for the future, and materials under our control will be removed or anonymised without undue delay; withdrawal does not affect the lawfulness of processing carried out before it.</p>
        <p><strong>c) Photos uploaded by users on the Platform.</strong> Photos for listings and for handover/return of items are intended solely to present and document the item's condition. Users must not upload images containing identifiable persons, licence plates, documents or other personal information not necessary for this purpose. If a user nevertheless uploads an image with an identifiable person, the user is responsible for obtaining that person's prior consent. The Company may remove, upon notification or on its own initiative, any image that breaches these rules.</p>
        <p><strong>d) Duration.</strong> Photo/video materials produced on the basis of consent are kept for the period indicated in the form or until consent is withdrawn, whichever comes first.</p>
      </div>
    ),
  },
  {
    id: "temeiuri-legale",
    title: "WHAT ARE THE LEGAL BASES FOR PROCESSING PERSONAL DATA?",
    content: (
      <div className="space-y-3">
        <p>Your personal data is processed for:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>concluding and performing various contracts;</li>
          <li>fulfilling our legal obligations;</li>
          <li>on the basis of consent requested and/or previously given (in recruitment, for sending marketing communications, etc.);</li>
          <li>for the <strong>legitimate interests</strong> pursued by the Company (e.g. protection and security measures for our employees, exercising the Company's rights and legitimate interests in contentious or non-contentious proceedings, etc.).</li>
        </ul>
        <p>Specifically, the legal bases for the processing described above are:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>art. 6(1)(b) GDPR</strong> – performance of a contract: creating and managing the user account, intermediating bookings, processing payments and refunds, support provided through our support channels;</li>
          <li><strong>art. 6(1)(c) GDPR</strong> – <u>compliance with legal obligations: tax and accounting obligations,</u> <u>handling consumer complaints, responding to requests from competent authorities;</u></li>
          <li><strong>art. 6(1)(f) GDPR</strong> – <u>the Company's legitimate interests: preventing fraud and</u> <u>abuse of the Platform, verifying user identity, ensuring the security of</u> <u>IT systems, documenting the condition of rented items, resolving disputes between</u> <u>users, establishing, exercising or defending legal claims, improving</u> <u>services. For each of these processing operations we have carried out a balancing test between</u> <u>our interests and your rights and freedoms, which can be made available on request;</u></li>
          <li><strong>art. 6(1)(a) GDPR</strong> – <u>your consent: sending marketing</u> <u>communications, use of non-essential cookies, and any other</u> <u>processing for which we expressly ask for your consent. Consent may be withdrawn at</u> <u>any time without affecting the lawfulness of processing carried out before withdrawal.</u></li>
        </ul>
      </div>
    ),
  },
  {
    id: "durata",
    title: "HOW LONG DO WE PROCESS YOUR PERSONAL DATA?",
    content: (
      <div className="space-y-3">
        <p>Personal data is stored for as long as necessary to achieve the purposes set out in this Policy or for the period required by law (e.g. archiving, accounting, etc.).</p>
        <p>As a guide, we apply the following retention periods:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>user account data</strong> – for the lifetime of the account and 30 days after its closure;</li>
          <li><strong>identity document image</strong> <u>– maximum 30 days after verification is completed,</u> after which only the verification result is kept;</li>
          <li><strong>booking and payment data and handover/return photos</strong> <u>– 3 years from</u> <u>the end of the rental, corresponding to the general limitation period, or until</u> final resolution of a pending dispute;</li>
          <li><strong>supporting documents for accounting records</strong> <u>– 5 years, calculated from</u> 1 July of the year following the end of the financial year, according to art. 25 of Accounting Law no. 82/1991; annual financial statements are kept for 10 years;</li>
          <li><strong>data processed for marketing</strong> – until consent is withdrawn;</li>
          <li><strong>proof of cookie consent</strong> – 6 months;</li>
          <li><strong>technical and security logs</strong> – 12 months.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "destinatari",
    title: "WHO DO WE SHARE PERSONAL DATA WITH?",
    content: (
      <div className="space-y-3">
        <p>We will not communicate or transfer to any third party any personal data collected from or about you, <strong>except</strong> to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Public authorities and institutions</strong> – where there is a legal obligation or for a legitimate interest (defending the Company's rights in contentious or non-contentious proceedings, etc.).</li>
          <li><strong>The Company's contractual partners or collaborators</strong> providing web hosting, website development and maintenance, online marketing, etc.</li>
          <li><strong>Any third party</strong> – if you have given express and specific consent for that situation and that data.</li>
          <li><strong>Other Platform users</strong> – the owner and renter receive each other's identification and contact data strictly necessary to perform the rental contract, after the booking is confirmed.</li>
          <li><strong>The payment processor</strong> – Stripe Payments Europe, Ltd. – to initiate and secure transactions.</li>
          <li><strong>Hosting and infrastructure providers</strong> – Lovable (cloud infrastructure and databases), Cyberfolks (web hosting).</li>
          <li><strong>Communication service providers</strong> – Resend (transactional e-mails) and SMSAlert (SMS messages).</li>
        </ul>
        <p>Where personal data processed by the Company is <strong>transferred</strong>, directly or through its contractual partners/collaborators, <strong>outside the European Economic Area</strong>, we ensure that such transfers comply with the GDPR (in particular art. 46 GDPR) and applicable law, on the basis of appropriate safeguards (standard data protection clauses adopted by the Commission) and provided that enforceable rights and effective remedies are available to data subjects.</p>
        <p>Insofar as some of our providers are established in the United States, the transfer takes place, as applicable, under <strong>European Commission Adequacy Decision (EU) 2023/1795 on the EU–US Data Privacy Framework</strong>, where the provider is certified under this mechanism, or under standard contractual clauses accompanied by a <u>transfer impact assessment. The up-to-date list of recipients and applicable transfer mechanisms can</u> <u>be obtained on request, using the contact details in this Policy.</u></p>
      </div>
    ),
  },
  {
    id: "protectie",
    title: "WHAT PROTECTION MEASURES AND SAFEGUARDS DO WE TAKE?",
    content: (
      <div className="space-y-3">
        <p>The Company implements <u>appropriate technical and organisational measures to ensure a</u> high level of security and protection of personal data. We use security methods and technologies, together with internal policies and working procedures, including control and audit, to protect the personal data collected in accordance with the applicable data protection legislation.</p>
      </div>
    ),
  },
  {
    id: "drepturi",
    title: "WHAT ARE YOUR RIGHTS AS A DATA SUBJECT?",
    content: (
      <div className="space-y-3">
        <p>Any data subject may exercise the following rights, as provided by the General Data Protection Regulation:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>The right of access;</li>
          <li>The right to rectification;</li>
          <li>The right to erasure;</li>
          <li>The right to restriction of processing;</li>
          <li>The right to data portability;</li>
          <li>The right to object to processing;</li>
          <li><u>The right not to be subject to a decision based solely on automated processing, including</u> <u>profiling;</u></li>
          <li><strong>The right to withdraw consent</strong> at any time, where processing is based on consent, without affecting the lawfulness of processing carried out before withdrawal;</li>
          <li>The right to lodge a complaint with the National Supervisory Authority for Personal Data Processing (www.dataprotection.ro) and to go to court.</li>
        </ul>
        <p><strong>The National Supervisory Authority for Personal Data Processing</strong> can be <u>contacted at: 28-30 G-ral. Gheorghe Magheru Blvd., sector 1, postal code 010336,</u> <u>Bucharest, e-mail: anspdcp@dataprotection.ro.</u></p>
        <p><u>We will respond to your requests without undue delay and in any case within one month of</u> <u>receipt. This period may be extended by up to two further months where necessary,</u> <u>taking into account the complexity and number of requests, in which case we will inform you</u> <u>of the extension and the reasons for it within one month of receipt.</u></p>
        <p><u>In the event of a personal data breach, we will notify</u> <u>the National Supervisory Authority for Personal Data Processing in accordance</u> <u>with art. 33 GDPR and, where the breach is likely to result in a high risk to</u> <u>your rights and freedoms, we will inform you without undue delay, according to art. 34</u> GDPR.</p>
        <p>To exercise these rights or for any questions regarding the processing of <u>your personal data, please</u> contact us at: <a href="mailto:gdpr@rentli.ro" className={a}>gdpr@rentli.ro</a> <strong>our dedicated data protection e-mail address</strong> or by phone: <strong>0365.401.269</strong>. Data Protection Officer <u>(DPO)</u> services are outsourced and provided by <u>GDPRComplet.</u></p>
      </div>
    ),
  },
];
