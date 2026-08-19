import type { Metadata } from "next";
import { LegalPageLayout, LegalSection, LegalList, LegalNotice } from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service — Investment Property Analyzer",
};

const EFFECTIVE_DATE = "August 19, 2026";
const LAST_UPDATED = "August 19, 2026";
const CONTACT_EMAIL = "privacy@myfinancial.help";

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service" effectiveDate={EFFECTIVE_DATE} lastUpdated={LAST_UPDATED}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of app.myfinancial.help (the
        &quot;Service&quot;), operated by MyFinancial.help (&quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;). By creating an account or otherwise using the Service, you agree to
        these Terms. If you do not agree, do not use the Service.
      </p>

      <LegalSection heading="1. Eligibility">
        <p>
          You must be at least 18 years old to create an account or use the Service. By using the
          Service, you represent that you meet this requirement and that the account information
          you provide is accurate.
        </p>
      </LegalSection>

      <LegalSection heading="2. Description of the Service">
        <p>
          The Service is an educational and informational tool that helps you organize and
          calculate figures related to investment real estate — for example, cap rate,
          cash-on-cash return, DSCR, and similar metrics — based on data you enter and, where
          configured, third-party comps and valuation data. Results are estimates generated from
          the numbers provided and the assumptions built into each calculator; they are not
          guaranteed to be accurate, complete, or suitable for any particular property or
          transaction.
        </p>
      </LegalSection>

      <LegalSection heading="3. No Financial, Investment, Legal, or Tax Advice">
        <p>
          The Service does not provide financial, investment, legal, tax, or real estate advice,
          and nothing produced by the Service — including any &quot;Strong Buy,&quot; &quot;Good
          Investment,&quot; &quot;Marginal,&quot; or &quot;Pass&quot; verdict — constitutes a
          recommendation to buy, sell, or otherwise act on any property or investment. We are not
          a licensed financial advisor, broker, or real estate professional, and no
          advisor-client, fiduciary, or professional relationship is created by your use of the
          Service. You should consult a qualified attorney, accountant, financial advisor, and/or
          licensed real estate professional before making any investment decision.
        </p>
      </LegalSection>

      <LegalSection heading="4. Account Registration and Security">
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activity that occurs under your account. Notify us immediately at the contact
          below if you suspect unauthorized access to your account.
        </p>
      </LegalSection>

      <LegalSection heading="5. Acceptable Use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            "Use the Service for any unlawful purpose or in violation of these Terms",
            "Attempt to gain unauthorized access to another user's account or data",
            "Scrape, reverse-engineer, or bulk-extract data from the Service, or automate requests to it in a way that degrades the Service for other users",
            "Misuse third-party data made available through the Service (e.g., MLS/comps data) in a way that violates that provider's own terms of use",
            "Upload or submit content that is unlawful, infringing, or that you don't have the right to submit",
          ]}
        />
      </LegalSection>

      <LegalSection heading="6. Your Content and Data">
        <p>
          You retain ownership of the property and financial data you enter into the Service. By
          submitting it, you grant us a limited license to store, process, and display it back to
          you solely to operate and provide the Service (including saved analyses, portfolio
          comparisons, and printable reports). We do not claim ownership of your data and do not
          sell it — see our{" "}
          <a href="/privacy" className="text-slate-900 underline underline-offset-2">
            Privacy Policy
          </a>{" "}
          for details on how it&apos;s handled and shared.
        </p>
      </LegalSection>

      <LegalSection heading="7. Third-Party Data, Links, and Affiliate Content">
        <p>
          The Service may incorporate data from third-party providers (such as MLS/comps and
          valuation data) and may contain links to third-party websites. We do not control, and
          are not responsible for, the accuracy, completeness, or availability of third-party data
          or the content or practices of any linked site. Where the Service displays sponsored,
          affiliate, or advertising content, it will be labeled as such; we may receive
          compensation in connection with those links, which does not influence the calculators'
          underlying math.
        </p>
      </LegalSection>

      <LegalSection heading="8. Fees">
        <p>
          The Service is currently offered free of charge. If we introduce paid features in the
          future, pricing and billing terms will be presented to you at that time, billing will be
          handled by a third-party payment processor, and these Terms will be updated accordingly.
        </p>
      </LegalSection>

      <LegalSection heading="9. Disclaimer of Warranties">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT
          WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, OR NON-INFRINGEMENT. WE DO
          NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT ANY CALCULATION,
          VERDICT, OR THIRD-PARTY DATA WILL BE ACCURATE OR CURRENT.
        </p>
      </LegalSection>

      <LegalSection heading="10. Limitation of Liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, MYFINANCIAL.HELP AND ITS OWNERS, EMPLOYEES, AND
          AFFILIATES WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
          PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, OR INVESTMENT VALUE, ARISING FROM OR
          RELATED TO YOUR USE OF THE SERVICE OR ANY DECISION MADE IN RELIANCE ON IT, EVEN IF
          ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING
          FROM THESE TERMS OR THE SERVICE WILL NOT EXCEED THE AMOUNT YOU PAID US, IF ANY, IN THE
          TWELVE MONTHS BEFORE THE CLAIM AROSE.
        </p>
      </LegalSection>

      <LegalSection heading="11. Termination">
        <p>
          You may stop using the Service and delete your account at any time. We may suspend or
          terminate your account if we reasonably believe you&apos;ve violated these Terms, misused
          the Service, or created risk or legal exposure for us or other users. Where practical, we
          will make reasonable efforts to notify you.
        </p>
      </LegalSection>

      <LegalSection heading="12. Changes to the Service or These Terms">
        <p>
          We may modify or discontinue features of the Service, and we may update these Terms from
          time to time. If we make material changes, we will provide notice (such as by posting an
          updated effective date or notifying you through the Service). Your continued use of the
          Service after changes take effect constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection heading="13. Governing Law">
        <p>
          These Terms are governed by the laws of [Insert State], without regard to its conflict of
          laws principles, and any dispute arising from these Terms or the Service will be subject
          to the exclusive jurisdiction of the courts located in [Insert State/County].
        </p>
      </LegalSection>

      <LegalSection heading="14. Contact Us">
        <p>
          If you have questions about these Terms, contact us at:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-slate-900 underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>{" "}
          — MyFinancial.help
        </p>
      </LegalSection>

      <LegalNotice>
        This document is a general-purpose template and has not been reviewed by an attorney. It
        was drafted to parallel the Privacy Policy's structure and disclaimer, but the governing-law
        jurisdiction, your actual business entity name, dispute-resolution approach (e.g., whether
        you want an arbitration clause or class-action waiver), and the liability-limitation
        language all need a licensed attorney's review before this is published live — especially
        given the Service produces buy/pass verdicts that could inform real investment decisions.
      </LegalNotice>
    </LegalPageLayout>
  );
}
