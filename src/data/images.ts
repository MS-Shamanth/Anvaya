/**
 * Catalogue photography — GENERATED FILE, do not hand-edit.
 *
 * Openly licensed photos (Wikimedia Commons / Openverse), centre-cropped to 4:3,
 * compressed, and served from public/catalogue/ rather than hotlinked.
 *
 * Coverage is deliberately partial. Contemporary luxury product photography is
 * not available under an open licence, so only images that are genuinely
 * accurate to their listing are included here. Every other piece renders the
 * generated ProductPlate instead, which is on-brand and does not misrepresent
 * the goods. Drop a file at public/catalogue/<listing-id>.jpg, or set a
 * listing's imageUrl, and it will be picked up automatically.
 */

import type { Category } from '../types';

/** Seed listing id -> local image path. */
export const LISTING_IMAGES: Record<string, string> = {
  'l-002': '/catalogue/l-002.jpg',
  'l-004': '/catalogue/l-004.jpg',
  'l-005': '/catalogue/l-005.jpg',
  'l-011': '/catalogue/l-011.jpg',
  'l-013': '/catalogue/l-013.jpg',
  'l-014': '/catalogue/l-014.jpg',
  'l-016': '/catalogue/l-016.jpg',
  'l-018': '/catalogue/l-018.jpg',
  'l-019': '/catalogue/l-019.jpg',
  'l-020': '/catalogue/l-020.jpg',
  'l-021': '/catalogue/l-021.jpg',
};

/** Category stand-ins, used for pieces created at runtime. */
export const CATEGORY_IMAGES: Partial<Record<Category, string>> = {
  Handbags: '/catalogue/category-handbags.jpg',
  Objet: '/catalogue/category-objet.jpg',
};

export interface Credit {
  image: string;
  title: string;
  creator: string;
  license: string;
  source: string;
  origin: string;
}

export const CATALOGUE_CREDITS: Credit[] = [
  { image: '/catalogue/l-002.jpg', title: "Patek-Philippe-Nautilus-5711-1A-010-1.jpg", creator: "Patek Philippe SA", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Patek-Philippe-Nautilus-5711-1A-010-1.jpg", origin: "Wikimedia Commons" },
  { image: '/catalogue/l-004.jpg', title: "Omega Speedmaster Omega Speedmaster Schumacher Edition compo.jpg", creator: "https://commons.wikimedia.org/wiki/User:Pittigrilli (the abo", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Omega_Speedmaster_Omega_Speedmaster_Schumacher_Edition_compo.jpg", origin: "Wikimedia Commons" },
  { image: '/catalogue/l-005.jpg', title: "Jaeger-LeCoultre Reverso Tribute Moon", creator: "Johnson Watch Co", license: "PDM 1.0", source: "https://www.flickr.com/photos/150219019@N03/41664293501", origin: "Openverse" },
  { image: '/catalogue/l-011.jpg', title: "Gold Bracelet MET 52 76 1 MED s01.jpg", creator: "Wikimedia Commons contributor", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Gold_Bracelet_MET_52_76_1_MED_s01.jpg", origin: "Wikimedia Commons" },
  { image: '/catalogue/l-013.jpg', title: "Close-up of a red velvet lehenga with intricate gold embroidery, featu", creator: "Iwaqarhashmi", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Close-up_of_a_red_velvet_lehenga_with_intricate_gold_embroidery,_featuring_a_choli_and_a_flowing_skirt.jpg", origin: "Wikimedia Commons" },
  { image: '/catalogue/l-014.jpg', title: "Carien VDC Evening Gown Photoshoot Part 2.jpg", creator: "Captain Crunch", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Carien_VDC_Evening_Gown_Photoshoot_Part_2.jpg", origin: "Wikimedia Commons" },
  { image: '/catalogue/l-016.jpg', title: "Leather soled shoes - MTO shoe (custom-carving).jpg", creator: "Veritas Bespoke", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Leather_soled_shoes_-_MTO_shoe_(custom-carving).jpg", origin: "Wikimedia Commons" },
  { image: '/catalogue/l-018.jpg', title: "Crystal decanter 01 (31689105656).png", creator: "Rebecca Hardgrave", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Crystal_decanter_01_(31689105656).png", origin: "Wikimedia Commons" },
  { image: '/catalogue/l-019.jpg', title: "'Damiers Vase' by Ren\u00e9 Lalique, molded glass, Dayton Art Institute.JPG", creator: "Wmpearl", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:%27Damiers_Vase%27_by_Ren%C3%A9_Lalique,_molded_glass,_Dayton_Art_Institute.JPG", origin: "Wikimedia Commons" },
  { image: '/catalogue/l-020.jpg', title: "Vintage Benrus Manual-Wind Watch, 10 K. Rolled Gold Bezel (10268276634", creator: "Joe Haupt from USA", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Vintage_Benrus_Manual-Wind_Watch,_10_K._Rolled_Gold_Bezel_(10268276634).jpg", origin: "Wikimedia Commons" },
  { image: '/catalogue/l-021.jpg', title: "Must de Cartier Tank wristshot", creator: "GuySie", license: "BY-SA 2.0", source: "https://www.flickr.com/photos/76491533@N00/8711446365", origin: "Openverse" },
  { image: '/catalogue/category-handbags.jpg', title: "Geometric leather handbags by Sarah Jane Wilson, Bovey Tracey Craft Fa", creator: "gruntzooki", license: "BY-SA 2.0", source: "https://www.flickr.com/photos/37996580417@N01/14370487921", origin: "Openverse" },
  { image: '/catalogue/category-objet.jpg', title: "Elegant vintage crystal glassware", creator: "artinstitutechicago", license: "CC0 1.0", source: "https://www.rawpixel.com/image/9029547/goblet", origin: "Openverse" },
];

/** Credit for a given image path, if the image is one of ours. */
export const creditFor = (image: string | undefined): Credit | undefined =>
  image ? CATALOGUE_CREDITS.find((credit) => credit.image === image) : undefined;
