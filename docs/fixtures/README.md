# DripDex Open Fixture Images

This directory contains the first OSS fixture image pack for DripDex. Stored source-image copies and web derivatives are re-saved without EXIF metadata. Source pages are retained so a human can validate species identity and reuse terms before these examples become canonical sample content.

All records are marked `needsHumanValidation: true`.

| # | Category | Fixture | Scientific name | Source page | License | Credit | Web card |
|---|---|---|---|---|---|---|---|
| 001 | bird | House Finch | Haemorhous mexicanus | [Validate source](https://commons.wikimedia.org/wiki/File:House_Finch_(male)_(23934285480).jpg) | Public domain | Shenandoah National Park | `docs/fixtures/web-images/house-finch-card.jpg` |
| 002 | insect | American Snout | Libytheana carinenta | [Validate source](https://commons.wikimedia.org/wiki/File:American_snout_butterfly.jpg) | CC BY-SA 3.0 | Bruce Marlin | `docs/fixtures/web-images/american-snout-card.jpg` |
| 003 | arachnid | Texas Brown Tarantula | Aphonopelma hentzi | [Validate source](https://commons.wikimedia.org/wiki/File:Lost_Maples_Tarantula_2021.jpg) | CC BY 4.0 | Larry D. Moore | `docs/fixtures/web-images/texas-brown-tarantula-card.jpg` |
| 004 | amphibian | Gulf Coast Toad | Incilius nebulifer | [Validate source](https://commons.wikimedia.org/wiki/File:Gulf_Coast_Toad_(Incilius_nebulifer).jpg) | CC BY 2.0 | Peter Paplanus | `docs/fixtures/web-images/gulf-coast-toad-card.jpg` |
| 005 | reptile | Texas Spiny Lizard | Sceloporus olivaceus | [Validate source](https://commons.wikimedia.org/wiki/File:Sceloporus_olivaceus_Wildflower_Center_Austin_Texas_2024.jpg) | CC BY 4.0 | Larry D. Moore | `docs/fixtures/web-images/texas-spiny-lizard-card.jpg` |
| 006 | mammal | White-tailed Deer | Odocoileus virginianus | [Validate source](https://commons.wikimedia.org/wiki/File:White-tailed_deer_(24820987930).jpg) | Public domain | USDA NRCS Texas | `docs/fixtures/web-images/white-tailed-deer-card.jpg` |
| 007 | flowering-plant | Texas Bluebonnet | Lupinus texensis | [Validate source](https://commons.wikimedia.org/wiki/File:Bluebonnet-8100.jpg) | CC BY-SA 3.0 | Loadmaster / David R. Tribble | `docs/fixtures/web-images/texas-bluebonnet-card.jpg` |
| 008 | cactus-succulent | Texas Prickly Pear | Opuntia lindheimeri | [Validate source](https://commons.wikimedia.org/wiki/File:Opuntia_lindheimeri_in_bloom,_Llano_County,_TX_IMG_1921.jpg) | CC BY 3.0 | Billy Hathorn | `docs/fixtures/web-images/texas-prickly-pear-card.jpg` |
| 009 | fungus-lichen | Devil's Cigar | Chorioactis geaster | [Validate source](https://commons.wikimedia.org/wiki/File:Devil%27s_cigar_Chorioactis_geaster.jpg) | CC BY 3.0 | Tim Jones | `docs/fixtures/web-images/devils-cigar-card.jpg` |
| 010 | other-invertebrate | Giant Redheaded Centipede | Scolopendra heros | [Validate source](https://commons.wikimedia.org/wiki/File:Scolopendra_heros.jpg) | CC BY 2.0 | John via Flickr | `docs/fixtures/web-images/giant-redheaded-centipede-card.jpg` |
| 011 | fish | Western Mosquitofish | Gambusia affinis | [Validate source](https://www.fws.gov/media/western-mosquitofish) | U.S. Fish & Wildlife Service public media; verify page terms | U.S. Fish & Wildlife Service | `docs/fixtures/web-images/western-mosquitofish-card.jpg` |
| 012 | mystery | ???? |  | [Validate source](https://www.nps.gov/media/photo/gallery-item.htm?gid=0F9DE195-2BCF-4249-8DEB-DBA24C7C2BA0&id=eb676636-2edd-442f-a74e-39ac26b3259a&pg=0) | National Park Service public media; verify page terms | NPS Photo | `docs/fixtures/web-images/mystery-white-shelf-fungus-card.jpg` |

## Processing Notes

- Full derivatives target a maximum dimension of 1600 px.
- Card derivatives are center-cropped to 800 x 840 px, matching the current creature-card image ratio used in the mockup.
- Thumbnail derivatives are center-cropped to 512 x 512 px.
- Exact GPS is intentionally absent from OSS fixture observations.
- Public/private location behavior should be tested with synthetic coordinates later, not with real source EXIF.
- Synthetic EXIF parser/privacy fixtures live under `tests/fixtures/exif/`.
