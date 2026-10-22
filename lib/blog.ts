export type Inline = string | { href: string; text: string };

export type Block =
  | { kind: "h2"; text: string }
  | { kind: "p"; inlines: Inline[] }
  | { kind: "ul"; items: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  blocks: Block[];
};

function p(...inlines: Inline[]): Block {
  return { kind: "p", inlines };
}

function h2(text: string): Block {
  return { kind: "h2", text };
}

function ul(items: string[]): Block {
  return { kind: "ul", items };
}

export const posts: BlogPost[] = [
  {
    slug: "how-to-start-reselling-clothes",
    title: "How to start reselling clothes online",
    description:
      "A practical way to start reselling clothes: pick a lane, price from sold comps, photograph the flaws, and ship the piece yourself.",
    date: "2026-10-21",
    blocks: [
      p(
        "Reselling clothes online is simple to start and easy to do badly. You buy or clear out a piece, list it with honest photos, and ship it when someone pays. The shops that last are the ones a buyer can understand in ten seconds.",
      ),
      h2("Pick a lane"),
      p(
        "A shop that is “a bit of everything” is hard to remember. Streetwear, sneakers, vintage outerwear, or one brand you actually know is enough. You can widen later. Early on, a clear shop is how repeat buyers find you.",
      ),
      h2("Only list what you can describe"),
      p(
        "If you cannot name the brand, the size, the fabric, and the flaws, do not list it yet. Secondhand buyers decide from the description. A stain you hoped nobody would notice becomes a message, then a refund you have to sort out yourself.",
      ),
      h2("Price from what sold, not what you want"),
      p(
        "Search sold listings for the same piece, same era, and similar wear. Asking prices are wishes. A sold price from last month is a number. If yours has pilling, a repair, or no tags, start under the clean examples.",
      ),
      h2("You keep the item until it sells"),
      p(
        "A marketplace is not a warehouse. On ",
        { href: "/", text: "Thrift Sharks" },
        " the seller holds the piece, ships it, and sets the returns policy. The item price and the $9.99 shipping charge go to the shop through Stripe. A $5 platform fee is added on a normal order, and it is waived when the buyer or the shop is Verified.",
      ),
      h2("A first week that is enough"),
      ul([
        "Open the shop and connect Stripe so a buyer can pay you.",
        "List five pieces, not fifty. Front, back, label, and one close-up of any flaw.",
        "Write the measurements you would want if you were buying it.",
        "Say how you ship and whether you accept returns.",
        "Answer messages the same day. Silence is why people do not come back.",
      ]),
      p(
        "When those five are live, list the next five. Volume without photos is how a shop looks empty even when it is full.",
      ),
    ],
  },
  {
    slug: "sell-streetwear-online",
    title: "How to sell streetwear online",
    description:
      "What actually helps streetwear sell: condition, size, tag photos, and a price based on recent sales rather than hype.",
    date: "2026-10-21",
    blocks: [
      p(
        "Streetwear sells when the buyer can see the piece is the one they want and the size is the size they wear. Logos, collabs, and a clean wash tag do more than a paragraph of adjectives.",
      ),
      h2("Say what it is, specifically"),
      p(
        "Brand, item, color, year or season if you know it, and size on the tag. “Vintage tee” is a category. “1998 single-stitch, tagged large, pit to pit 21 inches” is a listing. If you are guessing the year, say you are guessing.",
      ),
      h2("Condition is the whole listing"),
      ul([
        "Deadstock means unworn, with the usual paper and tags still there.",
        "Excellent means worn lightly, no holes, no yellowing you are hiding.",
        "Anything else needs the flaw in the first photo, not the last line.",
      ]),
      p(
        "Fades can be the point of the piece. A hole in the collar is not a fade. Photograph it.",
      ),
      h2("Price the market you are actually in"),
      p(
        "A collab that sold for a number last year may sit at half that now. Check sold comps from the last month. If you want bids instead of a fixed price, a timed auction is the cleaner way to find out. Auctions on Thrift Sharks are part of a Verified shop.",
      ),
      h2("One piece means one piece"),
      p(
        "There is no second medium in the back. When it sells, the listing is done. Write the measurements, because a tag size from twenty years ago is not a size anyone should trust.",
      ),
      p(
        "Ship it yourself after the buyer pays. You are the seller. The platform takes a fee on the order and does not hold the garment, authenticate it, or run your returns.",
      ),
    ],
  },
  {
    slug: "how-to-price-secondhand",
    title: "How to price secondhand clothes and sneakers",
    description:
      "Price resale from recent sold listings, then account for condition, fees, and the shipping the buyer pays on top.",
    date: "2026-10-21",
    blocks: [
      p(
        "The right price is the one a buyer pays this month for a piece in this condition. Everything else is a story you tell yourself while the listing sits.",
      ),
      h2("Start with sold comps"),
      p(
        "Find three to five sales of the same item, close in size and wear, from the last few weeks. Throw out the outlier that went for triple because two people fought over it. The middle of the remaining prices is your range. List near the top of that range only if your photos are better and the piece is cleaner.",
      ),
      h2("Mark condition in money, not in adjectives"),
      ul([
        "Missing box on sneakers: price it as a no-box pair, not as a complete pair you will explain later.",
        "Repairs, stains, and sole wear: step down a tier. Buyers can see the photo and will not pay the clean price.",
        "Deadstock with tags: you can ask the top of the range. You still need the sold comps.",
      ]),
      h2("Know which money is yours"),
      p(
        "On Thrift Sharks the buyer pays the item price, a flat $9.99 shipping charge when the order ships, and a $5 platform fee per shop. Shipping settles to you, so use it for postage. The platform fee is waived when the buyer is Verified or your shop is Verified. Stripe’s card fee comes out of the payout on your connected account. The item never sits with the platform.",
      ),
      p(
        "Do not bury postage inside the item price and then get surprised when the buyer also pays shipping. Say what they pay. A clear total beats a cheap sticker with a fee hiding under it.",
      ),
      h2("If it does not move"),
      p(
        "Wait a week, then drop the price or rewrite the title so the brand and the item are first. More adjectives will not fix a number that is above the last sale.",
      ),
    ],
  },
  {
    slug: "selling-sneakers-secondhand",
    title: "Selling sneakers secondhand without a store",
    description:
      "How to list a pair of sneakers from home: size, box, sole photos, and shipping them yourself after the buyer pays.",
    date: "2026-10-21",
    blocks: [
      p(
        "You do not need a shopfront to sell sneakers. You need the pair, a straight answer about wear, and a way for the buyer to pay you. The rest is photos and packing.",
      ),
      h2("The facts that decide the sale"),
      ul([
        "Brand, model, colorway, and the size printed in the shoe.",
        "Whether both shoes are included, and whether the box and spare laces are too.",
        "Wear on the sole, the toe, and the heel. Yellowing if it is there.",
        "Any repair, crease through the leather, or insole swap.",
      ]),
      p(
        "Photograph both shoes, the soles, the size tag, the tongue label, and the box label if you have the box. One glamour shot of the pair from above is not a listing.",
      ),
      h2("You are responsible for what you claim"),
      p(
        "If you say a pair is authentic, that claim is yours. Thrift Sharks does not authenticate sneakers and does not hold them while someone inspects. The buyer pays your shop. You ship, or you arrange pickup. If there is a problem, the buyer deals with you. The shop can be suspended until an unresolved order is handled. That does not move the shoes to the platform.",
      ),
      h2("Packing"),
      p(
        "Stuff the shoes so they do not collapse, tape the box if you ship in it, and put a second bag around a pair that might bleed or shed. The $9.99 shipping charge on a shipped order is paid to you. If the label costs more than that, the difference comes out of the item price, so price the pair with your real postage in mind.",
      ),
      p(
        "Local pickup is between you and the buyer after checkout. There is no counter to collect from.",
      ),
    ],
  },
  {
    slug: "how-to-photograph-clothes-to-sell",
    title: "How to photograph clothes so they sell",
    description:
      "Phone photos that help a resale listing: daylight, a plain background, the label, and a close-up of every flaw.",
    date: "2026-10-21",
    blocks: [
      p(
        "Buyers cannot touch the piece. Your photos are the rack, the fitting room, and the returns policy they wish they had read. A phone in daylight is enough. A filter is not.",
      ),
      h2("The set that covers a garment"),
      ul([
        "Front, filling the frame, on a hanger or laid flat.",
        "Back, including the hem and the collar.",
        "The brand label and the size tag, in focus.",
        "A close-up of each flaw: stain, hole, pull, missing button, altered hem.",
        "Hardware, zipper, and inside waistband if those are why someone would buy it.",
      ]),
      h2("Light and background"),
      p(
        "Stand near a window. Overhead kitchen light turns black fabric into a grey muddle and hides wear. Use a wall, a bedsheet, or the floor. A busy rug behind a pair of shoes makes the shoes look cheaper than they are.",
      ),
      p(
        "Shoot a little wide and crop later. Cut-off cuffs are the most common reason a listing looks careless.",
      ),
      h2("What to stop doing"),
      ul([
        "Heavy filters that change the color. If the jacket is green, the photo should be green.",
        "One photo for a $200 piece. People assume you are hiding the other side.",
        "A mirror selfie with the tag still the only clue to the size.",
      ]),
      p(
        "Write measurements next to the photos. Pit to pit, length, waist, inseam, or the sneaker size in the shoe. A tag that says medium is not a measurement.",
      ),
    ],
  },
  {
    slug: "buying-secondhand-online",
    title: "Buying one-of-one secondhand online",
    description:
      "How to buy secondhand online when every piece is unique: read the flaws, message the seller, and know who actually has the item.",
    date: "2026-10-21",
    blocks: [
      p(
        "One-of-one means there is no other size coming next week. If the listing is wrong for you, it is wrong. The useful habit is to read the listing as if the seller is slightly tired and the photo is slightly kind.",
      ),
      h2("Before you pay"),
      ul([
        "Read the condition notes and look at the flaw photos, not only the cover shot.",
        "Check measurements against a piece you already own. Tag size is a hint.",
        "See who the shop is. A named shop with other listings is easier to message than a blank account.",
        "Ask the seller for one more photo if something is unclear. Ask them, not the platform. They have the piece.",
      ]),
      h2("Who has your money and the item"),
      p(
        "You pay the shop by card through Stripe. The item price and shipping go to that seller. Thrift Sharks charges a $5 platform fee on a normal order, unless your account or that shop is Verified. The seller keeps the item until they ship it. There is no warehouse in the middle.",
      ),
      h2("Returns"),
      p(
        "Returns are the seller’s policy, written by that shop. Thrift Sharks does not take returns and does not store a piece while a dispute is open. If a shop will not deal with a real problem, the shop can be suspended until it is handled. Read the listing before you need that.",
      ),
      p(
        "If the piece is up for auction, a bid is an offer to buy at that price. Do not bid on a size you have not checked.",
      ),
    ],
  },
  {
    slug: "thrift-flipping-guide",
    title: "Thrift flipping without wasting your weekends",
    description:
      "How thrift flipping works when you want a margin: buy less, list cleaner, and keep the records yourself.",
    date: "2026-10-21",
    blocks: [
      p(
        "Thrift flipping is buying underpriced secondhand and selling it to someone who wants that exact piece. The margin is real when you know the item. It disappears when you buy piles of clothes you cannot describe.",
      ),
      h2("Buy less than you want to"),
      p(
        "A good flip is a piece you can name, size, and price before you leave the store. If you are buying it because the rack was cheap, you are about to own a storage problem. Five pieces you can list tonight beat a bag you will list “later.”",
      ),
      h2("The listing is the work"),
      p(
        "Sourcing is the part that feels like the job. The sale happens because of the title, the measurements, and the flaw photo. A shop page collects those listings in one place, which is easier for a buyer than a trail of posts that vanish. Open the shop once, then every flip has a home.",
      ),
      h2("Track the money like it is a shop"),
      p(
        "Write down what you paid, what it sold for, and what postage actually cost. The shipping charge a buyer pays is yours to spend on the label. A platform fee and the card fee are costs, not a surprise at the end of the month. Taxes on your sales are yours to report. Nobody at the marketplace files them for you.",
      ),
      h2("A simple week"),
      ul([
        "Source on one day.",
        "Photograph and list the next day, while you still remember the flaws.",
        "Ship the day an order is paid. A slow ship is how a good flip becomes a complaint.",
        "Drop the price on anything still sitting after a week if the comps say you are high.",
      ]),
      p(
        "That loop is the whole business. More tools will not fix a week where the photos never got taken.",
      ),
    ],
  },
  {
    slug: "how-to-sell-designer-vintage",
    title: "How to sell designer vintage online",
    description:
      "List designer vintage so a buyer can judge the era, the size, and the wear: labels, measurements, and a price from sold comps.",
    date: "2026-10-21",
    blocks: [
      p(
        "Designer vintage sells to people who already know the piece and will not forgive a vague listing. They want the house, the decade if you know it, the size as it measures, and proof you looked at the hardware.",
      ),
      h2("Name it like a buyer would search it"),
      p(
        "Put the designer and the item first. “Black coat” is not a title. “Saint Laurent wool tuxedo jacket, tagged 38” is. If you are unsure of the season, leave the season out. A wrong year is worse than no year.",
      ),
      h2("What designer buyers check"),
      ul([
        "The main label, the size tag, and any care or fabric label.",
        "Stamps on zippers, buttons, and hardware. Photograph them sharp.",
        "Lining, including stains and repairs along the seams.",
        "Whether the piece was altered: taken-in waist, shortened sleeves, replaced buttons.",
        "Flat measurements. A vintage size is not a modern size.",
      ]),
      h2("Do not guess authenticity"),
      p(
        "If you know the piece and can say why, say so and show the marks. If you do not know, do not write “guaranteed authentic.” Thrift Sharks does not authenticate designer goods and does not hold them for inspection. The claim in the listing is yours, and so is the sale.",
      ),
      h2("Price the exact object"),
      p(
        "A blazer with a replaced lining is not the same comp as a complete one. Search sold prices for the same designer, the same kind of piece, and similar condition. Then list one item. When it sells, it is gone. You ship it. The buyer pays you through Stripe, including the $9.99 shipping charge. A $5 platform fee applies on a normal order unless the buyer or your shop is Verified.",
      ),
    ],
  },
  {
    slug: "vintage-designer-condition",
    title: "How to describe condition on vintage designer",
    description:
      "A condition note for designer vintage: wear, repairs, smell, and alterations, written so the buyer is not surprised.",
    date: "2026-10-21",
    blocks: [
      p(
        "Designer pieces are old on purpose. Age is not the problem. A surprise is the problem. The listing should read like you already told the buyer the worst thing about it.",
      ),
      h2("Use words that mean one thing"),
      ul([
        "Unworn: no wear, tags or buyer’s paper still with it if that is normal for the piece.",
        "Excellent: light wear, no holes, no repairs you are hiding, hardware still original.",
        "Good: visible wear a buyer can see in the photos, still sound.",
        "Fair: flaws that change how it looks or fits. Say them in the first lines.",
      ]),
      p(
        "“Vintage condition” means nothing. Pick one of those and then list the specifics under it.",
      ),
      h2("The flaws people ask about anyway"),
      ul([
        "Underarm wear, collar rub, and shine on wool.",
        "Cracks, dryness, or color loss on leather.",
        "Loose chain, cloudy hardware, or a strap that has been replaced.",
        "Moth holes, including ones in the lining.",
        "Smell. If it smells like storage, say it has been aired and still smells, or do not list it yet.",
        "Alterations. A let-out seam or a cut sleeve belongs in the title area, not under a fold.",
      ]),
      h2("Photos that match the words"),
      p(
        "One close-up per flaw, in daylight. If the note says “small mark on the cuff” and the photo shows a stain the size of a coin, you have written the wrong note. Buyers of designer vintage compare your words to the picture before they pay.",
      ),
      p(
        "Returns are yours to offer or refuse. The marketplace does not take the piece back and does not store it during an argument. A clear condition note is how you avoid that argument.",
      ),
    ],
  },
  {
    slug: "selling-vintage-designer-bags",
    title: "Selling vintage designer bags",
    description:
      "What to show on a vintage designer bag: shape, hardware, stamps, strap, and interior, before you name a price.",
    date: "2026-10-21",
    blocks: [
      p(
        "A vintage bag is bought on the details. The silhouette gets the click. The stamp, the hardware, and the inside get the sale.",
      ),
      h2("Shoot the bag the way it sits"),
      ul([
        "Front, back, and both sides, standing if it stands, empty so the shape is honest.",
        "Handle and strap, including the underside where it rubs.",
        "Hardware close up: turnlock, feet, zipper pulls, any stamp in the metal.",
        "Interior, pockets, and the brand stamp or plaque. Include peeling, ink, and pen marks.",
        "The base. Corners and feet show age faster than the front.",
      ]),
      h2("Say what is original"),
      p(
        "If the strap is a replacement, the lining was swapped, or a foot is missing, write that in the first lines. Buyers searching for a specific bag already know what the hardware should look like. They are checking whether yours still has it.",
      ),
      p(
        "Serial numbers and date codes, when the bag has them, should be photographed and readable. Do not invent a code you cannot see. If you are not sure the bag is the designer on the plaque, do not list it as that designer.",
      ),
      h2("Price and shipping"),
      p(
        "Comp the same model, similar leather wear, and the same completeness: box and dust bag change the number, and so does a replaced strap. You keep the bag until it sells. Pack it so the shape survives the trip, and remember the $9.99 shipping charge is what the buyer pays you toward postage. If the label costs more, the rest comes out of your price.",
      ),
      p(
        "Thrift Sharks does not authenticate bags and does not hold them. You are the seller. If an order is left unresolved, the shop can be suspended until you handle it.",
      ),
    ],
  },
  {
    slug: "selling-vintage-jackets",
    title: "Selling vintage jackets and coats",
    description:
      "Measurements, lining, and leather wear: how to list a vintage jacket so the size is obvious before anyone pays.",
    date: "2026-10-21",
    blocks: [
      p(
        "Jackets are where vintage sizing punishes a lazy listing. A 1980s medium and a current medium are different garments. Buyers know that. They are looking for inches.",
      ),
      h2("Measure before you title it"),
      ul([
        "Chest, pit to pit, then doubled in the description so nobody has to do the math.",
        "Shoulder seam to shoulder seam.",
        "Sleeve from the shoulder seam to the cuff.",
        "Length from the collar base to the hem.",
        "Tag size and the designer or maker, if there is one.",
      ]),
      p(
        "Put the chest measurement in the title or the first line. People filter with their eyes, and they will skip a coat that makes them guess.",
      ),
      h2("Material decides the photos"),
      p(
        "Wool: show the lining, the buttons, and any moth nips, including inside. Leather: show the collar fold, the cuffs, and any crack or dryness in daylight, not under a yellow lamp. Denim jackets: show the hem, the buttons, and whether it was cropped by a previous owner.",
      ),
      h2("Designer outerwear"),
      p(
        "If it is a designer piece, treat the label and the hardware as part of the product. Photograph them. Mention alterations. A cropped trench that left the factory long is a different item from the one in the campaign photo your buyer remembers.",
      ),
      p(
        "One coat, one listing. You store it, you ship it, you decide if you take returns. On a normal order the buyer pays your price, $9.99 toward shipping, and a $5 platform fee unless someone on the order is Verified.",
      ),
    ],
  },
  {
    slug: "selling-vintage-denim",
    title: "How to sell vintage denim",
    description:
      "Waist, rise, inseam, and hem: the measurements and wear notes that get vintage jeans and jackets sold.",
    date: "2026-10-21",
    blocks: [
      p(
        "Vintage denim buyers shop by numbers. The wash gets them to look. The waist, rise, and inseam decide whether they pay.",
      ),
      h2("Measure the jeans, not the tag"),
      ul([
        "Waist laid flat, buttoned, then doubled.",
        "Rise, front, from the crotch seam to the top of the waistband.",
        "Inseam and outseam.",
        "Leg opening.",
        "Tag size and the brand on the patch, if the patch is still there.",
      ]),
      p(
        "A tag that says 32 and a waist that measures 30 is a size 30. Write the measurement. People who wear vintage denim have been disappointed before.",
      ),
      h2("Wear that belongs in the photos"),
      ul([
        "Honeycombs, whiskers, and hems that were cut or left raw.",
        "Repairs and patches, especially on the seat and the pockets.",
        "Selvedge on the coin pocket or the outseam, if it has it. Show the ID.",
        "Thin spots. If you can see skin through the thigh, that is the listing.",
      ]),
      h2("Jackets and shirts in the same wash"),
      p(
        "A denim jacket needs chest, shoulders, sleeve, and length, same as any vintage jacket. A western shirt needs the same plus the yoke and whether the snaps are original. If the piece is a known maker, the label photo is not optional.",
      ),
      p(
        "Price from sold pairs in the same waist and a similar wash, not from the rarest example of that brand. You still have the jeans until someone buys them. Ship them folded clean, and say if you accept a return. The platform will not.",
      ),
    ],
  },
  {
    slug: "selling-vintage-graphic-tees",
    title: "Selling vintage graphic tees",
    description:
      "Single stitch, the print, the tag, and the holes: how to list a vintage tee without overselling a soft shirt.",
    date: "2026-10-21",
    blocks: [
      p(
        "Graphic tees are a volume game until the print is rare. Then they are a one-of-one game. Either way the buyer wants the shirt’s age, the print’s condition, and the actual width.",
      ),
      h2("What to put in the title"),
      p(
        "The band, team, brand, or event on the print, then the decade if you can support it, then the tag size. “Vintage tee” is the category, not the name. If the print is a tour, name the tour. If you only know the image, describe the image and do not invent a year.",
      ),
      h2("Details that change the price"),
      ul([
        "Single stitch or double stitch on the sleeves and hem.",
        "The neck tag: brand, country, and whether it is torn.",
        "Copyright line on the print, photographed so it can be read.",
        "Cracks, missing ink, and stains on the graphic itself.",
        "Holes at the collar, the pits, and the hem.",
        "Pit to pit and length. A tagged large from 1994 is often a modern medium.",
      ]),
      p(
        "Paper-thin is a selling point for some shirts and a defect for others. Say if the fabric is sheer. Photograph it against a dark background if you are unsure.",
      ),
      h2("Do not soak the price in hope"),
      p(
        "Common reprints and modern shirts with a fake wash should not be listed as vintage. If you are not sure, say “graphic tee” and show the tag. A buyer who wanted a single-stitch shirt will know. You would rather lose that sale than take the message afterwards.",
      ),
      p(
        "List it as one shirt. When it sells, ship it. Thrift Sharks does not hold stock, and a $5 platform fee is the charge on a normal order, waived for a Verified buyer or a Verified shop.",
      ),
    ],
  },
];

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug) ?? null;
}

export function relatedPosts(slug: string, count = 2) {
  const index = posts.findIndex((post) => post.slug === slug);
  if (index < 0) return posts.slice(0, count);
  const out = [];
  for (let step = 1; out.length < count && step < posts.length; step += 1) {
    out.push(posts[(index + step) % posts.length]);
  }
  return out;
}
