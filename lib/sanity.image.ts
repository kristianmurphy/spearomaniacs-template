import { createImageUrlBuilder } from "@sanity/image-url";
import { sanityClient } from "@/lib/sanity.client";

type SanityImage = {
  asset?: {
    _ref?: string;
    _type?: string;
  };
};

const imageBuilder = createImageUrlBuilder(sanityClient);

export function imageUrl(image?: SanityImage, width = 2200) {
  if (!image?.asset) {
    return null;
  }

  return imageBuilder.image(image).width(width).quality(80).url();
}
