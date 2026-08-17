import { slugify } from "./seo";

// Institution SEO factory: a landing page per university/college targeting
// "simulation software for [institution]" + department-aligned content.
// Real institutions worldwide. Extend freely; generated at build time so it
// stays light in git and scales on Vercel.

export interface Institution {
  slug: string;
  name: string;
  location: string;
  country: string;
  kind: "University" | "Institute" | "College";
}

const RAW: [name: string, location: string, country: string, kind?: Institution["kind"]][] = [
  ["Massachusetts Institute of Technology", "Cambridge, MA", "USA", "Institute"],
  ["Stanford University", "Stanford, CA", "USA"],
  ["California Institute of Technology", "Pasadena, CA", "USA", "Institute"],
  ["Harvard University", "Cambridge, MA", "USA"],
  ["Princeton University", "Princeton, NJ", "USA"],
  ["University of California, Berkeley", "Berkeley, CA", "USA"],
  ["Georgia Institute of Technology", "Atlanta, GA", "USA", "Institute"],
  ["Carnegie Mellon University", "Pittsburgh, PA", "USA"],
  ["University of Michigan", "Ann Arbor, MI", "USA"],
  ["University of Illinois Urbana-Champaign", "Urbana, IL", "USA"],
  ["Cornell University", "Ithaca, NY", "USA"],
  ["Purdue University", "West Lafayette, IN", "USA"],
  ["University of Texas at Austin", "Austin, TX", "USA"],
  ["Texas A&M University", "College Station, TX", "USA"],
  ["University of Washington", "Seattle, WA", "USA"],
  ["University of Wisconsin–Madison", "Madison, WI", "USA"],
  ["University of California, Los Angeles", "Los Angeles, CA", "USA"],
  ["University of California, San Diego", "La Jolla, CA", "USA"],
  ["Columbia University", "New York, NY", "USA"],
  ["Johns Hopkins University", "Baltimore, MD", "USA"],
  ["University of Pennsylvania", "Philadelphia, PA", "USA"],
  ["Northwestern University", "Evanston, IL", "USA"],
  ["Virginia Tech", "Blacksburg, VA", "USA", "Institute"],
  ["Ohio State University", "Columbus, OH", "USA"],
  ["Pennsylvania State University", "University Park, PA", "USA"],
  ["University of Minnesota", "Minneapolis, MN", "USA"],
  ["University of Colorado Boulder", "Boulder, CO", "USA"],
  ["University of Maryland", "College Park, MD", "USA"],
  ["North Carolina State University", "Raleigh, NC", "USA"],
  ["Rensselaer Polytechnic Institute", "Troy, NY", "USA", "Institute"],
  ["University of Cambridge", "Cambridge", "UK"],
  ["University of Oxford", "Oxford", "UK"],
  ["Imperial College London", "London", "UK", "College"],
  ["University College London", "London", "UK", "College"],
  ["University of Edinburgh", "Edinburgh", "UK"],
  ["University of Manchester", "Manchester", "UK"],
  ["University of Bristol", "Bristol", "UK"],
  ["University of Cambridge", "Cambridge", "UK"],
  ["ETH Zurich", "Zurich", "Switzerland", "Institute"],
  ["EPFL", "Lausanne", "Switzerland", "Institute"],
  ["Technical University of Munich", "Munich", "Germany", "Institute"],
  ["RWTH Aachen University", "Aachen", "Germany"],
  ["KIT Karlsruhe Institute of Technology", "Karlsruhe", "Germany", "Institute"],
  ["TU Delft", "Delft", "Netherlands", "Institute"],
  ["KTH Royal Institute of Technology", "Stockholm", "Sweden", "Institute"],
  ["École Polytechnique", "Palaiseau", "France"],
  ["Sorbonne University", "Paris", "France"],
  ["Politecnico di Milano", "Milan", "Italy", "Institute"],
  ["Technion – Israel Institute of Technology", "Haifa", "Israel", "Institute"],
  ["University of Toronto", "Toronto", "Canada"],
  ["University of Waterloo", "Waterloo", "Canada"],
  ["McGill University", "Montreal", "Canada"],
  ["University of British Columbia", "Vancouver", "Canada"],
  ["National University of Singapore", "Singapore", "Singapore"],
  ["Nanyang Technological University", "Singapore", "Singapore"],
  ["Tsinghua University", "Beijing", "China"],
  ["Peking University", "Beijing", "China"],
  ["Shanghai Jiao Tong University", "Shanghai", "China"],
  ["University of Tokyo", "Tokyo", "Japan"],
  ["Kyoto University", "Kyoto", "Japan"],
  ["Tokyo Institute of Technology", "Tokyo", "Japan", "Institute"],
  ["KAIST", "Daejeon", "South Korea", "Institute"],
  ["Seoul National University", "Seoul", "South Korea"],
  ["Indian Institute of Technology Bombay", "Mumbai", "India", "Institute"],
  ["Indian Institute of Technology Delhi", "New Delhi", "India", "Institute"],
  ["Indian Institute of Technology Madras", "Chennai", "India", "Institute"],
  ["Indian Institute of Science", "Bengaluru", "India", "Institute"],
  ["University of Melbourne", "Melbourne", "Australia"],
  ["University of Sydney", "Sydney", "Australia"],
  ["University of New South Wales", "Sydney", "Australia"],
  ["Australian National University", "Canberra", "Australia"],
  ["University of Cape Town", "Cape Town", "South Africa"],
  ["University of São Paulo", "São Paulo", "Brazil"],
  ["Pontificia Universidad Católica de Chile", "Santiago", "Chile"],
  ["Delft University of Technology", "Delft", "Netherlands", "Institute"],
  ["Chalmers University of Technology", "Gothenburg", "Sweden", "Institute"],
  ["Aalto University", "Espoo", "Finland"],
  ["Technical University of Denmark", "Kongens Lyngby", "Denmark", "Institute"],
  ["Norwegian University of Science and Technology", "Trondheim", "Norway"],
  ["University of Michigan–Dearborn", "Dearborn, MI", "USA"],
  ["Arizona State University", "Tempe, AZ", "USA"],
  ["University of Florida", "Gainesville, FL", "USA"],
  ["University of Southern California", "Los Angeles, CA", "USA"],
  ["Boston University", "Boston, MA", "USA"],
  ["Rice University", "Houston, TX", "USA"],
  ["Duke University", "Durham, NC", "USA"],
  ["Vanderbilt University", "Nashville, TN", "USA"],
  ["Case Western Reserve University", "Cleveland, OH", "USA"],
  ["Colorado School of Mines", "Golden, CO", "USA", "College"],
  ["Worcester Polytechnic Institute", "Worcester, MA", "USA", "Institute"],
  ["Illinois Institute of Technology", "Chicago, IL", "USA", "Institute"],
  ["Stevens Institute of Technology", "Hoboken, NJ", "USA", "Institute"],
  ["University of California, Davis", "Davis, CA", "USA"],
  ["University of California, Santa Barbara", "Santa Barbara, CA", "USA"],
  // More US research universities
  ["University of Michigan State", "East Lansing, MI", "USA"],
  ["University of Notre Dame", "Notre Dame, IN", "USA"],
  ["Brown University", "Providence, RI", "USA"],
  ["Yale University", "New Haven, CT", "USA"],
  ["University of Chicago", "Chicago, IL", "USA"],
  ["University of Rochester", "Rochester, NY", "USA"],
  ["Lehigh University", "Bethlehem, PA", "USA"],
  ["Clarkson University", "Potsdam, NY", "USA"],
  ["Rochester Institute of Technology", "Rochester, NY", "USA", "Institute"],
  ["New Jersey Institute of Technology", "Newark, NJ", "USA", "Institute"],
  ["Missouri University of Science and Technology", "Rolla, MO", "USA"],
  ["Michigan Technological University", "Houghton, MI", "USA"],
  ["Oregon State University", "Corvallis, OR", "USA"],
  ["University of Utah", "Salt Lake City, UT", "USA"],
  ["University of Arizona", "Tucson, AZ", "USA"],
  ["Iowa State University", "Ames, IA", "USA"],
  ["University of Tennessee", "Knoxville, TN", "USA"],
  ["Auburn University", "Auburn, AL", "USA"],
  ["Clemson University", "Clemson, SC", "USA"],
  ["University of Central Florida", "Orlando, FL", "USA"],
  // Colleges
  ["Harvey Mudd College", "Claremont, CA", "USA", "College"],
  ["Olin College of Engineering", "Needham, MA", "USA", "College"],
  ["Cooper Union", "New York, NY", "USA", "College"],
  ["Rose-Hulman Institute of Technology", "Terre Haute, IN", "USA", "Institute"],
  ["Dartmouth College", "Hanover, NH", "USA", "College"],
  ["Swarthmore College", "Swarthmore, PA", "USA", "College"],
  ["Williams College", "Williamstown, MA", "USA", "College"],
  // International
  ["University of Waterloo Engineering", "Waterloo", "Canada"],
  ["University of Alberta", "Edmonton", "Canada"],
  ["Monash University", "Melbourne", "Australia"],
  ["University of Queensland", "Brisbane", "Australia"],
  ["Peking University HSBC", "Shenzhen", "China"],
  ["Zhejiang University", "Hangzhou", "China"],
  ["Fudan University", "Shanghai", "China"],
  ["Osaka University", "Osaka", "Japan"],
  ["Tohoku University", "Sendai", "Japan"],
  ["Pohang University of Science and Technology", "Pohang", "South Korea", "Institute"],
  ["Indian Institute of Technology Kanpur", "Kanpur", "India", "Institute"],
  ["Indian Institute of Technology Kharagpur", "Kharagpur", "India", "Institute"],
  ["Technical University of Berlin", "Berlin", "Germany", "Institute"],
  ["University of Stuttgart", "Stuttgart", "Germany"],
  ["Politecnico di Torino", "Turin", "Italy", "Institute"],
  ["Universidad Politécnica de Madrid", "Madrid", "Spain"],
  ["Lund University", "Lund", "Sweden"],
  ["University of Twente", "Enschede", "Netherlands"],
];

export const DEPARTMENTS = [
  "Mechanical Engineering",
  "Aerospace Engineering",
  "Electrical Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Physics",
  "Applied Mathematics",
  "Materials Science",
  "Biomedical Engineering",
  "Computer Science",
];

export const INSTITUTIONS: Institution[] = (() => {
  const seen = new Set<string>();
  const out: Institution[] = [];
  for (const [name, location, country, kind] of RAW) {
    const slug = slugify(name);
    if (seen.has(slug)) continue; // dedupe accidental repeats
    seen.add(slug);
    out.push({ slug, name, location, country, kind: kind ?? "University" });
  }
  return out;
})();

export function getInstitution(slug: string): Institution | undefined {
  return INSTITUTIONS.find((i) => i.slug === slug);
}
export function getAllInstitutionSlugs(): string[] {
  return INSTITUTIONS.map((i) => i.slug);
}
export function institutionsByCountry(): Record<string, Institution[]> {
  const out: Record<string, Institution[]> = {};
  for (const i of INSTITUTIONS) (out[i.country] ??= []).push(i);
  return out;
}

export function departmentSlug(d: string): string { return slugify(d); }
export function getDepartmentBySlug(slug: string): string | undefined {
  return DEPARTMENTS.find((d) => slugify(d) === slug);
}
// institution × department pairs for the SEO factory.
export function institutionDepartmentPairs(): { institution: string; department: string }[] {
  const out: { institution: string; department: string }[] = [];
  for (const i of INSTITUTIONS) for (const d of DEPARTMENTS) out.push({ institution: i.slug, department: slugify(d) });
  return out;
}
