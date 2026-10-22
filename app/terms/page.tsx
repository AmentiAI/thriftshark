import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing use of Thrift Sharks — buying, selling, auctions, messaging, and Stripe payouts.",
};

export default function TermsPage() {
  return (
    <LegalDoc eyebrow="Legal" title="Terms of Service" updated="October 21, 2026">
      <p>
        These Terms of Service (“<strong>Terms</strong>”) govern your access to and use of
        thriftsharks.com and related services (the “<strong>Service</strong>”) operated by
        Thrift Sharks (“<strong>Thrift Sharks</strong>,” “<strong>we</strong>,” “
        <strong>us</strong>,” or “<strong>our</strong>”). By using the Service, creating a
        shop, listing an item, bidding, messaging, or placing an order, you agree to these
        Terms and our <Link href="/privacy">Privacy Policy</Link>.
      </p>
      <p>
        If you do not agree, do not use the Service.
      </p>

      <h2>1. What Thrift Sharks is</h2>
      <p>
        Thrift Sharks is an online marketplace. Independent sellers open shops, list
        one-of-one secondhand goods, run timed auctions, and sell directly to buyers.
        <strong> We are not the seller, and we have no store or warehouse.</strong> The
        contract of sale is between the buyer and the seller. Sellers keep their own goods.
        We do not take possession of, store, or ship product.
      </p>
      <p>
        We charge a platform fee on orders. Buyers pay sellers through Stripe Connect
        (direct charges on the seller’s connected account). Item price and shipping settle
        to the seller. The platform fee is collected through Stripe. We do not hold the
        item, and we do not hold the seller’s payout. Stripe is a third party with its own
        terms.
      </p>
      <p>
        We do not handle returns, refunds, or exchanges. Those are between the buyer and
        the seller. If a seller leaves an order or dispute unresolved, we may suspend that
        shop until it is handled. Suspension does not mean we take the product or pay
        either party.
      </p>

      <h2>2. Eligibility</h2>
      <ul>
        <li>You must be at least <strong>18 years old</strong> to create a seller account, list items, bid in auctions, or complete a purchase.</li>
        <li>You must be able to form a binding contract under applicable law.</li>
        <li>You may not use the Service if we have previously banned or suspended you.</li>
        <li>Sellers must provide accurate identity, contact, and payout information and keep it current.</li>
      </ul>

      <h2>3. Accounts</h2>
      <p>
        Sellers are responsible for their login credentials and all activity under their
        account. Notify us promptly if you suspect unauthorized access. We may suspend or
        terminate accounts that violate these Terms, appear fraudulent, or pose risk to users
        or the Service.
      </p>

      <h2>4. Marketplace roles</h2>

      <h3>4.1 Buyers</h3>
      <ul>
        <li>Review listing descriptions, photos, condition notes, and seller policies before buying or bidding.</li>
        <li>Provide accurate shipping and contact information.</li>
        <li>Pay the seller the agreed amount through the method shown for that order, promptly after ordering or winning an auction.</li>
        <li>Communicate respectfully through the Service’s messaging tools.</li>
      </ul>

      <h3>4.2 Sellers</h3>
      <ul>
        <li>Only list items you own and have the right to sell.</li>
        <li>Describe items accurately, including flaws, measurements, and authenticity where relevant. Photograph defects honestly.</li>
        <li>Fulfill paid orders in a reasonable time and pack items securely.</li>
        <li>Set and honor your own shipping and returns terms. Thrift Sharks does not accept returns or hold the goods.</li>
        <li>Comply with all applicable laws (consumer, tax, import/export, product safety, and secondhand-goods rules).</li>
        <li>Keep your Stripe payout setup complete so buyers can pay you.</li>
      </ul>

      <h2>5. Listings and prohibited items</h2>
      <p>You may not list or sell:</p>
      <ul>
        <li>Stolen, counterfeit, or illegally obtained goods</li>
        <li>Weapons, explosives, or illegal drugs</li>
        <li>Hazardous materials not permitted for shipment</li>
        <li>Items that infringe intellectual property or publicity rights</li>
        <li>Adult sexual content involving minors; any CSAM</li>
        <li>Recall-hazardous products you know are unsafe</li>
        <li>Services that are not physical goods, unless we expressly allow them</li>
        <li>Anything else prohibited by law or that we reasonably determine is harmful to the marketplace</li>
      </ul>
      <p>
        We may remove listings, cancel auctions, or suspend shops without prior notice when we
        believe these rules are violated.
      </p>
      <p>
        Stock on Thrift Sharks is generally <strong>one-of-one</strong>. When an item is sold
        or won at auction, it should no longer be available for purchase by others.
      </p>

      <h2>6. Pricing, fees, and payments</h2>
      <ul>
        <li>Sellers set prices (and auction parameters) and are responsible for arranging shipping or local pickup.</li>
        <li>Everyone needs an account to check out, as a buyer or by opening a store. Thrift Sharks does not charge listing fees. A flat platform fee (currently $5 per shop order) is waived for Verified buyers and Verified shops. Buyer Verified is $10 for 30 days and includes a green check plus automatic entry in the weekly giveaway. A flat shipping fee (currently $9.99 per shop order when shipping) is charged to the buyer at checkout. Shipping settles to the seller; the platform fee is collected through Stripe.</li>
        <li>
          <strong>Direct payment:</strong> Payment is made by the buyer through Stripe Connect.
          Item price and shipping settle to the seller’s Stripe account. The platform fee is
          collected as an application fee. Thrift Sharks is not a bank, money transmitter, or
          escrow.
        </li>
        <li>We are not responsible for payment errors, Stripe processing delays or disputes, or sellers who fail to ship after being paid.</li>
        <li>Sellers are solely responsible for collecting, reporting, and remitting any taxes that apply to their sales.</li>
      </ul>

      <h2>7. Orders and fulfillment</h2>
      <p>
        Placing an order creates a purchase request with that seller. The seller must confirm
        payment and ship the item. Title and risk of loss transfer according to the agreement
        between buyer and seller and applicable law (often when the seller delivers the item
        to the carrier, unless otherwise agreed).
      </p>
      <p>
        If a seller does not receive payment, they may cancel the order. If a buyer pays and
        the seller does not ship, the buyer should contact the seller. We can suspend the
        shop until the order is handled.{" "}
        <strong>
          We do not hold the product, and we are not obligated to refund money paid to the
          seller.
        </strong>
      </p>

      <h2>8. Auctions</h2>
      <ul>
        <li>Auctions have a hard end time. When time expires, the highest valid bid at or above any stated reserve (if met) generally wins.</li>
        <li>Bids are binding offers. Sham bidding, bid manipulation, or using secondary accounts to inflate prices is prohibited.</li>
        <li>If a reserve is not met, the seller is not obligated to sell.</li>
        <li>Winning buyers must complete checkout / payment instructions promptly. Failure may result in cancellation and account restrictions.</li>
        <li>We may cancel lots that violate these Terms or appear fraudulent.</li>
      </ul>

      <h2>9. Returns and disputes</h2>
      <p>
        <strong>Thrift Sharks does not handle returns.</strong> We do not accept shipped-back
        goods, issue refunds for a seller’s sale, or store an item while a dispute is open.
        Any return, refund, or exchange is solely between the buyer and the seller, on
        whatever terms that seller stated. Buyers should read the listing, including
        photographed flaws, before paying.
      </p>
      <p>
        If a seller will not resolve a genuine order problem, we may suspend that shop until
        it is handled. We may also remove the listing. We are not required to mediate, to
        take the product, or to compensate either party. Nothing in these Terms limits
        non-waivable consumer rights under applicable law.
      </p>

      <h2>10. Messaging</h2>
      <p>
        Messaging is for legitimate purchase questions and order coordination. You may not use
        messaging to spam, harass, solicit off-platform fraud, share malware, or circumvent
        safety systems. We may access messages for safety, abuse prevention, legal compliance,
        and support.
      </p>

      <h2>11. Content license and IP</h2>
      <p>
        You retain ownership of content you upload (photos, text, logos). You grant Thrift
        Sharks a non-exclusive, worldwide, royalty-free license to host, display, reproduce,
        and distribute that content as needed to operate and promote the Service (including
        showing your listings in search results, emails, and social previews).
      </p>
      <p>
        The Thrift Sharks name, crest, logos, and site design are our intellectual property.
        You may not copy or use them except as needed to identify your shop on our platform
        or with our written permission.
      </p>
      <p>
        If you believe content on the Service infringes your copyright, contact us via{" "}
        <Link href="/contact">Contact</Link> with a DMCA-style notice including your contact
        information, the work claimed infringed, the URL of the allegedly infringing material,
        and a statement made under penalty of perjury that you are authorized to act.
      </p>

      <h2>12. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Scrape, crawl, or harvest the Service in a way that overloads or bypasses access controls</li>
        <li>Interfere with security or attempt unauthorized access</li>
        <li>Upload malware or harmful code</li>
        <li>Impersonate others or misrepresent affiliation</li>
        <li>Manipulate rankings, reviews, auctions, or inventory availability</li>
        <li>Use the Service for money laundering, fraud, or other illegal activity</li>
      </ul>

      <h2>13. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED
        BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT
        LISTINGS ARE ACCURATE, THAT SELLERS WILL SHIP, THAT PAYMENTS WILL COMPLETE, OR THAT
        THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.
      </p>
      <p>
        You acknowledge that interactions with other users are at your own risk. We do not
        pre-screen every listing or user.
      </p>

      <h2>14. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, THRIFT SHARKS AND ITS OPERATORS WILL NOT BE
        LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE
        DAMAGES, OR FOR LOST PROFITS, LOST DATA, OR LOSS OF GOODWILL, ARISING FROM YOUR USE OF
        THE SERVICE OR ANY TRANSACTION BETWEEN USERS.
      </p>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT
        OF THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE PLATFORM FEES YOU PAID TO THRIFT
        SHARKS IN THE TWELVE MONTHS BEFORE THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS
        (US $100). Item price and shipping are paid to the seller. We do not hold that money
        or the product.
      </p>
      <p>
        Some jurisdictions do not allow certain limitations; in those cases, our liability is
        limited to the fullest extent permitted.
      </p>

      <h2>15. Indemnity</h2>
      <p>
        You agree to indemnify and hold harmless Thrift Sharks and its operators from claims,
        damages, losses, and expenses (including reasonable attorneys’ fees) arising out of
        your content, your listings, your transactions with other users, your breach of these
        Terms, or your violation of law or third-party rights.
      </p>

      <h2>16. Suspension and termination</h2>
      <p>
        You may stop using the Service at any time. Sellers may request account closure via{" "}
        <Link href="/contact">Contact</Link>, subject to completing open orders where
        required. We may suspend or terminate access immediately for violations, legal risk,
        or prolonged inactivity. We may also suspend a seller until open orders or disputes
        are handled. A suspension does not transfer the goods to us. Provisions that should
        survive (including IP, disclaimers, limitations, and indemnity) will survive
        termination.
      </p>

      <h2>17. Changes to the Service or Terms</h2>
      <p>
        We may modify or discontinue features at any time. We may update these Terms by
        posting a new version with a revised date. Material changes may also be announced on
        the site or by email. Continued use after changes become effective constitutes
        acceptance.
      </p>

      <h2>18. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of the State of Rhode Island and applicable U.S.
        federal law, without regard to conflict-of-law rules. Except where prohibited, you
        agree that disputes will be resolved in state or federal courts located in Rhode
        Island, and you consent to personal jurisdiction there. Either party may seek
        injunctive relief for IP or unauthorized access issues in any court of competent
        jurisdiction.
      </p>
      <p>
        <strong>Optional informal resolution:</strong> Before filing a claim, you agree to try
        to resolve the dispute informally by contacting us via{" "}
        <Link href="/contact">Contact</Link> and allowing 30 days for a response.
      </p>

      <h2>19. Miscellaneous</h2>
      <ul>
        <li>These Terms are the entire agreement between you and us regarding the Service.</li>
        <li>If a provision is unenforceable, the rest remains in effect.</li>
        <li>Our failure to enforce a provision is not a waiver.</li>
        <li>You may not assign these Terms without our consent; we may assign them in connection with a merger, acquisition, or sale of assets.</li>
        <li>Headings are for convenience only.</li>
      </ul>

      <h2>20. Contact</h2>
      <p>
        For questions about these Terms, use <Link href="/contact">Contact</Link> with the
        subject “Terms of Service.”
      </p>
    </LegalDoc>
  );
}
