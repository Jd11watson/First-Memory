// inference.js — derives `industry` and `region` from a contact's raw fields.
//
// SWAPPABLE MODULE. Everything here is keyword-rule heuristics chosen so v1 runs
// fully offline. The public surface is intentionally tiny:
//
//     inferIndustry({ title, company })  -> industry key (see INDUSTRIES)
//     inferRegion({ city, country })     -> region key   (see REGIONS)
//
// Phase 2 can replace the bodies of these two functions with an LLM classifier
// (feed title+company / city, get a bucket back) WITHOUT touching callers, the
// store, or the views. Keep the signatures and the returned keys stable.
//
// Derived values are always overridable: the store records a `userOverride` flag
// per field, and re-inference must never clobber a user-corrected value.

// --- Industry taxonomy -------------------------------------------------------
// 8 colored buckets mapped to the 8 categorical palette slots (fixed order,
// never cycled) + a neutral "Other" that absorbs everything unmatched. The
// dataviz method caps categorical hues at 8, so Nonprofit/Government/unknown all
// fold into the neutral "Other" cluster rather than minting a 9th hue.
export const INDUSTRIES = [
  { key: 'tech', label: 'Tech', slot: 0 },
  { key: 'finance', label: 'Finance', slot: 1 },
  { key: 'legal', label: 'Legal', slot: 2 },
  { key: 'healthcare', label: 'Healthcare', slot: 3 },
  { key: 'creative', label: 'Creative', slot: 4 },
  { key: 'realestate', label: 'Real Estate', slot: 5 },
  { key: 'education', label: 'Education', slot: 6 },
  { key: 'salesmarketing', label: 'Sales & Marketing', slot: 7 },
  { key: 'other', label: 'Other', slot: -1 }, // neutral gray, not a categorical slot
]

export const INDUSTRY_LABEL = Object.fromEntries(INDUSTRIES.map((i) => [i.key, i.label]))

// Ordered rules: first bucket whose keyword hits (in title, then company) wins.
// Order matters — more specific buckets sit above generic ones.
const INDUSTRY_RULES = [
  { key: 'legal', kw: ['attorney', 'lawyer', 'counsel', 'paralegal', 'litigation', 'law firm', ' llp', 'legal', 'solicitor', 'barrister'] },
  { key: 'healthcare', kw: ['doctor', 'physician', 'nurse', 'surgeon', 'md,', 'clinical', 'medical', 'pharma', 'biotech', 'health', 'hospital', 'therapist', 'dentist', 'veterinar'] },
  { key: 'realestate', kw: ['real estate', 'realtor', 'broker', 'property', 'realty', 'mortgage', 'leasing', 'commercial real'] },
  { key: 'education', kw: ['teacher', 'professor', 'lecturer', 'dean', 'principal', 'university', 'college', 'school', 'academic', 'phd candidate', 'researcher', 'education'] },
  { key: 'finance', kw: ['finance', 'financial', 'investment', 'investor', 'banker', 'banking', 'capital', 'ventures', 'private equity', 'hedge fund', 'analyst', 'accountant', 'cpa', 'wealth', 'trading', 'asset management', 'cfo', 'actuary'] },
  { key: 'creative', kw: ['designer', 'design', 'artist', 'creative', 'photographer', 'writer', 'author', 'film', 'music', 'producer', 'architect', 'illustrator', 'brand studio', 'agency', 'ux', 'ui'] },
  { key: 'tech', kw: ['engineer', 'developer', 'software', 'programmer', 'data scientist', 'devops', 'cto', 'technology', 'technical', 'it ', 'machine learning', 'ai ', 'cloud', 'platform', 'infrastructure', 'security', 'sre', 'product manager'] },
  { key: 'salesmarketing', kw: ['sales', 'marketing', 'account executive', 'business development', 'growth', 'demand gen', 'seo', 'brand manager', 'partnerships', 'revenue', 'crm'] },
]

export function inferIndustry({ title = '', company = '' } = {}) {
  const hay = `${title} ${company}`.toLowerCase()
  for (const rule of INDUSTRY_RULES) {
    if (rule.kw.some((k) => hay.includes(k))) return rule.key
  }
  return 'other'
}

// --- Region taxonomy ---------------------------------------------------------
// Regions double as categorical entities in the Geographic view, so they also
// stay <= 8. Unknown cities fold into "Other".
export const REGIONS = [
  { key: 'na-west', label: 'North America — West' },
  { key: 'na-east', label: 'North America — East' },
  { key: 'na-central', label: 'North America — Central' },
  { key: 'europe', label: 'Europe' },
  { key: 'apac', label: 'Asia-Pacific' },
  { key: 'latam', label: 'Latin America' },
  { key: 'mea', label: 'Middle East & Africa' },
  { key: 'other', label: 'Other' },
]

export const REGION_LABEL = Object.fromEntries(REGIONS.map((r) => [r.key, r.label]))

// City -> region lookup. A pragmatic starter set; unknown cities fall back to
// country-level hints, then "Other". Phase 2 (real map) swaps this for geocoding
// + reverse lookup — see GeographicView for where latLng plugs in.
const CITY_REGION = {
  'san francisco': 'na-west', 'oakland': 'na-west', 'san jose': 'na-west', 'los angeles': 'na-west',
  'san diego': 'na-west', 'seattle': 'na-west', 'portland': 'na-west', 'vancouver': 'na-west',
  'new york': 'na-east', 'brooklyn': 'na-east', 'boston': 'na-east', 'philadelphia': 'na-east',
  'washington': 'na-east', 'atlanta': 'na-east', 'miami': 'na-east', 'toronto': 'na-east',
  'chicago': 'na-central', 'austin': 'na-central', 'dallas': 'na-central', 'denver': 'na-central',
  'houston': 'na-central', 'minneapolis': 'na-central',
  'london': 'europe', 'paris': 'europe', 'berlin': 'europe', 'amsterdam': 'europe',
  'madrid': 'europe', 'barcelona': 'europe', 'dublin': 'europe', 'zurich': 'europe', 'stockholm': 'europe',
  'singapore': 'apac', 'tokyo': 'apac', 'sydney': 'apac', 'melbourne': 'apac', 'hong kong': 'apac',
  'bangalore': 'apac', 'mumbai': 'apac', 'shanghai': 'apac', 'seoul': 'apac',
  'mexico city': 'latam', 'sao paulo': 'latam', 'buenos aires': 'latam', 'bogota': 'latam',
  'dubai': 'mea', 'tel aviv': 'mea', 'cape town': 'mea', 'lagos': 'mea', 'nairobi': 'mea',
}

const COUNTRY_REGION = {
  usa: 'na-east', 'united states': 'na-east', canada: 'na-east',
  uk: 'europe', 'united kingdom': 'europe', germany: 'europe', france: 'europe', spain: 'europe',
  singapore: 'apac', japan: 'apac', australia: 'apac', india: 'apac', china: 'apac',
  mexico: 'latam', brazil: 'latam', argentina: 'latam',
  uae: 'mea', israel: 'mea', 'south africa': 'mea', nigeria: 'mea', kenya: 'mea',
}

export function inferRegion({ city = '', country = '' } = {}) {
  const c = city.trim().toLowerCase()
  if (CITY_REGION[c]) return CITY_REGION[c]
  const co = country.trim().toLowerCase()
  if (COUNTRY_REGION[co]) return COUNTRY_REGION[co]
  return 'other'
}
