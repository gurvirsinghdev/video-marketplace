import chalk from "chalk";
import { getDB } from "./drizzle";
import slugify from "slugify";
import { tagTable } from "./schemas/app.schema";

if (process.env.UNSAFE_IMPORT_SEED != "allow_unsafe") {
  throw new Error("Please do not import this file.");
}

// prettier-ignore
export const PREDEFINED_TAGS = [
  // Nature & Environment
  "nature", "forest", "mountains", "river", "ocean", "beach", "snow", "rain",
  "desert", "waterfall", "lake", "sky", "sunrise", "sunset", "storm", "clouds",
  "wildlife", "animals", "birds", "insects", "plants", "flowers", "trees",

  // Urban & Architecture
  "city", "street", "buildings", "bridge", "road", "traffic", "lights",
  "streetlights", "architecture", "construction", "skyscraper", "subway",
  "urban", "aerial", "timelapse",

  // People & Lifestyle
  "people", "portrait", "friends", "family", "kids", "fashion", "travel",
  "sports", "fitness", "yoga", "dance", "music", "concert", "party", "festival",
  "work", "education", "technology", "interview", "office", "startup",

  // Vehicles & Motion
  "car", "bike", "motorcycle", "bus", "train", "airplane", "boat", "truck",
  "transport", "driving", "racing", "journey", "commute",

  // Food & Drink
  "food", "cooking", "restaurant", "coffee", "tea", "dessert", "fruits",
  "vegetables", "bar", "wine", "street food",

  // Animals (more specific)
  "dog", "cat", "horse", "lion", "tiger", "elephant", "fish", "bird", "butterfly",

  // Seasons & Weather
  "spring", "summer", "autumn", "winter", "snowfall", "rainy", "fog", "wind",

  // Technology & Abstract
  "computer", "coding", "ai", "robots", "data", "cyber", "hologram",
  "abstract", "background", "loop", "animation",

  // Art & Culture
  "painting", "sculpture", "art", "museum", "history", "heritage",
  "architecture", "design",

  // Emotions & Concepts
  "love", "happiness", "sadness", "freedom", "peace", "adventure", "motivation",
  "success", "focus", "creativity",

  // Miscellaneous / Stock Essentials
  "macro", "closeup", "bokeh", "slow motion", "timelapse", "drone", "night",
  "daytime", "landscape", "urban life", "nature walk", "street view"
];

const db = await getDB();
PREDEFINED_TAGS.map(async (tag) => {
  try {
    await db
      .insert(tagTable)
      .values({
        label: tag.toLowerCase(),
        slug: slugify(tag, { lower: true }),
      })
      .execute();
    console.log(chalk.green(`${tag} Added!`));
  } catch (error) {
    console.log(chalk.red(`${tag}:: ${(error as Error).message}`));
  }
});
