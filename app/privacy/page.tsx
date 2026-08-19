import type { Metadata } from "next";
import { LegalPageLayout, LegalSection, LegalList, LegalNotice } from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — Investment Property Analyzer",
};

const EFFECTIVE_DATE = "August 19, 2026";
const LAST_UPDATED = "August 19, 2026";
const CONTACT_EMAIL = "privacy@myfinancial.help";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" effectiveDate={EFFECTIVE_DATE} lastUpdated={LAST_UPDATED}>
      <p>
        This Privacy Policy explains how MyFinancial.help (&quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;) collects, uses, discloses, and protects information when you use{" "}
        app.myfinancial.help (the &quot;Service&quot;).
      </p>

      <LegalSection heading="1. Information We Collect">
        <p>
          <strong className="text-slate-900">a. Account Information.</strong> When you create an
          account, we collect information such as your name, email address, and password (stored
          in encrypted/hashed form, not in plain text).
        </p>
        <p>
          <strong className="text-slate-900">b. Financial and Property Data You Provide.</strong>{" "}
          The Service lets you input data to analyze investment properties — for example, purchase
          price, income, expenses, financing terms, and similar figures. This data is saved to
          your account so you can return to and edit your analyses. We treat this as sensitive
          information and limit access to it as described in Section 4.
        </p>
        <p>
          <strong className="text-slate-900">c. Usage and Device Information.</strong> We
          automatically collect certain technical information when you use the Service, such as
          IP address, browser type, device type, pages viewed, and timestamps, typically through
          cookies, log files, and analytics tools.
        </p>
        <p>
          <strong className="text-slate-900">d. Communications.</strong> If you contact us for
          support or other inquiries, we retain a record of that correspondence.
        </p>
      </LegalSection>

      <LegalSection heading="2. How We Use Information">
        <p>We use the information we collect to:</p>
        <LegalList
          items={[
            "Create and maintain your account",
            "Save and display your investment property analyses back to you",
            "Operate, maintain, and improve the Service",
            "Monitor and analyze usage trends and Service performance",
            "Communicate with you about your account, updates, or support requests",
            "Detect, prevent, and address technical issues, fraud, or misuse",
            "Comply with legal obligations",
          ]}
        />
        <p>We do not sell your financial or property data to third parties.</p>
      </LegalSection>

      <LegalSection heading="3. Cookies and Analytics">
        <p>
          We use cookies and similar technologies (such as web analytics tools) to operate the
          Service and understand how it&apos;s used. You can control cookies through your browser
          settings; disabling cookies may limit some functionality of the Service.
        </p>
      </LegalSection>

      <LegalSection heading="4. How We Share Information">
        <p>We do not sell your personal or financial data. We may share information with:</p>
        <LegalList
          items={[
            <>
              <strong className="text-slate-900">Service providers:</strong> hosting providers,
              database providers, analytics providers, and similar vendors who process data on our
              behalf under contractual confidentiality and security obligations. This includes our
              property comps/valuation data provider (RentCast), which receives the property
              addresses you search so it can return market data, and our email delivery provider,
              which handles account verification and password-reset emails.
            </>,
            <>
              <strong className="text-slate-900">Future payment processor:</strong> if and when we
              introduce paid features, a third-party payment processor (e.g., Stripe) will handle
              billing information directly; we will update this policy at that time.
            </>,
            <>
              <strong className="text-slate-900">Legal and safety purposes:</strong> if required by
              law, subpoena, or legal process, or to protect our rights, users, or the public.
            </>,
            <>
              <strong className="text-slate-900">Business transfers:</strong> if we are involved in
              a merger, acquisition, or sale of assets, information may be transferred as part of
              that transaction, subject to this policy or a successor policy.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="5. Data Storage and Security">
        <p>
          Your account and financial/property data are stored in our database with access controls
          limiting who can view it. We use reasonable technical and organizational measures (such
          as encryption in transit, access restrictions, and secure hosting) to protect your
          information. However, no method of transmission or storage is 100% secure, and we cannot
          guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection heading="6. Data Retention">
        <p>
          We retain your account and property data for as long as your account is active, or as
          needed to provide the Service to you. If you delete your account, we will delete or
          anonymize your data within a reasonable period, except where we are required to retain it
          for legal, tax, or security purposes.
        </p>
      </LegalSection>

      <LegalSection heading="7. Your Rights and Choices">
        <p>Depending on your location, you may have rights to:</p>
        <LegalList
          items={[
            "Access the personal data we hold about you",
            "Correct inaccurate data",
            "Delete your account and associated data",
            "Export your data",
            "Opt out of certain data uses (e.g., marketing communications)",
          ]}
        />
        <p>
          You can update or delete most account and property data directly within the Service, or
          contact us using the information in Section 11 to make a request.
        </p>
        <p>
          <strong className="text-slate-900">California Residents.</strong> If you are a
          California resident, you may have additional rights under the California Consumer
          Privacy Act (CCPA/CPRA), including the right to know what personal information we
          collect and the right to request deletion. We do not sell personal information as
          defined by the CCPA.
        </p>
        <p>
          <strong className="text-slate-900">Other Jurisdictions.</strong> If you are located
          outside the United States, please be aware that your information will be transferred to
          and processed in the United States, which may have different data protection laws than
          your country of residence.
        </p>
      </LegalSection>

      <LegalSection heading="8. Children's Privacy">
        <p>
          The Service is not directed to individuals under 18, and we do not knowingly collect
          personal information from children. If we learn we have collected information from a
          child under 18, we will delete it.
        </p>
      </LegalSection>

      <LegalSection heading="9. Third-Party Links">
        <p>
          The Service may contain links to third-party websites or resources. We are not
          responsible for the privacy practices of those third parties. We encourage you to review
          their privacy policies before providing any information to them.
        </p>
      </LegalSection>

      <LegalSection heading="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we
          will provide notice (such as by posting an updated effective date or notifying you
          through the Service). Your continued use of the Service after changes take effect
          constitutes acceptance of the revised policy.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contact Us">
        <p>
          If you have questions about this Privacy Policy or wish to exercise your privacy rights,
          contact us at:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-slate-900 underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>{" "}
          — MyFinancial.help
        </p>
      </LegalSection>

      <LegalNotice>
        This document is a general-purpose template and has not been reviewed by an attorney.
        Depending on where your users are located and how the tool ultimately handles data (e.g.,
        analytics providers used, future payment processor, any plans to advertise or share data
        with lenders/agents), you should have this reviewed by a licensed attorney to confirm
        compliance with applicable state privacy laws (e.g., CCPA, VCDPA, and others) before
        publishing it live.
      </LegalNotice>
    </LegalPageLayout>
  );
}
