import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Thrift Sharks collects, uses, and shares information when you buy, sell, or browse on the platform.",
};

export default function PrivacyPage() {
  return (
    <LegalDoc eyebrow="Legal" title="Privacy Policy" updated="October 19, 2026">
      <p>
        This Privacy Policy explains how Thrift Sharks (“<strong>Thrift Sharks</strong>,”
        “<strong>we</strong>,” “<strong>us</strong>,” or “<strong>our</strong>”) collects, uses,
        shares, and protects information when you use thriftsharks.com and related services
        (the “<strong>Service</strong>”). By using the Service, you agree to this Policy.
      </p>
      <p>
        Thrift Sharks is a marketplace that connects independent sellers with buyers. We do
        not hold payment funds. Buyers pay sellers through Stripe Connect (card checkout on
        the seller’s connected account). Stripe has its own privacy policy.
      </p>

      <h2>1. Information we collect</h2>

      <h3>1.1 Information you provide</h3>
      <ul>
        <li>
          <strong>Seller accounts:</strong> shop name, shop handle, email, password, optional
          tagline, bio, location, logo, banner, and Stripe Connect account identifiers.
        </li>
        <li>
          <strong>Listings & auctions:</strong> titles, descriptions, photos, prices, sizes,
          condition notes, and other listing details you upload.
        </li>
        <li>
          <strong>Orders:</strong> buyer name, email, shipping address, phone (if provided),
          order contents, and order status notes.
        </li>
        <li>
          <strong>Messages:</strong> content of buyer–seller direct messages and related
          contact details needed to deliver them.
        </li>
        <li>
          <strong>Contact & support:</strong> messages you send through our contact forms,
          including any item references you include.
        </li>
        <li>
          <strong>Newsletter:</strong> email address if you subscribe to updates.
        </li>
      </ul>

      <h3>1.2 Information collected automatically</h3>
      <ul>
        <li>
          <strong>Device & usage data:</strong> IP address, browser type, general location
          derived from IP, pages viewed, referring URLs, and approximate timestamps.
        </li>
        <li>
          <strong>Cookies & similar tech:</strong> session cookies for seller login, buyer
          inbox identity, shopping bag/cart state, and basic security. We may use local
          storage for cart contents on your device.
        </li>
        <li>
          <strong>Logs:</strong> server logs used for security, debugging, and abuse
          prevention.
        </li>
      </ul>

      <h3>1.3 Information from others</h3>
      <p>
        Stripe processes payments between buyers and sellers on connected accounts. We do
        not receive your full payment card or bank account numbers. We may receive payment
        status from Stripe webhooks (for example, “paid”).
      </p>

      <h2>2. How we use information</h2>
      <p>We use information to:</p>
      <ul>
        <li>Operate, maintain, and improve the Service (shops, listings, auctions, checkout, messaging).</li>
        <li>Create and secure seller accounts; authenticate sessions.</li>
        <li>Display storefronts, listings, and auction lots to other users.</li>
        <li>Process orders and show sellers the shipping and contact details they need to fulfill.</li>
        <li>Enable buyer–seller messaging and related notifications.</li>
        <li>Respond to support requests and investigate disputes, fraud, or policy violations.</li>
        <li>Send transactional messages (for example, order-related notices) and, if you opt in, marketing emails.</li>
        <li>Enforce our Terms of Service; protect rights, safety, and security.</li>
        <li>Comply with law and respond to lawful requests.</li>
        <li>Analyze aggregate usage to understand what features are used (in a way that does not identify you when practical).</li>
      </ul>

      <h2>3. How we share information</h2>
      <p>We share information in these situations:</p>
      <ul>
        <li>
          <strong>With the other party to a transaction:</strong> When you buy, the seller
          receives the shipping and contact details needed to fulfill. When you sell, buyers
          see your shop profile and listings.
        </li>
        <li>
          <strong>Public storefront content:</strong> Shop name, handle, bio, photos,
          listings, auction activity, and similar content you choose to publish are visible
          to visitors.
        </li>
        <li>
          <strong>Service providers:</strong> Hosting, databases, email delivery, analytics,
          and similar vendors who process data on our instructions.
        </li>
        <li>
          <strong>Legal & safety:</strong> If required by law, or to protect users, the
          public, or Thrift Sharks from harm, fraud, or abuse.
        </li>
        <li>
          <strong>Business transfers:</strong> If we merge, sell assets, or reorganize, data
          may transfer as part of that transaction, subject to this Policy or successor notice.
        </li>
        <li>
          <strong>With your direction:</strong> For example, if you ask us to share something
          with a third party.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal information for money. We do not share
        personal information for cross-context behavioral advertising as those terms are
        commonly defined under U.S. state privacy laws, unless we update this Policy and
        provide required choices.
      </p>

      <h2>4. Messages</h2>
      <p>
        Direct messages between buyers and sellers are stored so both parties (and, when
        needed for safety or support, Thrift Sharks staff) can review them. Do not send
        sensitive financial credentials, government ID numbers, or other highly sensitive
        data through messages. We may review, restrict, or remove messages that violate our
        Terms or law.
      </p>

      <h2>5. Photos and user content</h2>
      <p>
        Listing photos, logos, banners, and other uploads are stored to display your shop and
        listings. You are responsible for having the rights to upload them. We may remove
        content that violates our Terms or law.
      </p>

      <h2>6. Cookies and similar technologies</h2>
      <p>We use cookies and local storage to:</p>
      <ul>
        <li>Keep sellers signed in</li>
        <li>Identify buyers for inbox / messaging continuity</li>
        <li>Remember bag/cart contents</li>
        <li>Protect against abuse</li>
      </ul>
      <p>
        You can control cookies through your browser settings. Disabling cookies may break
        login, bag, or messaging features.
      </p>

      <h2>7. Data retention</h2>
      <p>
        We keep information as long as needed to provide the Service and for legitimate
        business, legal, and security purposes. Typical examples:
      </p>
      <ul>
        <li>Seller account data while the account is active, and for a reasonable period after closure for fraud prevention and legal compliance.</li>
        <li>Order records for accounting, dispute, and tax-related needs.</li>
        <li>Messages for a period needed for support and abuse investigation.</li>
        <li>Server logs for a shorter operational window unless needed longer for security.</li>
      </ul>
      <p>
        You may request deletion of your seller account via{" "}
        <Link href="/contact">Contact</Link>. We may retain limited information where we must
        (for example, completed orders, legal holds, or fraud prevention).
      </p>

      <h2>8. Security</h2>
      <p>
        We use reasonable technical and organizational measures to protect personal
        information (including encrypted transport where supported and hashed seller
        passwords). No method of transmission or storage is 100% secure. You are responsible
        for keeping your password confidential and for activity on your account.
      </p>

      <h2>9. Children’s privacy</h2>
      <p>
        The Service is not directed to children under 13, and we do not knowingly collect
        personal information from children under 13. If you believe a child under 13 has
        provided personal information, contact us and we will take appropriate steps to
        delete it. Sellers and buyers must meet the age requirements in our Terms.
      </p>

      <h2>10. Your choices and rights</h2>
      <ul>
        <li>
          <strong>Account:</strong> Sellers can update shop profile information in the
          dashboard.
        </li>
        <li>
          <strong>Marketing email:</strong> Unsubscribe using the link in a newsletter, or
          contact us.
        </li>
        <li>
          <strong>Access / correction / deletion:</strong> Contact us to request access,
          correction, or deletion of personal information we hold, subject to legal
          exceptions.
        </li>
        <li>
          <strong>U.S. state privacy rights:</strong> Residents of certain states (including
          California, Colorado, Connecticut, Virginia, and others) may have rights to know,
          delete, correct, or opt out of certain processing. To exercise rights, use{" "}
          <Link href="/contact">Contact</Link> and describe your request. We will not
          discriminate against you for exercising privacy rights.
        </li>
      </ul>
      <p>
        If we deny a request, you may appeal by replying to our decision and stating that you
        are appealing. You may also contact your state attorney general.
      </p>

      <h2>11. International users</h2>
      <p>
        The Service is operated from the United States. If you access it from elsewhere, you
        understand information may be processed in the U.S. and other countries where our
        providers operate, which may have different data-protection rules than your country.
      </p>

      <h2>12. Third-party links and services</h2>
      <p>
        The Service may link to Stripe, social sites, or other third parties. Their privacy
        practices are governed by their own policies. We are not responsible for those
        practices.
      </p>

      <h2>13. Changes to this Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the updated version
        with a new “Last updated” date. Material changes may also be communicated by email or
        a notice on the Service. Continued use after changes means you accept the updated
        Policy.
      </p>

      <h2>14. Contact</h2>
      <p>
        For privacy questions or requests, contact us through{" "}
        <Link href="/contact">thriftsharks.com/contact</Link> with the subject line “Privacy
        request.”
      </p>
    </LegalDoc>
  );
}
