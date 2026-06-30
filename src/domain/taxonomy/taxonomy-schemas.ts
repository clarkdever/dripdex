import { z } from "zod";

export const categorySchema = z.enum([
  "bird",
  "mammal",
  "reptile",
  "amphibian",
  "fish",
  "insect",
  "arachnid",
  "other-invertebrate",
  "flowering-plant",
  "cactus-succulent",
  "fungus-lichen",
  "mystery"
]);

export const typeTagSchema = z.enum([
  "Bug",
  "Dark",
  "Flying",
  "Fungi",
  "Grass",
  "Ground",
  "Light",
  "Mystery",
  "Normal",
  "Plant",
  "Poison",
  "Water"
]);

export const foodChainTagSchema = z.enum([
  "Carnivore",
  "Decomposer",
  "Herbivore",
  "Pollinator",
  "Predator",
  "Prey",
  "Producer",
  "Seed Spreader"
]);

export const seasonalitySchema = z.enum([
  "Spring",
  "Summer",
  "Fall",
  "Winter",
  "Year Round"
]);

export const safetyLabelSchema = z.enum([
  "Bites",
  "Do Not Eat",
  "Do Not Touch",
  "Has Thorns",
  "Keep Distance",
  "Look Closely",
  "Poisonous",
  "Venomous"
]);
