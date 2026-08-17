import { slugify } from "./seo";

export interface School { slug: string; name: string; location: string; }

// Notable STEM / magnet high schools — high-intent long-tail targets.
const RAW: [name: string, location: string][] = [
  ["Thomas Jefferson High School for Science and Technology", "Alexandria, VA"],
  ["Stuyvesant High School", "New York, NY"],
  ["Bronx High School of Science", "Bronx, NY"],
  ["Brooklyn Technical High School", "Brooklyn, NY"],
  ["Illinois Mathematics and Science Academy", "Aurora, IL"],
  ["North Carolina School of Science and Mathematics", "Durham, NC"],
  ["Texas Academy of Mathematics and Science", "Denton, TX"],
  ["Bergen County Academies", "Hackensack, NJ"],
  ["Montgomery Blair High School", "Silver Spring, MD"],
  ["Whitney M. Young Magnet High School", "Chicago, IL"],
  ["Phillips Exeter Academy", "Exeter, NH"],
  ["Phillips Academy Andover", "Andover, MA"],
  ["Boston Latin School", "Boston, MA"],
  ["High Technology High School", "Lincroft, NJ"],
  ["Liberal Arts and Science Academy", "Austin, TX"],
  ["Oxford Academy", "Cypress, CA"],
  ["The Harker School", "San Jose, CA"],
  ["Basis Scottsdale", "Scottsdale, AZ"],
  ["Lowell High School", "San Francisco, CA"],
  ["Mission San Jose High School", "Fremont, CA"],
  ["Adlai E. Stevenson High School", "Lincolnshire, IL"],
  ["Detroit Country Day School", "Beverly Hills, MI"],
  ["Eton College", "Windsor, UK"],
  ["Westminster School", "London, UK"],
  ["Raffles Institution", "Singapore"],
  ["NUS High School of Math and Science", "Singapore"],
  ["Fettes College", "Edinburgh, UK"],
  ["Upper Canada College", "Toronto, Canada"],
  ["Melbourne High School", "Melbourne, Australia"],
  ["James Ruse Agricultural High School", "Sydney, Australia"],
];

export const SCHOOLS: School[] = RAW.map(([name, location]) => ({ slug: slugify(name), name, location }));
export function getSchool(slug: string): School | undefined { return SCHOOLS.find((s) => s.slug === slug); }
export function getAllSchoolSlugs(): string[] { return SCHOOLS.map((s) => s.slug); }
