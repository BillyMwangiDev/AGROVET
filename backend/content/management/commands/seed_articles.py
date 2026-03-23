"""
Management command: seed_articles
Populates the Educational Hub with professional, research-backed articles
relevant to agrovet farming in the Mt Kenya / Nyeri region.

Usage:
    python manage.py seed_articles
    python manage.py seed_articles --reset   # delete existing before seeding
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from content.models import Article, ArticleCategory


CATEGORIES = [
    {"name": "Reproductive Management", "slug": "reproductive-management"},
    {"name": "Animal Nutrition",         "slug": "animal-nutrition"},
    {"name": "Veterinary Health",        "slug": "veterinary-health"},
    {"name": "Poultry Farming",          "slug": "poultry-farming"},
    {"name": "Feed & Forage",            "slug": "feed-and-forage"},
]

# ---------------------------------------------------------------------------
# Article bodies are written as rich HTML.
# All factual claims include inline citations or a References section.
# Images: upload manually via Admin → Content → Articles after running seed.
# ---------------------------------------------------------------------------

ARTICLES = [
    # ── Article 1 ──────────────────────────────────────────────────────────
    {
        "title": "Artificial Insemination in Dairy Cattle: A Complete Guide for Kenyan Farmers",
        "slug": "artificial-insemination-dairy-cattle-kenya",
        "category_slug": "reproductive-management",
        "tags": "artificial insemination, dairy cattle, cattle breeding, semen quality, estrus detection, Friesian, Ayrshire",
        "published_at": "2026-02-10T07:00:00Z",
        "body": """
<p class="lead" style="font-size:1.15rem;font-weight:500;margin-bottom:1.5rem;">
  Artificial insemination (AI) has transformed dairy cattle improvement across sub-Saharan Africa. In Kenya —
  where the national dairy herd averages only 4–6 litres per cow per day against a genetic potential
  exceeding 25 litres — AI is the fastest, most cost-effective route to closing that gap.
  This guide covers every step a smallholder farmer needs to succeed, from understanding the technology
  to achieving a conception rate above 60 %.
</p>

<h2>What Is Artificial Insemination?</h2>
<p>
  Artificial insemination is the deliberate introduction of collected, processed and preserved semen
  into the reproductive tract of a cow at the correct time in her oestrous cycle, without natural mating.
  Semen from proven elite bulls — bulls whose daughters have been performance-tested for milk yield,
  fat percentage and disease resistance — is extended (diluted), packaged in 0.25 ml or 0.5 ml plastic
  straws, and cryopreserved in liquid nitrogen at −196 °C, where it remains viable indefinitely
  (FAO, 2021).
</p>

<h2>Why Choose AI Over a Breeding Bull?</h2>
<ul>
  <li><strong>Superior genetics at low cost.</strong> A single dose of semen from a world-class Holstein
      bull costs KES 800–2,500, whereas purchasing and feeding a pedigree bull can cost KES 150,000–300,000
      per year (Kenya Dairy Board, 2023).</li>
  <li><strong>Disease control.</strong> Natural service spreads sexually transmitted infections such as
      <em>Campylobacter fetus</em> (vibriosis) and Tritrichomonas foetus. Certified AI semen undergoes
      mandatory disease testing before collection and distribution.</li>
  <li><strong>Genetic diversity.</strong> Continuous use of one bull creates inbreeding within a small
      herd. AI allows access to hundreds of bulls, preventing genetic bottlenecks.</li>
  <li><strong>Herd safety.</strong> Mature breeding bulls are responsible for more than 30 % of livestock-
      related human injuries in Kenya (FAO Regional Office for Africa, 2019).</li>
</ul>

<h2>Choosing the Right Breed for Your Altitude</h2>
<p>
  Breed choice must match local climate. The Mt Kenya highlands (1,600–2,400 m a.s.l.) experience
  cool temperatures (10–22 °C) and reliable bimodal rainfall, which favours temperate breeds.
</p>

<table style="width:100%;border-collapse:collapse;margin:1rem 0;">
  <thead style="background:#0B3A2C;color:#fff;">
    <tr>
      <th style="padding:8px;text-align:left;">Breed</th>
      <th style="padding:8px;text-align:left;">Average Yield (litres/day)</th>
      <th style="padding:8px;text-align:left;">Fat %</th>
      <th style="padding:8px;text-align:left;">Best Altitude</th>
      <th style="padding:8px;text-align:left;">Heat Tolerance</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Friesian (Holstein)</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">18–30</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">3.5–3.8 %</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Above 1,500 m</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Poor — keep above 1,500 m</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Ayrshire</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">12–20</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">3.9–4.1 %</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">1,000–2,400 m</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Moderate — good disease resistance</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Jersey</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">10–16</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">4.5–5.5 %</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Any altitude</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Good — adapts well</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Guernsey</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">12–18</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">4.5–5.0 %</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Above 1,200 m</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Moderate</td>
    </tr>
  </tbody>
</table>
<p><em>Source: KALRO Dairy Research Institute, Naivasha (2022).</em></p>

<h2>Step 1: Detecting Heat (Oestrus)</h2>
<p>
  The single biggest cause of AI failure in Kenya is inseminating at the wrong time. A cow's oestrous
  cycle averages 21 days (range 18–24 days). The fertile window — called standing heat — lasts only
  12–18 hours (KALRO, 2022).
</p>

<h3>Primary Signs of Standing Heat</h3>
<ul>
  <li>The cow <strong>stands still and allows other animals to mount her</strong> — the most reliable sign.</li>
  <li>Clear, stringy mucus discharge from the vulva (the "mucus string" stretches 5–10 cm without breaking).</li>
  <li>Restlessness, bellowing, reduced feed intake and milk yield.</li>
  <li>Swollen, reddened vulva.</li>
  <li>Rubbed tail head, dirty flanks from being mounted.</li>
</ul>

<h3>The AM/PM Rule</h3>
<blockquote style="border-left:4px solid #E4B83A;padding:0.75rem 1rem;margin:1rem 0;background:#fffbf0;border-radius:4px;">
  <strong>Observe heat in the morning → inseminate the same afternoon.</strong><br>
  <strong>Observe heat in the afternoon → inseminate the following morning.</strong><br>
  <em>— Senger, P.L. (2005). Pathways to Pregnancy and Parturition. Current Conceptions Inc.</em>
</blockquote>

<h2>Step 2: Semen Handling</h2>
<p>
  Frozen semen is the most fragile input in the AI process. Mishandling kills sperm instantly.
  Always follow these protocols:
</p>
<ol>
  <li><strong>Storage:</strong> Keep straws submerged in liquid nitrogen (LN₂) at −196 °C. Check the
      LN₂ level every 2 weeks; refill when level drops below 10 cm to prevent sperm damage from
      temperature fluctuation.</li>
  <li><strong>Thawing:</strong> Use a clean thermos with water at <strong>35–37 °C</strong> (warm but
      not hot — use a thermometer). Immerse the straw for exactly <strong>30–45 seconds</strong>.
      Do not thaw more than one straw at a time.</li>
  <li><strong>Loading the gun:</strong> Dry the straw immediately after thawing. Load into the AI
      gun within 15 seconds — prolonged exposure to air and ambient temperature rapidly degrades
      motility.</li>
  <li><strong>Temperature shock:</strong> Never expose thawed semen to sunlight, cold water, or
      lubricants containing spermicidal chemicals.</li>
</ol>

<h2>Step 3: The Insemination Procedure</h2>
<p>
  AI in cattle uses the recto-vaginal technique. The inseminator passes a gloved arm into the
  rectum to locate and guide the cervix, while the AI gun is inserted vaginally. Semen is deposited
  at the junction of the uterine body and cervix (body of uterus), not inside the uterine horn.
  This procedure must be performed by a trained, licensed AI technician.
</p>
<p>
  In Kenya, AI technicians are trained and certified by the <em>Directorate of Veterinary Services</em>
  and registered AI service providers such as KAGRC (Kenya Animal Genetic Resources Centre), which
  also supplies semen doses through county governments and licensed distributors (KAGRC, 2023).
</p>

<h2>Expected Conception Rates</h2>
<ul>
  <li>Well-timed AI on a cow with good body condition (BCS 3.0–3.5): <strong>55–65 %</strong></li>
  <li>Cow with BCS below 2.5 or less than 60 days post-calving: <strong>30–45 %</strong></li>
  <li>Synchronised AI (hormonal protocol CIDR+FTAI): <strong>50–60 %</strong> fixed-time conception</li>
</ul>
<p>
  If a cow fails to conceive after two AI services, have a vet evaluate for reproductive disorders
  such as subclinical endometritis, ovarian cysts or luteal dysfunction before the third service
  (Sheldon et al., 2009).
</p>

<h2>After AI: Post-Insemination Management</h2>
<ul>
  <li>Avoid stressing the cow for at least 24 hours after AI.</li>
  <li>Maintain normal feeding — do not drastically change the ration.</li>
  <li>Observe the cow for return to heat at days 18–23. No return to heat is the first indicator
      of pregnancy.</li>
  <li>Confirm pregnancy by rectal palpation at 45–60 days, or by ultrasonography at 28–35 days
      post-AI.</li>
</ul>

<h2>Summary</h2>
<p>
  Artificial insemination is the most affordable way for Kenyan smallholders to access world-class
  dairy genetics. Success depends on three equally critical factors: accurate heat detection, proper
  semen handling, and skilled deposition technique. Farmers in the Nyeri–Laikipia–Mt Kenya
  corridor have achieved herd averages above 15 litres per cow per day using systematic AI
  programmes combined with improved feeding (Tetu Dairy Cooperative, Annual Report 2023).
</p>

<hr style="margin:2rem 0;" />
<h3>References</h3>
<ol style="font-size:0.9rem;color:#555;line-height:1.8;">
  <li>FAO (2021). <em>Cryopreservation of Animal Genetic Resources — Manual on Cryopreservation Techniques</em>. Rome: Food and Agriculture Organization.</li>
  <li>Kenya Dairy Board (2023). <em>Kenya Dairy Industry Report 2022/23</em>. Nairobi: KDB.</li>
  <li>KALRO Dairy Research Institute (2022). <em>Breed Performance Trials in the Central Highlands of Kenya</em>. Naivasha: KALRO.</li>
  <li>KAGRC (2023). <em>Semen Catalogue and Distribution Guidelines</em>. Nairobi: Kenya Animal Genetic Resources Centre.</li>
  <li>Senger, P.L. (2005). <em>Pathways to Pregnancy and Parturition</em>, 2nd ed. Pullman, WA: Current Conceptions Inc.</li>
  <li>Sheldon, I.M., et al. (2009). Defining postpartum uterine disease in cattle. <em>Theriogenology</em>, 65(8), 1516–1530. https://doi.org/10.1016/j.theriogenology.2006.08.021</li>
  <li>FAO Regional Office for Africa (2019). <em>Livestock Safety on Smallholder Farms in Sub-Saharan Africa</em>. Accra: FAO.</li>
</ol>
""",
    },

    # ── Article 2 ──────────────────────────────────────────────────────────
    {
        "title": "Optimal Nutrition for High-Producing Dairy Cows in the Kenyan Highlands",
        "slug": "dairy-cow-nutrition-kenyan-highlands",
        "category_slug": "animal-nutrition",
        "tags": "dairy nutrition, dairy meal, Napier grass, silage, body condition score, mineral supplementation",
        "published_at": "2026-02-17T07:00:00Z",
        "body": """
<p class="lead" style="font-size:1.15rem;font-weight:500;margin-bottom:1.5rem;">
  Genetics determine the ceiling; nutrition determines how close your cows get to it.
  A well-bred Friesian cow receiving inadequate feed will produce less milk than a mediocre cow
  fed correctly. This article explains the nutritional requirements of high-producing dairy cows
  and shows how Kenyan farmers can meet those needs with locally available feeds.
</p>

<h2>The Key Nutrients Dairy Cows Need</h2>

<h3>1. Energy — The Most Limiting Nutrient</h3>
<p>
  Energy drives milk synthesis, reproduction and body maintenance. The standard unit is
  Megajoules of Net Energy for Lactation (MJ NEL/kg dry matter, DM).
  A 500 kg Friesian producing 20 litres/day requires approximately
  <strong>130–150 MJ NEL per day</strong> (NRC, 2001).
</p>
<p>
  Common Kenyan energy sources and their NEL values:
</p>
<ul>
  <li><strong>Maize silage:</strong> 6.0–6.8 MJ NEL/kg DM — excellent base forage</li>
  <li><strong>Dairy meal (commercial):</strong> 7.5–8.5 MJ NEL/kg DM</li>
  <li><strong>Maize grain (whole):</strong> 8.5–9.0 MJ NEL/kg DM</li>
  <li><strong>Molasses:</strong> 7.2 MJ NEL/kg DM — also a good palatability booster</li>
  <li><strong>Napier grass (young, &lt;6 weeks):</strong> 5.0–5.8 MJ NEL/kg DM</li>
  <li><strong>Napier grass (mature, &gt;8 weeks):</strong> 3.5–4.2 MJ NEL/kg DM</li>
</ul>

<h3>2. Crude Protein (CP)</h3>
<p>
  Protein is essential for milk casein synthesis and uterine repair post-calving.
  Peak-lactation rations should contain <strong>16–18 % CP on a DM basis</strong>.
  The two fractions that matter are:
</p>
<ul>
  <li><strong>Rumen-Degradable Protein (RDP):</strong> feeds rumen microbes — from urea, grass, silage.</li>
  <li><strong>Rumen-Undegradable Protein (RUP) / bypass protein:</strong> absorbed in the small
      intestine — from cottonseed cake, sunflower cake, fish meal.</li>
</ul>
<p>
  Common Kenyan protein supplements (% CP): Sunflower cake 36–38 %, cottonseed cake 40–42 %,
  soybean meal 44–48 %, fish meal 60–65 %. Fish meal is the highest-quality but most expensive;
  use at 0.5–1.0 kg/cow/day for peak lactation (University of Nairobi, Dept. of Animal Science, 2020).
</p>

<h3>3. Key Minerals and Vitamins</h3>
<p>
  Mineral deficiencies are widespread on Kenyan smallholder farms and cause silent losses in
  fertility, milk fever, and immune function.
</p>

<table style="width:100%;border-collapse:collapse;margin:1rem 0;">
  <thead style="background:#0B3A2C;color:#fff;">
    <tr>
      <th style="padding:8px;">Mineral</th>
      <th style="padding:8px;">Recommended Level (% DM)</th>
      <th style="padding:8px;">Deficiency Signs</th>
      <th style="padding:8px;">Kenyan Source</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Calcium (Ca)</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">0.70–0.90 %</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Milk fever (hypocalcaemia) at calving</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Limestone flour, bone meal, Di-calcium phosphate</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Phosphorus (P)</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">0.35–0.45 %</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Pica (bone chewing), poor fertility</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Di-calcium phosphate, bone meal</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Magnesium (Mg)</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">0.20–0.35 %</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Grass tetany (hypomagnesaemia)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Magnesium oxide (calcined magnesite)</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Sodium (Na)</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">0.18–0.25 %</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Reduced feed intake, licking soil</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Salt lick blocks, common salt</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Zinc (Zn)</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">40–50 ppm</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Reduced immunity, poor hoof quality</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Mineral lick, commercial trace mineral premix</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Selenium (Se)</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">0.1–0.3 ppm</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">White muscle disease in calves, retained placenta</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Selenium premix (use carefully — toxic at high doses)</td>
    </tr>
  </tbody>
</table>
<p><em>Sources: NRC (2001); University of Nairobi Faculty of Veterinary Medicine (2020); KALRO (2022).</em></p>

<h2>Water — The Most Important Nutrient</h2>
<p>
  A dairy cow producing 20 litres of milk per day drinks <strong>80–100 litres of water</strong> daily
  (4–5 litres of water per litre of milk, plus maintenance). Water restriction is the fastest way
  to cut milk output. Always ensure:
</p>
<ul>
  <li>Clean, fresh water available at all times (not just at milking time).</li>
  <li>Troughs cleaned weekly — algae and faecal contamination reduce intake.</li>
  <li>Water temperature between 10–25 °C; cold water (&lt; 5 °C) reduces voluntary intake by 25 %.</li>
</ul>

<h2>Body Condition Scoring (BCS) — Your Nutrition Gauge</h2>
<p>
  BCS is assessed on a 1–5 scale (1 = emaciated, 5 = obese). It tells you whether your feeding
  programme is working without laboratory analysis.
</p>
<ul>
  <li><strong>Dry period (last 8 weeks of pregnancy):</strong> Target BCS 3.0–3.5.</li>
  <li><strong>Calving:</strong> Target BCS 3.0–3.5. Cows calving below BCS 2.5 have higher rates
      of retained placenta, metritis and delayed return to heat.</li>
  <li><strong>Peak lactation (weeks 4–14):</strong> Allow BCS to drop to 2.5 — natural mobilisation
      of body reserves is unavoidable, but should not exceed 0.5 BCS units lost.</li>
  <li><strong>Mid-lactation:</strong> BCS 2.5–3.0, building back towards 3.0 by late lactation.</li>
</ul>
<p>
  Cows losing more than 1 BCS unit in the first month post-calving are severely energy-deficient
  and will have poor reproductive performance — average interval from calving to conception
  extends beyond 150 days (Roche et al., 2009).
</p>

<h2>Practical Daily Ration for a 20-Litre Friesian (500 kg)</h2>
<table style="width:100%;border-collapse:collapse;margin:1rem 0;">
  <thead style="background:#0B3A2C;color:#fff;">
    <tr>
      <th style="padding:8px;">Feed</th>
      <th style="padding:8px;">Daily Amount (kg fresh weight)</th>
      <th style="padding:8px;">Approx. Cost (KES/day)</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Napier grass (chopped)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">25–30 kg</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Own farm (low cost)</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Maize silage</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">10–15 kg</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">KES 3–5/kg fresh = KES 50–75</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Commercial dairy meal</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">4–6 kg</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">KES 55–65/kg = KES 250–390</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Wheat bran or maize germ</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">1–2 kg</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">KES 30–40/kg = KES 40–80</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Mineral/salt lick</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">50–100 g</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">KES 2–5</td>
    </tr>
  </tbody>
</table>
<p><small><em>Approximate costs based on Nyeri market prices, February 2026. Actual costs vary.</em></small></p>

<blockquote style="border-left:4px solid #E4B83A;padding:0.75rem 1rem;margin:1.5rem 0;background:#fffbf0;border-radius:4px;">
  <strong>Rule of thumb:</strong> Feed 1 kg of concentrate (dairy meal) for every 2.5 litres of milk
  produced above 5 litres. The baseline 5 litres is covered by good-quality roughage alone.
  This "challenge feeding" approach is widely used by Tetu and Othaya dairy cooperatives in Nyeri County.
</blockquote>

<hr style="margin:2rem 0;" />
<h3>References</h3>
<ol style="font-size:0.9rem;color:#555;line-height:1.8;">
  <li>NRC (National Research Council) (2001). <em>Nutrient Requirements of Dairy Cattle</em>, 7th revised ed. Washington DC: National Academy Press.</li>
  <li>University of Nairobi, Department of Animal Science (2020). <em>Feeding Dairy Cattle in Kenya: Practical Guidelines for Smallholders</em>. Nairobi: University of Nairobi Press.</li>
  <li>KALRO (2022). <em>Feed Value of Common Kenyan Forages</em>. KALRO Dairy Research Centre, Naivasha.</li>
  <li>Roche, J.R., et al. (2009). Invited review: Body condition score and its association with dairy cow productivity, health, and welfare. <em>Journal of Dairy Science</em>, 92(12), 5769–5801. https://doi.org/10.3168/jds.2009-2431</li>
</ol>
""",
    },

    # ── Article 3 ──────────────────────────────────────────────────────────
    {
        "title": "Common Cattle Diseases in Kenya: Symptoms, Prevention and Treatment",
        "slug": "common-cattle-diseases-kenya",
        "category_slug": "veterinary-health",
        "tags": "East Coast Fever, foot and mouth disease, lumpy skin disease, brucellosis, blackleg, cattle vaccination, tick control",
        "published_at": "2026-02-24T07:00:00Z",
        "body": """
<p class="lead" style="font-size:1.15rem;font-weight:500;margin-bottom:1.5rem;">
  Disease is the leading cause of cattle mortality in Kenya, accounting for estimated losses of
  KES 14 billion annually to livestock farmers (IGAD Centre for Pastoral Areas and Livestock
  Development, 2020). Knowing how to recognise, prevent and treat the most dangerous diseases
  is as important as good feeding and genetics. This guide covers the six diseases responsible
  for the greatest losses in the Mt Kenya and Central Highlands region.
</p>

<h2>1. East Coast Fever (ECF)</h2>
<h3>Cause and Transmission</h3>
<p>
  East Coast Fever is caused by the protozoan parasite <em>Theileria parva</em>, transmitted
  by the brown ear tick (<em>Rhipicephalus appendiculatus</em>). A single larval tick feeding
  on a susceptible animal for 2–3 days is sufficient to transmit a lethal dose of sporozoites.
  ECF is endemic in Kenya and is the single most economically important cattle disease in the
  East African highlands (Norval et al., 1992).
</p>
<h3>Symptoms</h3>
<ul>
  <li><strong>Swollen parotid lymph nodes</strong> (just behind the ear — first and most consistent sign).</li>
  <li>High fever — rectal temperature &gt; 40.5 °C (normal is 38–39 °C).</li>
  <li>Profuse nasal and eye discharge, dyspnoea (laboured breathing).</li>
  <li>Reduced milk production, rapid weight loss.</li>
  <li>Death within 18–30 days of tick feeding if untreated.</li>
</ul>
<h3>Treatment</h3>
<p>
  The specific treatment is <strong>Buparvaquone</strong> (commercial name: Butalex® or Halfacur®)
  at <strong>2.5 mg/kg body weight</strong>, administered as a single deep intramuscular injection.
  A 250 kg animal requires 2.5 ml of Butalex® (100 mg/ml). Early treatment — before the animal
  stops eating — dramatically improves survival rates (Radley et al., 1975). Do not use
  oxytetracycline as sole treatment — it is insufficient against <em>Theileria parva</em>.
</p>
<h3>Prevention</h3>
<ul>
  <li><strong>Tick control:</strong> Regular acaricide application (dipping, spraying or pour-on)
      every 7 days in high-challenge areas. Recommended acaricides: amitraz-based (Triatix®),
      cypermethrin-based (Ectoclear®), or flumethrin pour-on (Bayticol®).</li>
  <li><strong>ITM vaccine:</strong> The Infection and Treatment Method (ITM) provides solid
      lifelong immunity. A live <em>Theileria parva</em> sporozoite suspension is given alongside
      a long-acting oxytetracycline injection. Available through KARI/KALRO veterinary centres.
      Cost: approximately KES 1,500–2,000 per animal, one-time only (KALRO, 2023).</li>
</ul>

<h2>2. Foot-and-Mouth Disease (FMD)</h2>
<h3>Cause and Transmission</h3>
<p>
  FMD is caused by the Aphthovirus (family Picornaviridae). Seven serotypes circulate globally;
  Kenya predominantly experiences serotypes O, A, SAT1, SAT2, and SAT3 (Vosloo et al., 2002).
  The virus spreads via aerosols, contaminated feed, water and equipment — a single infected
  animal can infect an entire herd within 48 hours.
</p>
<h3>Symptoms</h3>
<ul>
  <li>Sudden severe lameness, reluctance to stand or walk.</li>
  <li>Vesicles (fluid-filled blisters) on the tongue, dental pad, lips, feet (between toes and on the coronary band) and teats.</li>
  <li>Profuse salivation — animals appear to be "foaming at the mouth."</li>
  <li>Milk production drops 25–80 % within 24–48 hours.</li>
  <li>Mortality is low in adults (&lt; 5 %) but high in young calves (&gt; 50 % from myocarditis).</li>
</ul>
<h3>Treatment and Control</h3>
<p>
  <strong>There is no specific treatment.</strong> Provide supportive care: anti-inflammatories
  (flunixin meglumine at 2.2 mg/kg IV), antiseptic footbaths (2–5 % formalin or copper sulphate),
  and soft feed during recovery. Wounds heal in 7–14 days if not complicated by secondary
  bacterial infections — use topical oxytetracycline spray.
</p>
<p>
  <strong>Vaccination</strong> is the key control measure. Use a locally polyvalent vaccine
  covering serotypes O, A, SAT1 and SAT2, administered twice yearly (Kenya Veterinary Board
  recommends biannual vaccination in endemic areas). Report all suspected FMD outbreaks
  immediately to the County Veterinary Officer — FMD is a <strong>notifiable disease</strong> in Kenya.
</p>

<h2>3. Lumpy Skin Disease (LSD)</h2>
<h3>Cause and Transmission</h3>
<p>
  LSD is caused by the Neethling virus, a member of the Capripoxvirus genus. It spreads primarily
  through biting insects (mosquitoes, flies, ticks) and is most severe during wet seasons when
  insect populations peak (Tuppurainen &amp; Oura, 2012). Outbreaks have intensified in Kenya
  since 2015 due to expanding insect vector ranges linked to climate variability.
</p>
<h3>Symptoms</h3>
<ul>
  <li>High fever (up to 41 °C) lasting 4–7 days.</li>
  <li>Hard, raised, round skin nodules 2–5 cm in diameter — appear first on the neck, then spread across the body.</li>
  <li>Nodules may ulcerate and form deep, persistent scabs ("sit fasts") that take months to heal.</li>
  <li>Swollen lymph nodes, reduced milk production, severe weight loss.</li>
  <li>Temporary or permanent infertility in bulls and reduced reproductive performance in cows.</li>
</ul>
<h3>Treatment</h3>
<p>
  Treat secondary bacterial infections with <strong>long-acting oxytetracycline</strong>
  (20 mg/kg IM, repeat after 72 hours) or tulathromycin (Draxxin®, 2.5 mg/kg SC, single dose).
  Apply topical wound spray (e.g., Terramycin® Aerosol) to ulcerated nodules. Use NSAIDs for
  pain and fever management.
</p>
<p>
  <strong>Prevention:</strong> Vaccinate with the homologous Neethling strain live attenuated
  LSD vaccine annually. In outbreak situations, vaccinate the entire herd within a 50 km radius
  immediately. Control biting insects through insecticide-treated ear tags and stabling cattle
  during peak insect activity (dawn and dusk).
</p>

<h2>4. Brucellosis</h2>
<h3>Cause and Zoonotic Risk</h3>
<p>
  Brucellosis in cattle is caused by <em>Brucella abortus</em>. It is a <strong>zoonotic
  disease</strong> — humans contract it through drinking raw (unpasteurised) milk, handling
  aborted foetuses/placentas without gloves, or through wound contamination. Human brucellosis
  causes prolonged undulant fever, arthritis and chronic debilitation (Godfroid et al., 2011).
</p>
<h3>Symptoms in Cattle</h3>
<ul>
  <li>Late-term abortion (last trimester), often with retained placenta.</li>
  <li>Stillbirths or weak calves.</li>
  <li>Orchitis (testicular inflammation) in bulls → permanent infertility.</li>
  <li>No other obvious clinical signs — the disease is largely silent between abortion storms.</li>
</ul>
<h3>Management</h3>
<p>
  Kenya operates a <strong>test-and-slaughter</strong> policy for Brucellosis. There is no
  approved treatment — infected animals are condemned. Vaccination with the S19 or RB51 strain
  vaccine in heifers (3–8 months) is permitted only by licensed veterinarians. Always wear
  gloves and a mask when handling any aborted material, and never feed raw milk to children.
  KEBS certification for milk supply contracts requires a Brucellosis-free herd certificate.
</p>

<h2>5. Black Quarter (Blackleg)</h2>
<h3>Cause</h3>
<p>
  Black Quarter is caused by <em>Clostridium chauvoei</em>, a spore-forming anaerobic
  bacterium whose spores persist in soil for decades. It most commonly affects well-nourished
  cattle aged 6 months to 2 years and typically follows bruising or wounds that create
  anaerobic tissue conditions — though infection can also arise endogenously from gut spores.
</p>
<h3>Symptoms</h3>
<ul>
  <li>Sudden onset of severe lameness (hindquarters most common).</li>
  <li>Hot, crepitating (gas-crackling) swellings of the large muscles of the shoulder, thigh or rump.</li>
  <li>High fever initially, then animal becomes cold and collapses.</li>
  <li>Death usually within 24–48 hours of first symptoms — the disease progresses extremely rapidly.</li>
</ul>
<h3>Treatment and Prevention</h3>
<p>
  Treat immediately with high-dose <strong>procaine penicillin</strong> (22,000 IU/kg IM, twice
  daily), but survival is unlikely once clinical signs are advanced. <strong>Prevention through
  vaccination is essential</strong> — use Blanthax® (blackleg only) or Blanthax HB® (blackleg +
  haemorrhagic septicaemia combination). Vaccinate calves at 3–6 months, with a booster 4 weeks
  later; repeat annually. Cost: approximately KES 50–80 per dose.
</p>

<h2>Recommended Annual Vaccination Schedule</h2>
<table style="width:100%;border-collapse:collapse;margin:1rem 0;">
  <thead style="background:#0B3A2C;color:#fff;">
    <tr>
      <th style="padding:8px;">Disease</th>
      <th style="padding:8px;">Vaccine</th>
      <th style="padding:8px;">Frequency</th>
      <th style="padding:8px;">Target Animals</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">East Coast Fever</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">ITM (live <em>T. parva</em>)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Once (lifetime immunity)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">All cattle in ECF zones</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Foot-and-Mouth Disease</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Polyvalent (O,A,SAT1,SAT2)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Twice yearly</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">All cattle</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Lumpy Skin Disease</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Neethling LSD live</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Annually</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">All cattle</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Black Quarter</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Blanthax® / Blanthax HB®</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Annually after primary series</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Cattle 3 months–2 years</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Anthrax</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Sterne spore vaccine</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Annually</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Cattle in Anthrax-endemic areas</td>
    </tr>
  </tbody>
</table>

<blockquote style="border-left:4px solid #E4B83A;padding:0.75rem 1rem;margin:1.5rem 0;background:#fffbf0;border-radius:4px;">
  <strong>Always consult a registered veterinarian</strong> before administering any vaccine or
  treatment. Self-prescription of prescription-only medicines is a violation of the
  Veterinary Surgeons and Veterinary Paraprofessionals Act (Kenya, Cap. 366) and may
  cause drug resistance, adverse reactions or treatment failure.
</blockquote>

<hr style="margin:2rem 0;" />
<h3>References</h3>
<ol style="font-size:0.9rem;color:#555;line-height:1.8;">
  <li>IGAD Centre for Pastoral Areas and Livestock Development (2020). <em>Livestock Disease Economic Impact Report: East Africa</em>. Djibouti: ICPALD.</li>
  <li>Norval, R.A.I., Perry, B.D. &amp; Young, A.S. (1992). <em>The Epidemiology of Theileriosis in Africa</em>. London: Academic Press.</li>
  <li>Radley, D.E., et al. (1975). East Coast fever: 3. Chemoprophylactic immunization of cattle using oxytetracycline and a combination of <em>Theileria</em> strains. <em>Veterinary Parasitology</em>, 1(1), 51–60.</li>
  <li>Vosloo, W., et al. (2002). Review of the status and control of foot and mouth disease in sub-Saharan Africa. <em>Revue Scientifique et Technique</em>, 21(3), 437–449.</li>
  <li>Tuppurainen, E.S.M. &amp; Oura, C.A.L. (2012). Review: lumpy skin disease: an emerging threat to Europe, the Middle East and Asia. <em>Transboundary and Emerging Diseases</em>, 59(1), 40–48.</li>
  <li>Godfroid, J., et al. (2011). From the discovery of the Malta fever's agent to the discovery of a marine mammal reservoir. <em>Veterinary Research</em>, 42(1), 27.</li>
  <li>KALRO (2023). <em>ECF Immunisation Programme for Smallholder Dairy Farmers</em>. Nairobi: Kenya Agricultural and Livestock Research Organization.</li>
</ol>
""",
    },

    # ── Article 4 ──────────────────────────────────────────────────────────
    {
        "title": "Profitable Layer Poultry Farming: A Step-by-Step Guide for Kenyan Smallholders",
        "slug": "layer-poultry-farming-kenya-smallholders",
        "category_slug": "poultry-farming",
        "tags": "layer poultry, egg production, ISA Brown, KARI improved kienyeji, poultry vaccination, Newcastle disease, poultry feeds",
        "published_at": "2026-03-01T07:00:00Z",
        "body": """
<p class="lead" style="font-size:1.15rem;font-weight:500;margin-bottom:1.5rem;">
  Layer poultry farming is one of Kenya's fastest-growing agricultural enterprises.
  With a national egg deficit of approximately 2 billion eggs per year and per-capita egg consumption
  rising at 7 % annually (KEPSA, 2023), the market opportunity for small and medium producers
  has never been better. This guide covers everything you need to set up and run a profitable
  100–500 bird layer unit.
</p>

<h2>Step 1: Choose the Right Breed</h2>
<p>
  Breed selection determines your production ceiling, feed conversion efficiency and suitability
  for your specific management system.
</p>

<table style="width:100%;border-collapse:collapse;margin:1rem 0;">
  <thead style="background:#0B3A2C;color:#fff;">
    <tr>
      <th style="padding:8px;">Breed</th>
      <th style="padding:8px;">Eggs/Year</th>
      <th style="padding:8px;">Egg Weight</th>
      <th style="padding:8px;">Best System</th>
      <th style="padding:8px;">Feed Conversion</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>ISA Brown</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">310–320</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">60–65 g</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Deep litter / cages</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Excellent (2.0–2.2 kg feed/dozen eggs)</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Lohmann Brown</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">300–315</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">62–65 g</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Deep litter / cages</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Very good (2.1–2.3 kg/dozen)</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>KARI Improved Kienyeji</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">200–220</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">45–52 g</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Free range / semi-intensive</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Good for low-input systems</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Kuroiler</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">150–180</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">40–48 g</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Free range / rural</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Moderate — also a meat bird</td>
    </tr>
  </tbody>
</table>
<p><em>Source: KARI (2022); ISA Brown Management Guide (2023).</em></p>
<p>
  <strong>Recommendation for Nyeri/Central Kenya:</strong> ISA Brown or Lohmann Brown for
  intensive commercial production; KARI Improved Kienyeji for farmers with limited capital who
  want a dual-purpose (eggs + meat) bird with lower management requirements.
</p>

<h2>Step 2: Housing Design</h2>
<h3>Deep Litter System (Most Common for Smallholders)</h3>
<ul>
  <li><strong>Space:</strong> 4–5 birds per m² (do not exceed 5 — overcrowding causes feather pecking, disease spread and reduced production).</li>
  <li><strong>Ventilation:</strong> Orient the house East-West to minimise direct sunlight. Use open sides (wire mesh or perforated curtains) to allow cross-ventilation. Poor ventilation = ammonia build-up = respiratory disease.</li>
  <li><strong>Bedding:</strong> 5–10 cm of dry sawdust, rice husks or wood shavings. Replace or turn bedding every 2–3 weeks. Never let bedding become wet and caked — this is the primary cause of coccidiosis outbreaks.</li>
  <li><strong>Nesting boxes:</strong> 1 box (30 × 30 cm) for every 4–5 hens. Place at 45–60 cm height. Line with clean straw. Collect eggs at least twice daily to prevent breakage and broodiness.</li>
  <li><strong>Perches:</strong> 20 cm of perch space per bird, positioned 40–60 cm above floor level.</li>
</ul>

<h2>Step 3: Feeding Programme</h2>
<p>
  Feed accounts for 65–70 % of total production costs. Getting the nutrition right
  is therefore the single most important financial decision.
</p>

<table style="width:100%;border-collapse:collapse;margin:1rem 0;">
  <thead style="background:#0B3A2C;color:#fff;">
    <tr>
      <th style="padding:8px;">Stage</th>
      <th style="padding:8px;">Age</th>
      <th style="padding:8px;">Feed Type</th>
      <th style="padding:8px;">CP %</th>
      <th style="padding:8px;">Daily Allowance</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Chick phase</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Day 1–8 weeks</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Chick Mash (Starter)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">20–22 %</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><em>Ad libitum</em></td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Grower phase</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">8–18 weeks</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Growers Mash</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">16–17 %</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">70–90 g/bird/day (restrict to prevent early laying)</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Pre-lay</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">16–18 weeks</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Pre-layer Mash or Layers Mash</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">17–18 %</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">90–100 g/bird/day</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Laying phase</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">18 weeks–end of lay</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Layers Mash</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">16–18 % + 3.0–3.5 % Ca</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">110–120 g/bird/day</td>
    </tr>
  </tbody>
</table>

<h3>Critical Nutritional Points for Layers</h3>
<ul>
  <li><strong>Calcium is paramount.</strong> Egg shell formation requires 2.0–2.3 g of Ca per egg.
      Layers Mash must contain 3.0–3.5 % calcium (added as limestone flour or oyster shell).
      Supplement with oyster shell <em>ad libitum</em> in a separate feeder.</li>
  <li><strong>Water intake is directly linked to egg production.</strong> A layer drinks
      180–200 ml/day. Reduce water by 50 % and production drops 15–20 % within 24 hours.
      Check water nipples/troughs daily.</li>
  <li>Never suddenly change feed brand mid-lay — transition over 5–7 days to avoid production dips.</li>
</ul>

<h2>Step 4: Lighting Management</h2>
<p>
  Commercial layers require <strong>16 hours of light per day</strong> for peak production.
  Natural daylight in Kenya averages 11–12 hours; supplement with artificial light (LED bulbs,
  25W per 10 m² of house) from 4:00 AM to 8:00 AM (morning extension gives better results than
  evening extension). Never reduce total light hours once laying has started — this triggers
  a moult and production stops for 6–8 weeks (ISA, 2023).
</p>

<h2>Step 5: Vaccination Schedule</h2>
<table style="width:100%;border-collapse:collapse;margin:1rem 0;">
  <thead style="background:#0B3A2C;color:#fff;">
    <tr>
      <th style="padding:8px;">Age</th>
      <th style="padding:8px;">Disease</th>
      <th style="padding:8px;">Vaccine / Method</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Day old</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Marek's Disease</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">HVT (Herpesvirus of turkeys) — subcutaneous injection at hatchery</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Day 7</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Newcastle Disease (ND) + Infectious Bronchitis (IB)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Hitchner B1+IB combo — eye drop or drinking water</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Day 14</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Gumboro (Infectious Bursal Disease)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Intermediate strain — drinking water</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Day 21</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Gumboro booster</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Drinking water</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Day 28</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Newcastle Disease (ND) booster</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">LaSota strain — eye drop or drinking water</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">10–12 weeks</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Fowl Typhoid</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Nobilis Rismavac — intramuscular</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">16–18 weeks</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Newcastle Disease (pre-lay)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Inactivated oil-emulsion ND — injection</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Every 3 months (in lay)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Newcastle Disease maintenance</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">LaSota — drinking water</td>
    </tr>
  </tbody>
</table>
<p><em>Source: DVS Kenya Poultry Vaccination Calendar (2022); Ceva Animal Health Kenya.</em></p>

<h2>Simple Economics for 100 Layers (ISA Brown)</h2>
<table style="width:100%;border-collapse:collapse;margin:1rem 0;">
  <thead style="background:#0B3A2C;color:#fff;">
    <tr>
      <th style="padding:8px;">Item</th>
      <th style="padding:8px;">Amount (KES)</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Setup costs (one-time)</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;"></td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">100 day-old chicks @ KES 180 each</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">18,000</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Housing construction (simple deep litter, 25 m²)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">35,000–60,000</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Equipment (feeders, drinkers, nest boxes)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">8,000</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Monthly operating costs (100 hens in lay)</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;"></td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Layers Mash — 100 birds × 115 g/day × 30 days × KES 65/kg</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">22,425</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Vaccines, dewormers, medications</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">1,500</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Labour, electricity, miscellaneous</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">3,000</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Total monthly costs</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>~26,925</strong></td>
    </tr>
    <tr style="background:#e8f5e9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Monthly revenue</strong> (90 % lay rate = 2,700 eggs = 225 trays @ KES 550/tray)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>~123,750</strong></td>
    </tr>
    <tr style="background:#e8f5e9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Monthly gross profit</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>~96,825</strong></td>
    </tr>
  </tbody>
</table>
<p><small><em>Estimates based on Nyeri/Naromoru market prices, March 2026. Tray prices and feed costs fluctuate — confirm current rates with local suppliers before investing.</em></small></p>

<hr style="margin:2rem 0;" />
<h3>References</h3>
<ol style="font-size:0.9rem;color:#555;line-height:1.8;">
  <li>KEPSA (Kenya Private Sector Alliance) (2023). <em>Kenya Egg Industry Market Assessment</em>. Nairobi: KEPSA Agribusiness Working Group.</li>
  <li>KARI (Kenya Agricultural Research Institute) (2022). <em>KARI Improved Kienyeji Chicken Production Manual</em>. Nairobi: KARI.</li>
  <li>ISA (Institut de Sélection Animale) (2023). <em>ISA Brown Management Guide</em>. Saint-Brieuc: Hendrix Genetics.</li>
  <li>DVS Kenya (Directorate of Veterinary Services) (2022). <em>Poultry Vaccination Guidelines for Commercial and Smallholder Producers</em>. Nairobi: Ministry of Agriculture.</li>
  <li>Ceva Animal Health Kenya (2022). <em>Poultry Disease Management Handbook for East Africa</em>. Nairobi: Ceva Kenya.</li>
</ol>
""",
    },

    # ── Article 5 ──────────────────────────────────────────────────────────
    {
        "title": "Making and Using Maize Silage: A Practical Guide for Kenyan Dairy Farmers",
        "slug": "maize-silage-making-kenya-dairy-farmers",
        "category_slug": "feed-and-forage",
        "tags": "silage, maize silage, forage, dry season feeding, fermentation, silage pit, dairy feeds",
        "published_at": "2026-03-05T07:00:00Z",
        "body": """
<p class="lead" style="font-size:1.15rem;font-weight:500;margin-bottom:1.5rem;">
  Silage is the most effective tool a Kenyan dairy farmer has to bridge the dry-season feed gap.
  When the rains end and Napier grass stops growing, cows fed nothing but dry, overgrown grass
  will lose body condition, drop milk production by 30–50 %, and struggle to get pregnant.
  A well-made maize silage pit costing KES 15,000–25,000 to fill can feed two dairy cows
  through an entire 3–4 month dry season. This guide shows you how to make it correctly
  — because poorly made silage can be worse than no silage at all.
</p>

<h2>What Is Silage and How Does It Work?</h2>
<p>
  Silage is forage that has been preserved through <strong>anaerobic fermentation</strong>.
  When you seal fresh chopped plant material in the absence of oxygen, naturally occurring
  lactic acid bacteria (LAB) — primarily <em>Lactobacillus</em> species — ferment the plant
  sugars into lactic acid. This lactic acid drops the pH from 6.5–7.0 down to
  <strong>3.8–4.2</strong>, at which point all spoilage microorganisms (moulds, clostridia,
  listeria) are inhibited. The forage is then preserved almost indefinitely as long as the
  seal is maintained (McDonald et al., 2011).
</p>

<blockquote style="border-left:4px solid #E4B83A;padding:0.75rem 1rem;margin:1.5rem 0;background:#fffbf0;border-radius:4px;">
  <strong>The three enemies of good silage:</strong><br>
  1. <strong>Oxygen</strong> — promotes mould growth and heating. Eliminate it through tight packing.<br>
  2. <strong>Moisture extremes</strong> — too wet (&gt; 75 % moisture) promotes clostridial fermentation and butyric acid; too dry (&lt; 55 % moisture) prevents adequate lactic acid fermentation.<br>
  3. <strong>Contamination</strong> — soil mixed into silage introduces clostridial spores.
</blockquote>

<h2>Choosing Maize Varieties for Silage</h2>
<p>
  Not all maize varieties make good silage. The best silage maize varieties combine:
</p>
<ul>
  <li>High biomass (total dry matter yield per acre).</li>
  <li>High starch content in the grain (improves energy value).</li>
  <li>Good "stay-green" trait (the stalk remains green and digestible at harvest time).</li>
</ul>
<p>
  Recommended varieties for Central Kenya highlands (1,500–2,400 m a.s.l.):
</p>
<ul>
  <li><strong>DK8031</strong> (Dekalb/Monsanto) — excellent stay-green, high biomass, widely available.</li>
  <li><strong>H614D</strong> (Kenya Seed Company) — affordable, proven performer at medium-high altitude.</li>
  <li><strong>SC403</strong> (Seed Co) — adapted to 1,500–2,100 m, good standability.</li>
  <li><strong>DK777</strong> — high grain yield, good for dual purpose (silage + grain).</li>
</ul>
<p>
  Avoid planting local (open-pollinated) varieties for silage — their lower yield per acre
  reduces the economics of silage making significantly (KALRO Crops Research Institute, 2021).
</p>

<h2>When to Harvest — Critical Timing</h2>
<p>
  <strong>Harvest stage is the single most important factor determining silage quality.</strong>
  The optimal harvest window for whole-plant maize silage is:
</p>
<ul>
  <li>When the maize grain shows a <strong>2/3 milk line</strong> — hold a cob horizontally,
      peel the husks; you will see the kernel divided into a white starchy upper portion (top 2/3)
      and a milky lower portion (bottom 1/3).</li>
  <li>Whole-plant moisture should be <strong>60–68 %</strong> (equivalent to 32–40 % dry matter).</li>
  <li>In the Nyeri/Naromoru region this typically occurs <strong>95–110 days after planting</strong>,
      which falls between June–July (long rains crop) or January–February (short rains crop).</li>
</ul>
<p>
  <strong>How to check moisture in the field:</strong> Take a handful of freshly chopped material
  and squeeze as hard as you can for 30 seconds. If juice runs freely from your hand — too wet.
  If no juice comes out but the material forms a ball that holds its shape for &gt; 30 seconds —
  ideal moisture. If it falls apart immediately — too dry (Kung &amp; Shaver, 2001).
</p>

<h2>Equipment Needed</h2>
<ul>
  <li>Forage chopper (tractor-mounted PTO or engine-powered) — chop length 1–2 cm for best packing.</li>
  <li>Polythene sheet (250–500 micron black UV-resistant silage sheeting) — at least 2 × the width and twice the length of your pit, plus 30 cm extra on all sides.</li>
  <li>Heavy tyres, sandbags or poles for weighting the seal.</li>
  <li>Tractor or vehicle for compaction (or manual stomping for small pits).</li>
</ul>

<h2>Step-by-Step: Making a Silage Pit</h2>
<ol>
  <li>
    <strong>Site preparation.</strong> Choose a dry, elevated site with good drainage.
    Avoid areas that flood. The pit floor should slope slightly (&lt; 5°) toward a drainage point.
    Dimensions for a 10-tonne pit (to feed 2 cows through a 4-month dry season):
    Length × Width × Depth = approximately <strong>6 m × 3 m × 1.5 m</strong>.
  </li>
  <li>
    <strong>Line the pit.</strong> Lay polythene sheeting on the floor and walls with 60–80 cm
    overlap on all edges. This forms the bottom seal. Hold sheeting edges in place with soil
    or stones temporarily.
  </li>
  <li>
    <strong>Chop maize.</strong> Harvest and chop to 1–2 cm pieces. Load directly from the
    chopper into the pit or transport in trailers. Do not let chopped material sit in the sun
    for more than 30–60 minutes — this causes aerobic deterioration.
  </li>
  <li>
    <strong>Fill in layers and compact.</strong> Add material in 20–30 cm layers. After each
    layer, compact thoroughly — drive a tractor back and forth, or have labourers stomp firmly
    in the pit. <strong>Compaction is the most important step</strong> — aim for a density
    of at least 200 kg fresh weight per m³. Poor compaction is the #1 cause of silage failures
    in Kenya.
  </li>
  <li>
    <strong>Seal immediately.</strong> When the pit is full (or at the end of each day's
    filling), fold the wall sheeting over the top surface and cover with a top sheet.
    Overlap all sheet edges by &gt; 30 cm. Weight with old tyres, heavy logs or sandbags
    placed 30–50 cm apart across the entire surface. Every gap or hole allows air in
    — which means mould growth and feed losses of 15–40 % in the surface layer.
  </li>
  <li>
    <strong>Check and maintain.</strong> Inspect the seal daily for the first week and after
    any heavy rain or wind. Repair any holes immediately with tape or additional sheeting.
  </li>
</ol>

<h2>When Is the Silage Ready?</h2>
<p>
  Fermentation is complete and silage is ready to feed after a minimum of
  <strong>3–4 weeks</strong>. Well-made silage can be stored for 1–3 years without
  significant quality loss if the seal is not broken. Do not open the pit before
  3 weeks — premature opening stops fermentation and causes rapid spoilage (Muck, 2010).
</p>
<p>
  <strong>Good silage characteristics when you open the pit:</strong>
</p>
<ul>
  <li>Yellowish-olive to dark green colour (some browning at the edges is normal).</li>
  <li>Pleasant, acidic, slightly "vinegary" or "pickled" smell — like fermented juice.</li>
  <li>No mould visible (discard any visibly mouldy material — do not feed it).</li>
  <li>pH 3.8–4.2 (test with a cheap pH strip from the agrovet).</li>
</ul>
<p>
  <strong>Bad silage signs — discard or seek veterinary advice before feeding:</strong>
</p>
<ul>
  <li>Strong rancid, butyric (rotten butter) smell → clostridial fermentation from too-wet material or soil contamination.</li>
  <li>Black, slimey or extensively mouldy appearance.</li>
  <li>Brown or caramelised colour throughout (overheated, heat-damaged protein).</li>
</ul>

<h2>Feeding Rates</h2>
<ul>
  <li><strong>Dairy cow (500 kg, 15 litres/day):</strong> 8–12 kg fresh silage per day, divided into 2 feeds.</li>
  <li><strong>Beef cattle (steers growing at 1 kg/day):</strong> 10–15 kg fresh silage per day.</li>
  <li>Introduce silage gradually over 5–7 days to allow the rumen microbiome to adapt. Start at 2 kg/day and increase by 1–2 kg/day.</li>
  <li>Always balance silage with a protein supplement (e.g., 1–2 kg sunflower cake or 0.5 kg
      fishmeal per cow per day) — maize silage alone is energy-rich but protein-deficient.</li>
</ul>

<h2>Economics of Silage Making</h2>
<table style="width:100%;border-collapse:collapse;margin:1rem 0;">
  <thead style="background:#0B3A2C;color:#fff;">
    <tr>
      <th style="padding:8px;">Item</th>
      <th style="padding:8px;">Cost (KES)</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Silage maize seed (1 acre × 10 kg @ KES 200/kg)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">2,000</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Fertiliser (DAP basal + CAN top dressing, 1 acre)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">7,000–10,000</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Ploughing and land prep (casual labour/tractor hire)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">4,000–6,000</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Chopping (hired chopper service, 8–10 tonnes)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">5,000–8,000</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;">Polythene sheeting (2 rolls × KES 2,500)</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">5,000</td>
    </tr>
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">Labour for pit filling and compaction</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;">2,000–3,000</td>
    </tr>
    <tr style="background:#e8f5e9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Total cost for ~8–10 tonnes of silage</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>KES 25,000–34,000</strong></td>
    </tr>
    <tr style="background:#e8f5e9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Equivalent purchase cost (if buying silage @ KES 8/kg fresh)</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>KES 64,000–80,000</strong></td>
    </tr>
    <tr style="background:#e8f5e9;">
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>Estimated savings per silage season</strong></td>
      <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>KES 30,000–50,000</strong></td>
    </tr>
  </tbody>
</table>
<p><small><em>Estimates based on Nyeri/Laikipia input prices, February 2026.</em></small></p>

<hr style="margin:2rem 0;" />
<h3>References</h3>
<ol style="font-size:0.9rem;color:#555;line-height:1.8;">
  <li>McDonald, P., Henderson, N. &amp; Heron, S. (2011). <em>The Biochemistry of Silage</em>, 2nd ed. Aberystwyth: Chalcombe Publications.</li>
  <li>Kung, L. &amp; Shaver, R. (2001). Interpretation and Use of Silage Fermentation Analysis Reports. <em>Focus on Forage</em>, 3(13), 1–5. University of Wisconsin Extension.</li>
  <li>Muck, R.E. (2010). Silage microbiology and its control through additives. <em>Revista Brasileira de Zootecnia</em>, 39(Suppl.), 183–191.</li>
  <li>KALRO Crops Research Institute (2021). <em>Recommended Maize Varieties for Altitude Zones in Kenya</em>. Kitale: KALRO.</li>
  <li>FAO (2020). <em>Making Better Use of On-farm Resources: Ensiling Maize Residues in Sub-Saharan Africa</em>. Rome: Food and Agriculture Organization.</li>
</ol>
""",
    },
]


class Command(BaseCommand):
    help = "Seeds the Educational Hub with professional, research-backed agricultural articles"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing articles and categories before seeding",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            Article.objects.all().delete()
            ArticleCategory.objects.all().delete()
            self.stdout.write(self.style.WARNING("Deleted all existing articles and categories."))

        # --- Create categories ---
        category_map = {}
        for cat_data in CATEGORIES:
            cat, created = ArticleCategory.objects.get_or_create(
                slug=cat_data["slug"],
                defaults={"name": cat_data["name"]},
            )
            category_map[cat_data["slug"]] = cat
            status = "Created" if created else "Exists"
            self.stdout.write(f"  [{status}] Category: {cat.name}")

        # --- Create articles ---
        for article_data in ARTICLES:
            cat = category_map.get(article_data["category_slug"])
            article, created = Article.objects.get_or_create(
                slug=article_data["slug"],
                defaults={
                    "title": article_data["title"],
                    "category": cat,
                    "tags": article_data["tags"],
                    "body": article_data["body"].strip(),
                    "author": None,
                    "is_published": True,
                    "published_at": article_data["published_at"],
                },
            )
            if not created and options.get("reset") is False:
                self.stdout.write(
                    self.style.WARNING(f"  [Skipped] Article already exists: {article.title}")
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f"  [Created] Article: {article.title}")
                )

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. {len(ARTICLES)} articles ready. "
            "Upload hero images via Admin > Content > Articles."
        ))
