// sampleContacts.js — seed data so every view is populated on first load.
// Realistic spread across the 8 industry buckets and several regions. Only raw
// fields are set here; industry/region are inferred by the store on ingest
// (a few use overrides to show that path). tags drive shared-group affinity.

export const SAMPLE_CONTACTS = [
  // --- Tech ---
  { name: 'Maya Chen', company: 'Stripe', title: 'Staff Software Engineer', city: 'San Francisco', country: 'USA', strength: 5, tags: ['college', 'climbing'] },
  { name: 'Devin Park', company: 'Vercel', title: 'Frontend Engineer', city: 'Brooklyn', country: 'USA', strength: 3, tags: ['ex-google'] },
  { name: 'Priya Nair', company: 'Databricks', title: 'Data Scientist', city: 'Bangalore', country: 'India', strength: 2, tags: ['conference'] },
  { name: 'Tomás Rivera', company: 'Cloudflare', title: 'Site Reliability Engineer', city: 'Austin', country: 'USA', strength: 4, tags: ['climbing'] },
  { name: 'Anna Kowalski', company: 'Datadog', title: 'Engineering Manager', city: 'London', country: 'UK', strength: 3, tags: ['ex-google', 'conference'] },
  { name: 'Ken Watanabe', company: 'Rakuten', title: 'Cloud Architect', city: 'Tokyo', country: 'Japan', strength: 2, tags: [] },

  // --- Finance ---
  { name: 'Robert Ellis', company: 'Goldman Sachs', title: 'VP, Investment Banking', city: 'New York', country: 'USA', strength: 4, tags: ['college'] },
  { name: 'Sofia Marchetti', company: 'Andreessen Horowitz', title: 'Partner, Ventures', city: 'San Francisco', country: 'USA', strength: 5, tags: ['founder', 'poker'] },
  { name: 'Liam O’Brien', company: 'BlackRock', title: 'Portfolio Analyst', city: 'London', country: 'UK', strength: 2, tags: [] },
  { name: 'Grace Liu', company: 'Sequoia Capital', title: 'Investor', city: 'Menlo Park', country: 'USA', strength: 3, tags: ['founder'] },
  { name: 'Daniel Weiss', company: 'Bridgewater', title: 'CFA, Hedge Fund Analyst', city: 'Boston', country: 'USA', strength: 2, tags: ['poker'] },

  // --- Legal ---
  { name: 'Nadia Haddad', company: 'Latham & Watkins LLP', title: 'Corporate Attorney', city: 'New York', country: 'USA', strength: 3, tags: ['college'] },
  { name: 'Marcus Bell', company: 'Independent', title: 'General Counsel', city: 'Chicago', country: 'USA', strength: 4, tags: [] },
  { name: 'Elena Popova', company: 'Clifford Chance', title: 'Litigation Associate', city: 'London', country: 'UK', strength: 2, tags: ['conference'] },

  // --- Healthcare ---
  { name: 'Dr. Aisha Rahman', company: 'Mass General', title: 'Attending Physician', city: 'Boston', country: 'USA', strength: 5, tags: ['family-friend'] },
  { name: 'James Okafor', company: 'Genentech', title: 'Clinical Research Lead', city: 'San Francisco', country: 'USA', strength: 3, tags: ['climbing'] },
  { name: 'Hannah Berg', company: 'Novartis', title: 'Pharma Product Manager', city: 'Zurich', country: 'Switzerland', strength: 2, tags: ['conference'] },
  { name: 'Ravi Menon', company: 'Apollo Hospitals', title: 'Cardiac Surgeon', city: 'Mumbai', country: 'India', strength: 2, tags: [] },

  // --- Creative ---
  { name: 'Camila Duarte', company: 'Pentagram', title: 'Brand Designer', city: 'New York', country: 'USA', strength: 4, tags: ['art-class'] },
  { name: 'Owen Fitzgerald', company: 'Freelance', title: 'Photographer & Filmmaker', city: 'Los Angeles', country: 'USA', strength: 3, tags: ['art-class'] },
  { name: 'Yuki Tanaka', company: 'Studio Ghibli', title: 'Illustrator', city: 'Tokyo', country: 'Japan', strength: 2, tags: [] },
  { name: 'Isabelle Laurent', company: 'Ogilvy', title: 'Creative Director', city: 'Paris', country: 'France', strength: 3, tags: ['conference'] },
  { name: 'Noah Schwartz', company: 'Foster + Partners', title: 'Architect', city: 'London', country: 'UK', strength: 2, tags: [] },

  // --- Real Estate ---
  { name: 'Gina Alvarez', company: 'CBRE', title: 'Commercial Real Estate Broker', city: 'Miami', country: 'USA', strength: 4, tags: ['poker'] },
  { name: 'Peter Zhang', company: 'Related Companies', title: 'Property Developer', city: 'New York', country: 'USA', strength: 3, tags: [] },
  { name: 'Farah Nasser', company: 'Emaar', title: 'Leasing Director', city: 'Dubai', country: 'UAE', strength: 2, tags: [] },

  // --- Education ---
  { name: 'Prof. Alan Mercer', company: 'Stanford University', title: 'Professor of Computer Science', city: 'San Francisco', country: 'USA', strength: 5, tags: ['college', 'mentor'] },
  { name: 'Beatrice Nkemelu', company: 'UCL', title: 'Lecturer', city: 'London', country: 'UK', strength: 2, tags: [] },
  { name: 'Diego Herrera', company: 'Independent', title: 'High School Teacher', city: 'Mexico City', country: 'Mexico', strength: 3, tags: ['family-friend'] },
  { name: 'Sarah Kim', company: 'MIT', title: 'PhD Candidate, Robotics', city: 'Boston', country: 'USA', strength: 4, tags: ['climbing', 'mentor'] },

  // --- Sales & Marketing ---
  { name: 'Brandon Scott', company: 'Salesforce', title: 'Account Executive', city: 'Chicago', country: 'USA', strength: 3, tags: ['poker'] },
  { name: 'Lucia Ferrari', company: 'HubSpot', title: 'Head of Growth Marketing', city: 'Dublin', country: 'Ireland', strength: 4, tags: ['conference'] },
  { name: 'Kwame Mensah', company: 'Meta', title: 'Partnerships Lead', city: 'Singapore', country: 'Singapore', strength: 2, tags: ['ex-google'] },
  { name: 'Rachel Green', company: 'Independent', title: 'Brand Manager & Consultant', city: 'Los Angeles', country: 'USA', strength: 3, tags: ['art-class'] },

  // --- Mixed / edge cases (some fold into Other, one manual override) ---
  { name: 'Oliver Bennett', company: 'Red Cross', title: 'Program Director', city: 'Nairobi', country: 'Kenya', strength: 2, tags: ['volunteer'] },
  { name: 'Mei Lin', company: 'City of Seattle', title: 'Policy Advisor', city: 'Seattle', country: 'USA', strength: 3, tags: ['volunteer'] },
  { name: 'Carlos Mendes', company: 'Nubank', title: 'Product Manager', city: 'Sao Paulo', country: 'Brazil', strength: 3, tags: ['founder'] },
  { name: 'Freya Andersen', company: 'Spotify', title: 'Music Producer', city: 'Stockholm', country: 'Sweden', strength: 2, tags: ['art-class'] },
  { name: 'Tariq Aziz', company: 'Careem', title: 'Growth Lead', city: 'Dubai', country: 'UAE', strength: 3, tags: [] },
  { name: 'Jason Cole', company: 'Self-employed', title: 'Founder & CEO', city: 'Austin', country: 'USA', strength: 5, tags: ['founder', 'climbing'],
    // demonstrate an override: title alone would fall to "Other"; user classified it
    industry: 'tech', industryOverride: true },
  { name: 'Emma Thompson', company: 'Deloitte', title: 'Management Consultant', city: 'Toronto', country: 'Canada', strength: 3, tags: ['college'] },
  { name: 'Victor Nguyen', company: 'Airbnb', title: 'Senior Product Designer', city: 'San Francisco', country: 'USA', strength: 4, tags: ['art-class', 'climbing'] },
]
